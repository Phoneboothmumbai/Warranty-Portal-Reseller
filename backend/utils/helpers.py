"""
Utility helper functions
"""
from datetime import datetime, timedelta
from config import IST


def get_ist_now():
    """Get current datetime in IST"""
    return datetime.now(IST)


def get_ist_isoformat():
    """Get current datetime in IST as ISO format string"""
    return datetime.now(IST).isoformat()


def calculate_warranty_expiry(replaced_date: str, warranty_months: int) -> str:
    """Calculate warranty expiry date from replacement date and warranty months"""
    date = datetime.fromisoformat(replaced_date.replace('Z', '+00:00'))
    expiry = date + timedelta(days=warranty_months * 30)
    return expiry.strftime('%Y-%m-%d')


def is_warranty_active(expiry_date: str) -> bool:
    """Check if warranty is still active based on expiry date"""
    try:
        expiry = datetime.strptime(expiry_date, '%Y-%m-%d')
        today = get_ist_now().replace(tzinfo=None)
        return today.date() <= expiry.date()
    except:
        return False


def days_until_expiry(expiry_date: str) -> int:
    """Calculate days until warranty expiry"""
    try:
        expiry = datetime.strptime(expiry_date, '%Y-%m-%d')
        today = get_ist_now().replace(tzinfo=None)
        return (expiry.date() - today.date()).days
    except:
        return -9999
