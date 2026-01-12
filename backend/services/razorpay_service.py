"""
Razorpay Integration Service
Handles subscriptions, payments, and webhooks
"""
import os
import logging
import razorpay
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET")

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    logger.info("Razorpay client initialized")
else:
    logger.warning("Razorpay credentials not configured")


def is_razorpay_configured() -> bool:
    """Check if Razorpay is properly configured"""
    return razorpay_client is not None


# ==================== CUSTOMERS ====================

def create_customer(name: str, email: str, phone: Optional[str] = None) -> Dict[str, Any]:
    """Create a Razorpay customer"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        customer_data = {
            "name": name,
            "email": email,
            "fail_existing": 0  # Return existing customer if email exists
        }
        if phone:
            customer_data["contact"] = phone
        
        customer = razorpay_client.customer.create(customer_data)
        return {"success": True, "customer": customer}
    except Exception as e:
        logger.error(f"Failed to create Razorpay customer: {e}")
        return {"error": str(e)}


# ==================== PLANS ====================

def create_plan(
    plan_name: str,
    amount: int,  # in paise
    period: str = "monthly",  # monthly, yearly
    interval: int = 1,
    description: str = ""
) -> Dict[str, Any]:
    """Create a Razorpay plan for subscriptions"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        plan_data = {
            "period": period,
            "interval": interval,
            "item": {
                "name": plan_name,
                "amount": amount,
                "currency": "INR",
                "description": description
            }
        }
        
        plan = razorpay_client.plan.create(plan_data)
        return {"success": True, "plan": plan}
    except Exception as e:
        logger.error(f"Failed to create Razorpay plan: {e}")
        return {"error": str(e)}


def list_plans() -> Dict[str, Any]:
    """List all Razorpay plans"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        plans = razorpay_client.plan.all()
        return {"success": True, "plans": plans}
    except Exception as e:
        logger.error(f"Failed to list Razorpay plans: {e}")
        return {"error": str(e)}


# ==================== SUBSCRIPTIONS ====================

def create_subscription(
    plan_id: str,
    customer_id: Optional[str] = None,
    total_count: int = 0,  # 0 = infinite
    customer_notify: int = 1,
    start_at: Optional[int] = None,  # Unix timestamp
    notes: Optional[Dict] = None
) -> Dict[str, Any]:
    """Create a Razorpay subscription"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        subscription_data = {
            "plan_id": plan_id,
            "total_count": total_count,
            "customer_notify": customer_notify
        }
        
        if customer_id:
            subscription_data["customer_id"] = customer_id
        
        if start_at:
            subscription_data["start_at"] = start_at
        
        if notes:
            subscription_data["notes"] = notes
        
        subscription = razorpay_client.subscription.create(subscription_data)
        return {"success": True, "subscription": subscription}
    except Exception as e:
        logger.error(f"Failed to create subscription: {e}")
        return {"error": str(e)}


def get_subscription(subscription_id: str) -> Dict[str, Any]:
    """Get subscription details"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        subscription = razorpay_client.subscription.fetch(subscription_id)
        return {"success": True, "subscription": subscription}
    except Exception as e:
        logger.error(f"Failed to fetch subscription: {e}")
        return {"error": str(e)}


def cancel_subscription(subscription_id: str, cancel_at_cycle_end: bool = True) -> Dict[str, Any]:
    """Cancel a subscription"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        subscription = razorpay_client.subscription.cancel(
            subscription_id,
            {"cancel_at_cycle_end": 1 if cancel_at_cycle_end else 0}
        )
        return {"success": True, "subscription": subscription}
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")
        return {"error": str(e)}


def pause_subscription(subscription_id: str) -> Dict[str, Any]:
    """Pause a subscription"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        subscription = razorpay_client.subscription.pause(subscription_id)
        return {"success": True, "subscription": subscription}
    except Exception as e:
        logger.error(f"Failed to pause subscription: {e}")
        return {"error": str(e)}


def resume_subscription(subscription_id: str) -> Dict[str, Any]:
    """Resume a paused subscription"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        subscription = razorpay_client.subscription.resume(subscription_id)
        return {"success": True, "subscription": subscription}
    except Exception as e:
        logger.error(f"Failed to resume subscription: {e}")
        return {"error": str(e)}


def update_subscription(subscription_id: str, plan_id: str) -> Dict[str, Any]:
    """Update subscription to a new plan (upgrade/downgrade)"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        subscription = razorpay_client.subscription.update(
            subscription_id,
            {"plan_id": plan_id, "schedule_change_at": "cycle_end"}
        )
        return {"success": True, "subscription": subscription}
    except Exception as e:
        logger.error(f"Failed to update subscription: {e}")
        return {"error": str(e)}


# ==================== PAYMENTS ====================

def create_order(amount: int, currency: str = "INR", notes: Optional[Dict] = None) -> Dict[str, Any]:
    """Create a one-time payment order"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        order_data = {
            "amount": amount,
            "currency": currency,
            "payment_capture": 1  # Auto-capture
        }
        if notes:
            order_data["notes"] = notes
        
        order = razorpay_client.order.create(order_data)
        return {"success": True, "order": order}
    except Exception as e:
        logger.error(f"Failed to create order: {e}")
        return {"error": str(e)}


def verify_payment_signature(
    order_id: str,
    payment_id: str,
    signature: str
) -> bool:
    """Verify Razorpay payment signature"""
    if not razorpay_client:
        return False
    
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
    except Exception as e:
        logger.error(f"Payment signature verification failed: {e}")
        return False


def verify_subscription_signature(
    subscription_id: str,
    payment_id: str,
    signature: str
) -> bool:
    """Verify Razorpay subscription payment signature"""
    if not razorpay_client:
        return False
    
    try:
        razorpay_client.utility.verify_subscription_payment_signature({
            'razorpay_subscription_id': subscription_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
    except Exception as e:
        logger.error(f"Subscription signature verification failed: {e}")
        return False


# ==================== WEBHOOKS ====================

def verify_webhook_signature(payload: str, signature: str) -> bool:
    """Verify Razorpay webhook signature"""
    if not razorpay_client or not RAZORPAY_WEBHOOK_SECRET:
        logger.warning("Webhook verification skipped - secret not configured")
        return True  # Skip verification in dev
    
    try:
        razorpay_client.utility.verify_webhook_signature(
            payload,
            signature,
            RAZORPAY_WEBHOOK_SECRET
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        return False


# ==================== INVOICES ====================

def get_invoices(subscription_id: str) -> Dict[str, Any]:
    """Get invoices for a subscription"""
    if not razorpay_client:
        return {"error": "Razorpay not configured"}
    
    try:
        invoices = razorpay_client.invoice.all({"subscription_id": subscription_id})
        return {"success": True, "invoices": invoices}
    except Exception as e:
        logger.error(f"Failed to fetch invoices: {e}")
        return {"error": str(e)}


# ==================== HELPERS ====================

def get_trial_end_timestamp(days: int = 14) -> int:
    """Get Unix timestamp for trial end"""
    trial_end = datetime.utcnow() + timedelta(days=days)
    return int(trial_end.timestamp())


def format_amount(paise: int) -> str:
    """Convert paise to INR string"""
    return f"₹{paise / 100:,.2f}"
