"""
Multi-tenant SaaS Models
Organizations, Plans, Subscriptions
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


# ==================== PRICING PLANS ====================

class PlanFeatures(BaseModel):
    """Features included in a plan"""
    max_devices: int = 10
    max_users: int = 2
    max_companies: int = 1  # Sub-companies under the org
    ai_support_bot: bool = False
    qr_codes: bool = False
    api_access: bool = False
    custom_branding: bool = False
    priority_support: bool = False
    white_label: bool = False
    export_reports: bool = False
    osticket_integration: bool = False
    engineer_portal: bool = False


class PricingPlan(BaseModel):
    """Subscription pricing plan"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # free, pro, enterprise
    display_name: str  # "Free", "Pro", "Enterprise"
    description: str
    
    # Pricing (in paise for Razorpay)
    price_monthly: int = 0  # e.g., 99900 = ₹999
    price_yearly: int = 0   # e.g., 999900 = ₹9,999 (2 months free)
    
    # Razorpay Plan IDs (created in Razorpay dashboard)
    razorpay_plan_id_monthly: Optional[str] = None
    razorpay_plan_id_yearly: Optional[str] = None
    
    features: PlanFeatures = Field(default_factory=PlanFeatures)
    
    is_active: bool = True
    is_popular: bool = False  # Show "Popular" badge
    sort_order: int = 0
    
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# Default plans
DEFAULT_PLANS = [
    {
        "id": "plan_free",
        "name": "free",
        "display_name": "Free",
        "description": "Perfect for small teams getting started",
        "price_monthly": 0,
        "price_yearly": 0,
        "features": {
            "max_devices": 10,
            "max_users": 2,
            "max_companies": 1,
            "ai_support_bot": False,
            "qr_codes": True,
            "api_access": False,
            "custom_branding": False,
            "priority_support": False,
            "export_reports": False,
            "osticket_integration": False,
            "engineer_portal": False
        },
        "sort_order": 1
    },
    {
        "id": "plan_pro",
        "name": "pro",
        "display_name": "Pro",
        "description": "For growing businesses with more devices",
        "price_monthly": 99900,  # ₹999/month
        "price_yearly": 999900,  # ₹9,999/year (2 months free)
        "features": {
            "max_devices": 100,
            "max_users": 10,
            "max_companies": 5,
            "ai_support_bot": True,
            "qr_codes": True,
            "api_access": False,
            "custom_branding": False,
            "priority_support": True,
            "export_reports": True,
            "osticket_integration": True,
            "engineer_portal": True
        },
        "is_popular": True,
        "sort_order": 2
    },
    {
        "id": "plan_enterprise",
        "name": "enterprise",
        "display_name": "Enterprise",
        "description": "For large organizations with advanced needs",
        "price_monthly": 299900,  # ₹2,999/month
        "price_yearly": 2999900,  # ₹29,999/year
        "features": {
            "max_devices": -1,  # Unlimited
            "max_users": -1,    # Unlimited
            "max_companies": -1, # Unlimited
            "ai_support_bot": True,
            "qr_codes": True,
            "api_access": True,
            "custom_branding": True,
            "priority_support": True,
            "white_label": True,
            "export_reports": True,
            "osticket_integration": True,
            "engineer_portal": True
        },
        "sort_order": 3
    }
]


# ==================== ORGANIZATION (TENANT) ====================

class OrganizationCreate(BaseModel):
    """Create new organization (tenant)"""
    name: str
    slug: str  # URL-friendly name (e.g., acme-corp)
    owner_name: str
    owner_email: str
    owner_phone: Optional[str] = None
    owner_password: str
    
    # Optional during signup
    industry: Optional[str] = None
    company_size: Optional[str] = None  # 1-10, 11-50, 51-200, 200+


class Organization(BaseModel):
    """Organization (Tenant) - Top level entity"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str  # Unique URL slug
    
    # Owner/Admin
    owner_id: str  # References org_users
    
    # Branding (Enterprise feature)
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#0F62FE"
    
    # Contact
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    
    # Business info
    industry: Optional[str] = None
    company_size: Optional[str] = None
    gst_number: Optional[str] = None
    
    # Subscription
    plan_id: str = "plan_free"
    subscription_id: Optional[str] = None  # Razorpay subscription ID
    subscription_status: str = "trialing"  # trialing, active, past_due, cancelled, expired
    trial_ends_at: Optional[str] = None
    
    # Feature flags (can override plan features)
    feature_overrides: Dict[str, Any] = Field(default_factory=dict)
    
    # Status
    is_active: bool = True
    is_verified: bool = False  # Email verified
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==================== ORG USER (Admin/Staff within Org) ====================

class OrgUserCreate(BaseModel):
    """Create user within organization"""
    name: str
    email: str
    password: str
    role: str = "admin"  # owner, admin, staff


class OrgUser(BaseModel):
    """User within an organization (tenant admin/staff)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    org_id: str
    
    name: str
    email: str
    phone: Optional[str] = None
    hashed_password: str
    
    role: str = "admin"  # owner, admin, staff
    permissions: List[str] = Field(default_factory=list)
    
    is_active: bool = True
    email_verified: bool = False
    
    last_login: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==================== SUBSCRIPTION ====================

class Subscription(BaseModel):
    """Razorpay subscription record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    org_id: str
    
    # Razorpay IDs
    razorpay_subscription_id: str
    razorpay_customer_id: Optional[str] = None
    razorpay_plan_id: str
    
    # Plan details
    plan_id: str  # Our plan ID
    billing_cycle: str = "monthly"  # monthly, yearly
    
    # Amounts (in paise)
    amount: int
    currency: str = "INR"
    
    # Status
    status: str = "created"  # created, authenticated, active, pending, halted, cancelled, completed, expired
    
    # Dates
    current_start: Optional[str] = None
    current_end: Optional[str] = None
    
    # Payment
    paid_count: int = 0
    total_count: int = 0  # 0 = unlimited
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==================== PAYMENT/INVOICE ====================

class Payment(BaseModel):
    """Payment record from Razorpay"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    org_id: str
    subscription_id: Optional[str] = None
    
    # Razorpay IDs
    razorpay_payment_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_invoice_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    
    # Amount
    amount: int  # in paise
    currency: str = "INR"
    
    # Status
    status: str  # created, authorized, captured, refunded, failed
    method: Optional[str] = None  # card, upi, netbanking, wallet
    
    # Invoice
    invoice_url: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==================== USAGE TRACKING ====================

class UsageRecord(BaseModel):
    """Track usage for billing/limits"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    org_id: str
    
    # Current counts
    device_count: int = 0
    user_count: int = 0
    company_count: int = 0
    
    # AI usage (if metered)
    ai_chats_this_month: int = 0
    
    # Period
    period_start: str
    period_end: str
    
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
