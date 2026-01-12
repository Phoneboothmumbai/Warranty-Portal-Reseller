"""
SaaS Organization Service
Handles multi-tenant operations, onboarding, and feature gating
"""
import os
import logging
import uuid
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Trial period in days
TRIAL_DAYS = 14


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from organization name"""
    # Convert to lowercase, replace spaces with hyphens
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[\s_]+', '-', slug)  # Replace spaces/underscores with hyphens
    slug = re.sub(r'-+', '-', slug)  # Remove multiple hyphens
    slug = slug.strip('-')
    return slug


async def create_organization(
    db,
    name: str,
    owner_name: str,
    owner_email: str,
    owner_password: str,
    slug: Optional[str] = None,
    owner_phone: Optional[str] = None,
    industry: Optional[str] = None,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new organization (tenant) with owner user.
    Starts on free plan with trial period.
    """
    from models.saas import Organization, OrgUser, DEFAULT_PLANS
    
    # Use provided slug or generate from name
    if slug:
        final_slug = slug.lower().strip()
    else:
        base_slug = generate_slug(name)
        final_slug = base_slug
        counter = 1
        
        while await db.organizations.find_one({"slug": final_slug}):
            final_slug = f"{base_slug}-{counter}"
            counter += 1
    
    # Check if slug already exists
    if await db.organizations.find_one({"slug": final_slug}):
        return {"error": "Subdomain already taken"}
    
    # Check if email already exists
    existing_user = await db.org_users.find_one({"email": owner_email.lower()})
    if existing_user:
        return {"error": "Email already registered"}
    
    # Create organization
    org_id = str(uuid.uuid4())
    owner_id = str(uuid.uuid4())
    
    trial_ends = (datetime.utcnow() + timedelta(days=TRIAL_DAYS)).isoformat()
    
    organization = {
        "id": org_id,
        "name": name,
        "slug": slug,
        "owner_id": owner_id,
        "email": owner_email.lower(),
        "phone": owner_phone,
        "industry": industry,
        "company_size": company_size,
        "plan_id": "plan_free",
        "subscription_status": "trialing",
        "trial_ends_at": trial_ends,
        "is_active": True,
        "is_verified": False,
        "feature_overrides": {},
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Create owner user
    owner_user = {
        "id": owner_id,
        "org_id": org_id,
        "name": owner_name,
        "email": owner_email.lower(),
        "phone": owner_phone,
        "hashed_password": pwd_context.hash(owner_password),
        "role": "owner",
        "permissions": ["*"],  # Full access
        "is_active": True,
        "email_verified": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Insert into database
    await db.organizations.insert_one(organization)
    await db.org_users.insert_one(owner_user)
    
    # Initialize usage tracking
    period_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
    
    usage = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "device_count": 0,
        "user_count": 1,  # Owner
        "company_count": 0,
        "ai_chats_this_month": 0,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.usage_records.insert_one(usage)
    
    return {
        "success": True,
        "organization": {
            "id": org_id,
            "name": name,
            "slug": slug,
            "trial_ends_at": trial_ends
        },
        "user": {
            "id": owner_id,
            "email": owner_email.lower(),
            "role": "owner"
        }
    }


async def get_organization(db, org_id: str) -> Optional[Dict]:
    """Get organization by ID"""
    org = await db.organizations.find_one({"id": org_id, "is_active": True}, {"_id": 0})
    return org


async def get_organization_by_slug(db, slug: str) -> Optional[Dict]:
    """Get organization by slug"""
    org = await db.organizations.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    return org


async def get_org_user(db, email: str) -> Optional[Dict]:
    """Get org user by email"""
    user = await db.org_users.find_one({"email": email.lower(), "is_active": True}, {"_id": 0})
    return user


async def authenticate_org_user(db, email: str, password: str) -> Optional[Dict]:
    """Authenticate org user and return user + org data"""
    user = await db.org_users.find_one({"email": email.lower(), "is_active": True}, {"_id": 0})
    
    if not user:
        return None
    
    if not pwd_context.verify(password, user["hashed_password"]):
        return None
    
    # Get organization
    org = await db.organizations.find_one({"id": user["org_id"], "is_active": True}, {"_id": 0})
    if not org:
        return None
    
    # Update last login
    await db.org_users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow().isoformat()}}
    )
    
    return {
        "user": user,
        "organization": org
    }


# ==================== FEATURE GATING ====================

async def get_plan_features(db, org_id: str) -> Dict[str, Any]:
    """Get effective features for an organization (plan + overrides)"""
    from models.saas import DEFAULT_PLANS
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        return {}
    
    # Get base plan features
    plan = next((p for p in DEFAULT_PLANS if p["id"] == org.get("plan_id")), DEFAULT_PLANS[0])
    features = plan["features"].copy()
    
    # Apply overrides
    overrides = org.get("feature_overrides", {})
    features.update(overrides)
    
    # Check trial/subscription status
    if org.get("subscription_status") == "expired":
        # Downgrade to free limits
        free_plan = next((p for p in DEFAULT_PLANS if p["name"] == "free"), DEFAULT_PLANS[0])
        features = free_plan["features"].copy()
    
    return features


async def check_feature_access(db, org_id: str, feature: str) -> bool:
    """Check if organization has access to a feature"""
    features = await get_plan_features(db, org_id)
    return features.get(feature, False)


async def check_limit(db, org_id: str, limit_type: str) -> Dict[str, Any]:
    """
    Check if organization is within limits.
    Returns: {allowed: bool, current: int, limit: int, message: str}
    """
    features = await get_plan_features(db, org_id)
    usage = await db.usage_records.find_one({"org_id": org_id}, {"_id": 0})
    
    limit_map = {
        "devices": ("max_devices", "device_count"),
        "users": ("max_users", "user_count"),
        "companies": ("max_companies", "company_count")
    }
    
    if limit_type not in limit_map:
        return {"allowed": True, "current": 0, "limit": -1, "message": "Unknown limit type"}
    
    feature_key, usage_key = limit_map[limit_type]
    limit = features.get(feature_key, 0)
    current = usage.get(usage_key, 0) if usage else 0
    
    if limit == -1:  # Unlimited
        return {"allowed": True, "current": current, "limit": -1, "message": "Unlimited"}
    
    allowed = current < limit
    message = f"You have used {current} of {limit} {limit_type}"
    
    if not allowed:
        message = f"You have reached the limit of {limit} {limit_type}. Please upgrade your plan."
    
    return {
        "allowed": allowed,
        "current": current,
        "limit": limit,
        "message": message
    }


async def increment_usage(db, org_id: str, usage_type: str, amount: int = 1):
    """Increment usage counter"""
    usage_key = f"{usage_type}_count"
    await db.usage_records.update_one(
        {"org_id": org_id},
        {
            "$inc": {usage_key: amount},
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        }
    )


async def decrement_usage(db, org_id: str, usage_type: str, amount: int = 1):
    """Decrement usage counter"""
    usage_key = f"{usage_type}_count"
    await db.usage_records.update_one(
        {"org_id": org_id},
        {
            "$inc": {usage_key: -amount},
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        }
    )


# ==================== SUBSCRIPTION MANAGEMENT ====================

async def update_subscription_status(
    db,
    org_id: str,
    status: str,
    plan_id: Optional[str] = None,
    subscription_id: Optional[str] = None
):
    """Update organization subscription status"""
    update_data = {
        "subscription_status": status,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if plan_id:
        update_data["plan_id"] = plan_id
    
    if subscription_id:
        update_data["subscription_id"] = subscription_id
    
    await db.organizations.update_one(
        {"id": org_id},
        {"$set": update_data}
    )


async def handle_subscription_activated(db, org_id: str, subscription_data: Dict):
    """Handle subscription activation webhook"""
    plan_id = subscription_data.get("notes", {}).get("plan_id", "plan_pro")
    
    await update_subscription_status(
        db,
        org_id,
        status="active",
        plan_id=plan_id,
        subscription_id=subscription_data.get("id")
    )
    
    logger.info(f"Subscription activated for org {org_id}")


async def handle_subscription_cancelled(db, org_id: str):
    """Handle subscription cancellation webhook"""
    await update_subscription_status(db, org_id, status="cancelled", plan_id="plan_free")
    logger.info(f"Subscription cancelled for org {org_id}")


async def handle_payment_failed(db, org_id: str):
    """Handle payment failure webhook"""
    await update_subscription_status(db, org_id, status="past_due")
    logger.info(f"Payment failed for org {org_id}")


# ==================== ORG DATA ISOLATION ====================

def add_org_filter(query: Dict, org_id: str) -> Dict:
    """Add org_id filter to any query for tenant isolation"""
    query["org_id"] = org_id
    return query
