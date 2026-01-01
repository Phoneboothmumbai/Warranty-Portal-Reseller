from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import base64
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
SECRET_KEY = os.environ.get('JWT_SECRET', 'warranty-portal-secret-key-change-in-prod')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Warranty & Asset Tracking Portal")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class Token(BaseModel):
    access_token: str
    token_type: str

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str
    role: str = "admin"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminCreate(BaseModel):
    email: str
    name: str
    password: str

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    gst_number: Optional[str] = None
    address: Optional[str] = None
    contact_name: str
    contact_email: str
    contact_phone: str
    amc_status: str = "not_applicable"  # active, expired, not_applicable
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CompanyCreate(BaseModel):
    name: str
    gst_number: Optional[str] = None
    address: Optional[str] = None
    contact_name: str
    contact_email: str
    contact_phone: str
    amc_status: str = "not_applicable"
    notes: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    amc_status: Optional[str] = None
    notes: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "employee"  # admin, employee
    status: str = "active"  # active, disabled
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    company_id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "employee"
    status: str = "active"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class Device(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    assigned_user_id: Optional[str] = None
    device_type: str  # Laptop, CCTV, Printer, Router, etc.
    brand: str
    model: str
    serial_number: str
    asset_tag: Optional[str] = None
    purchase_date: str
    warranty_end_date: Optional[str] = None
    status: str = "active"  # active, retired, lost
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeviceCreate(BaseModel):
    company_id: str
    assigned_user_id: Optional[str] = None
    device_type: str
    brand: str
    model: str
    serial_number: str
    asset_tag: Optional[str] = None
    purchase_date: str
    warranty_end_date: Optional[str] = None
    status: str = "active"

class DeviceUpdate(BaseModel):
    company_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    device_type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    asset_tag: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_end_date: Optional[str] = None
    status: Optional[str] = None

class Part(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    part_name: str  # Keyboard, Battery, HDD, etc.
    replaced_date: str
    warranty_months: int
    warranty_expiry_date: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PartCreate(BaseModel):
    device_id: str
    part_name: str
    replaced_date: str
    warranty_months: int
    notes: Optional[str] = None

class PartUpdate(BaseModel):
    part_name: Optional[str] = None
    replaced_date: Optional[str] = None
    warranty_months: Optional[int] = None
    notes: Optional[str] = None

class AMC(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    start_date: str
    end_date: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AMCCreate(BaseModel):
    device_id: str
    start_date: str
    end_date: str
    notes: Optional[str] = None

class AMCUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    logo_url: Optional[str] = None
    logo_base64: Optional[str] = None
    accent_color: str = "#0F62FE"
    company_name: str = "Warranty Portal"
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SettingsUpdate(BaseModel):
    logo_url: Optional[str] = None
    logo_base64: Optional[str] = None
    accent_color: Optional[str] = None
    company_name: Optional[str] = None

# ==================== AUTH HELPERS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    admin = await db.admins.find_one({"email": email}, {"_id": 0})
    if admin is None:
        raise credentials_exception
    return admin

# ==================== UTILITY FUNCTIONS ====================

def calculate_warranty_expiry(replaced_date: str, warranty_months: int) -> str:
    date = datetime.fromisoformat(replaced_date.replace('Z', '+00:00'))
    expiry = date + timedelta(days=warranty_months * 30)
    return expiry.strftime('%Y-%m-%d')

def is_warranty_active(expiry_date: str) -> bool:
    try:
        expiry = datetime.strptime(expiry_date, '%Y-%m-%d')
        today = datetime.now()
        return today <= expiry
    except:
        return False

# ==================== PUBLIC ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Warranty & Asset Tracking Portal API"}

@api_router.get("/settings/public")
async def get_public_settings():
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        settings = Settings().model_dump()
    return {
        "logo_url": settings.get("logo_url"),
        "logo_base64": settings.get("logo_base64"),
        "accent_color": settings.get("accent_color", "#0F62FE"),
        "company_name": settings.get("company_name", "Warranty Portal")
    }

@api_router.get("/warranty/search")
async def search_warranty(q: str):
    """Search warranty by serial number or asset tag"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query too short")
    
    q = q.strip()
    
    # Search device by serial number or asset tag
    device = await db.devices.find_one(
        {"$or": [
            {"serial_number": {"$regex": f"^{q}$", "$options": "i"}},
            {"asset_tag": {"$regex": f"^{q}$", "$options": "i"}}
        ]},
        {"_id": 0}
    )
    
    if not device:
        raise HTTPException(status_code=404, detail="No records found for this Serial Number / Asset Tag")
    
    # Get company info (only name, no sensitive data)
    company = await db.companies.find_one({"id": device["company_id"]}, {"_id": 0, "name": 1})
    company_name = company.get("name") if company else "Unknown"
    
    # Get assigned user (only name, no sensitive data)
    assigned_user = None
    if device.get("assigned_user_id"):
        user = await db.users.find_one({"id": device["assigned_user_id"]}, {"_id": 0, "name": 1})
        assigned_user = user.get("name") if user else None
    
    # Calculate device warranty status
    device_warranty_active = False
    device_warranty_expiry = device.get("warranty_end_date")
    if device_warranty_expiry:
        device_warranty_active = is_warranty_active(device_warranty_expiry)
    
    # Get parts and their warranty status
    parts_cursor = db.parts.find({"device_id": device["id"]}, {"_id": 0})
    parts = []
    async for part in parts_cursor:
        part_warranty_active = is_warranty_active(part.get("warranty_expiry_date", ""))
        parts.append({
            "part_name": part.get("part_name"),
            "replaced_date": part.get("replaced_date"),
            "warranty_months": part.get("warranty_months"),
            "warranty_expiry_date": part.get("warranty_expiry_date"),
            "warranty_active": part_warranty_active
        })
    
    # Get AMC status
    amc = await db.amc.find_one({"device_id": device["id"]}, {"_id": 0})
    amc_info = None
    if amc:
        amc_active = is_warranty_active(amc.get("end_date", ""))
        amc_info = {
            "start_date": amc.get("start_date"),
            "end_date": amc.get("end_date"),
            "active": amc_active
        }
    
    return {
        "device": {
            "device_type": device.get("device_type"),
            "brand": device.get("brand"),
            "model": device.get("model"),
            "serial_number": device.get("serial_number"),
            "asset_tag": device.get("asset_tag"),
            "purchase_date": device.get("purchase_date"),
            "warranty_end_date": device_warranty_expiry,
            "warranty_active": device_warranty_active,
            "status": device.get("status")
        },
        "company_name": company_name,
        "assigned_user": assigned_user,
        "parts": parts,
        "amc": amc_info
    }

@api_router.get("/warranty/pdf/{serial_number}")
async def generate_warranty_pdf(serial_number: str):
    """Generate PDF warranty report"""
    # Get warranty data
    device = await db.devices.find_one(
        {"$or": [
            {"serial_number": {"$regex": f"^{serial_number}$", "$options": "i"}},
            {"asset_tag": {"$regex": f"^{serial_number}$", "$options": "i"}}
        ]},
        {"_id": 0}
    )
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get company name
    company = await db.companies.find_one({"id": device["company_id"]}, {"_id": 0, "name": 1})
    company_name = company.get("name") if company else "Unknown"
    
    # Get parts
    parts_cursor = db.parts.find({"device_id": device["id"]}, {"_id": 0})
    parts = []
    async for part in parts_cursor:
        parts.append(part)
    
    # Get AMC
    amc = await db.amc.find_one({"device_id": device["id"]}, {"_id": 0})
    
    # Get settings
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    portal_name = settings.get("company_name", "Warranty Portal") if settings else "Warranty Portal"
    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, spaceAfter=20, textColor=colors.HexColor('#0F172A'))
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, spaceAfter=10, textColor=colors.HexColor('#0F172A'))
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, spaceAfter=5, textColor=colors.HexColor('#64748B'))
    
    # Title
    story.append(Paragraph(f"{portal_name} - Warranty Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}", body_style))
    story.append(Spacer(1, 20))
    
    # Device Info
    story.append(Paragraph("Device Information", heading_style))
    device_data = [
        ["Device Type", device.get("device_type", "-")],
        ["Brand", device.get("brand", "-")],
        ["Model", device.get("model", "-")],
        ["Serial Number", device.get("serial_number", "-")],
        ["Asset Tag", device.get("asset_tag", "-") or "-"],
        ["Company", company_name],
        ["Purchase Date", device.get("purchase_date", "-")],
        ["Warranty Expiry", device.get("warranty_end_date", "-") or "Not specified"],
        ["Warranty Status", "Active" if is_warranty_active(device.get("warranty_end_date", "")) else "Expired / Not Covered"]
    ]
    
    device_table = Table(device_data, colWidths=[2*inch, 4*inch])
    device_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0F172A')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(device_table)
    story.append(Spacer(1, 20))
    
    # Parts Warranty
    if parts:
        story.append(Paragraph("Parts Warranty Status", heading_style))
        parts_data = [["Part Name", "Replaced Date", "Warranty", "Expiry", "Status"]]
        for part in parts:
            status = "Active" if is_warranty_active(part.get("warranty_expiry_date", "")) else "Expired"
            parts_data.append([
                part.get("part_name", "-"),
                part.get("replaced_date", "-"),
                f"{part.get('warranty_months', 0)} months",
                part.get("warranty_expiry_date", "-"),
                status
            ])
        
        parts_table = Table(parts_data, colWidths=[1.5*inch, 1.2*inch, 1*inch, 1.2*inch, 1*inch])
        parts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F62FE')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ]))
        story.append(parts_table)
        story.append(Spacer(1, 20))
    
    # AMC Status
    story.append(Paragraph("AMC / Service Coverage", heading_style))
    if amc:
        amc_status = "Active" if is_warranty_active(amc.get("end_date", "")) else "Expired"
        amc_data = [
            ["Start Date", amc.get("start_date", "-")],
            ["End Date", amc.get("end_date", "-")],
            ["Status", amc_status]
        ]
    else:
        amc_data = [["Status", "No active AMC found for this device"]]
    
    amc_table = Table(amc_data, colWidths=[2*inch, 4*inch])
    amc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0F172A')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(amc_table)
    story.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#94A3B8'))
    story.append(Paragraph("This document is auto-generated and valid as of the date mentioned above.", footer_style))
    story.append(Paragraph("For any discrepancies, please contact support.", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"warranty_report_{serial_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=Token)
async def admin_login(login: AdminLogin):
    admin = await db.admins.find_one({"email": login.email}, {"_id": 0})
    if not admin or not verify_password(login.password, admin.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": admin["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_current_admin_info(admin: dict = Depends(get_current_admin)):
    return {
        "id": admin.get("id"),
        "email": admin.get("email"),
        "name": admin.get("name"),
        "role": admin.get("role")
    }

@api_router.post("/auth/setup")
async def setup_first_admin(admin_data: AdminCreate):
    """Create first admin - only works if no admins exist"""
    existing = await db.admins.find_one({}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists. Use login.")
    
    admin = AdminUser(
        email=admin_data.email,
        name=admin_data.name,
        password_hash=get_password_hash(admin_data.password)
    )
    await db.admins.insert_one(admin.model_dump())
    return {"message": "Admin created successfully", "email": admin.email}

# ==================== ADMIN ENDPOINTS - COMPANIES ====================

@api_router.get("/admin/companies")
async def list_companies(admin: dict = Depends(get_current_admin)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    return companies

@api_router.post("/admin/companies")
async def create_company(company_data: CompanyCreate, admin: dict = Depends(get_current_admin)):
    company = Company(**company_data.model_dump())
    await db.companies.insert_one(company.model_dump())
    return company.model_dump()

@api_router.get("/admin/companies/{company_id}")
async def get_company(company_id: str, admin: dict = Depends(get_current_admin)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@api_router.put("/admin/companies/{company_id}")
async def update_company(company_id: str, updates: CompanyUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.companies.update_one({"id": company_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return await db.companies.find_one({"id": company_id}, {"_id": 0})

@api_router.delete("/admin/companies/{company_id}")
async def delete_company(company_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Also delete related users
    await db.users.delete_many({"company_id": company_id})
    return {"message": "Company and related users deleted"}

# ==================== ADMIN ENDPOINTS - USERS ====================

@api_router.get("/admin/users")
async def list_users(company_id: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {"company_id": company_id} if company_id else {}
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users

@api_router.post("/admin/users")
async def create_user(user_data: UserCreate, admin: dict = Depends(get_current_admin)):
    # Check company exists
    company = await db.companies.find_one({"id": user_data.company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    user = User(**user_data.model_dump())
    await db.users.insert_one(user.model_dump())
    return user.model_dump()

@api_router.get("/admin/users/{user_id}")
async def get_user(user_id: str, admin: dict = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return await db.users.find_one({"id": user_id}, {"_id": 0})

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ==================== ADMIN ENDPOINTS - DEVICES ====================

@api_router.get("/admin/devices")
async def list_devices(company_id: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {"company_id": company_id} if company_id else {}
    devices = await db.devices.find(query, {"_id": 0}).to_list(1000)
    return devices

@api_router.post("/admin/devices")
async def create_device(device_data: DeviceCreate, admin: dict = Depends(get_current_admin)):
    # Check company exists
    company = await db.companies.find_one({"id": device_data.company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check serial number uniqueness
    existing = await db.devices.find_one({"serial_number": device_data.serial_number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Serial number already exists")
    
    device = Device(**device_data.model_dump())
    await db.devices.insert_one(device.model_dump())
    return device.model_dump()

@api_router.get("/admin/devices/{device_id}")
async def get_device(device_id: str, admin: dict = Depends(get_current_admin)):
    device = await db.devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@api_router.put("/admin/devices/{device_id}")
async def update_device(device_id: str, updates: DeviceUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    # Check serial number uniqueness if updating
    if "serial_number" in update_data:
        existing = await db.devices.find_one({
            "serial_number": update_data["serial_number"],
            "id": {"$ne": device_id}
        }, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Serial number already exists")
    
    result = await db.devices.update_one({"id": device_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return await db.devices.find_one({"id": device_id}, {"_id": 0})

@api_router.delete("/admin/devices/{device_id}")
async def delete_device(device_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.devices.delete_one({"id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Also delete related parts and AMC
    await db.parts.delete_many({"device_id": device_id})
    await db.amc.delete_many({"device_id": device_id})
    return {"message": "Device and related data deleted"}

# ==================== ADMIN ENDPOINTS - PARTS ====================

@api_router.get("/admin/parts")
async def list_parts(device_id: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {"device_id": device_id} if device_id else {}
    parts = await db.parts.find(query, {"_id": 0}).to_list(1000)
    return parts

@api_router.post("/admin/parts")
async def create_part(part_data: PartCreate, admin: dict = Depends(get_current_admin)):
    # Check device exists
    device = await db.devices.find_one({"id": part_data.device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Calculate warranty expiry
    warranty_expiry = calculate_warranty_expiry(part_data.replaced_date, part_data.warranty_months)
    
    part = Part(
        **part_data.model_dump(),
        warranty_expiry_date=warranty_expiry
    )
    await db.parts.insert_one(part.model_dump())
    return part.model_dump()

@api_router.get("/admin/parts/{part_id}")
async def get_part(part_id: str, admin: dict = Depends(get_current_admin)):
    part = await db.parts.find_one({"id": part_id}, {"_id": 0})
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@api_router.put("/admin/parts/{part_id}")
async def update_part(part_id: str, updates: PartUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    # Recalculate warranty expiry if dates changed
    if "replaced_date" in update_data or "warranty_months" in update_data:
        existing = await db.parts.find_one({"id": part_id}, {"_id": 0})
        if existing:
            replaced_date = update_data.get("replaced_date", existing.get("replaced_date"))
            warranty_months = update_data.get("warranty_months", existing.get("warranty_months"))
            update_data["warranty_expiry_date"] = calculate_warranty_expiry(replaced_date, warranty_months)
    
    result = await db.parts.update_one({"id": part_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Part not found")
    
    return await db.parts.find_one({"id": part_id}, {"_id": 0})

@api_router.delete("/admin/parts/{part_id}")
async def delete_part(part_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.parts.delete_one({"id": part_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Part not found")
    return {"message": "Part deleted"}

# ==================== ADMIN ENDPOINTS - AMC ====================

@api_router.get("/admin/amc")
async def list_amc(device_id: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {"device_id": device_id} if device_id else {}
    amc_list = await db.amc.find(query, {"_id": 0}).to_list(1000)
    return amc_list

@api_router.post("/admin/amc")
async def create_amc(amc_data: AMCCreate, admin: dict = Depends(get_current_admin)):
    # Check device exists
    device = await db.devices.find_one({"id": amc_data.device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if AMC already exists for device
    existing = await db.amc.find_one({"device_id": amc_data.device_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="AMC already exists for this device. Update or delete the existing one.")
    
    amc = AMC(**amc_data.model_dump())
    await db.amc.insert_one(amc.model_dump())
    return amc.model_dump()

@api_router.get("/admin/amc/{amc_id}")
async def get_amc(amc_id: str, admin: dict = Depends(get_current_admin)):
    amc = await db.amc.find_one({"id": amc_id}, {"_id": 0})
    if not amc:
        raise HTTPException(status_code=404, detail="AMC not found")
    return amc

@api_router.put("/admin/amc/{amc_id}")
async def update_amc(amc_id: str, updates: AMCUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.amc.update_one({"id": amc_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="AMC not found")
    
    return await db.amc.find_one({"id": amc_id}, {"_id": 0})

@api_router.delete("/admin/amc/{amc_id}")
async def delete_amc(amc_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.amc.delete_one({"id": amc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="AMC not found")
    return {"message": "AMC deleted"}

# ==================== ADMIN ENDPOINTS - SETTINGS ====================

@api_router.get("/admin/settings")
async def get_settings(admin: dict = Depends(get_current_admin)):
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        settings = Settings().model_dump()
    return settings

@api_router.put("/admin/settings")
async def update_settings(updates: SettingsUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return await db.settings.find_one({"id": "settings"}, {"_id": 0})

@api_router.post("/admin/settings/logo")
async def upload_logo(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    """Upload logo and store as base64"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    content = await file.read()
    base64_string = base64.b64encode(content).decode()
    logo_base64 = f"data:{file.content_type};base64,{base64_string}"
    
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": {"logo_base64": logo_base64, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Logo uploaded successfully", "logo_base64": logo_base64}

# ==================== ADMIN DASHBOARD STATS ====================

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    companies_count = await db.companies.count_documents({})
    users_count = await db.users.count_documents({})
    devices_count = await db.devices.count_documents({})
    parts_count = await db.parts.count_documents({})
    
    # Active vs expired device warranties
    today = datetime.now().strftime('%Y-%m-%d')
    active_warranties = await db.devices.count_documents({
        "warranty_end_date": {"$gte": today}
    })
    
    # Active AMCs
    active_amc = await db.amc.count_documents({
        "end_date": {"$gte": today}
    })
    
    # Recent devices
    recent_devices = await db.devices.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "companies_count": companies_count,
        "users_count": users_count,
        "devices_count": devices_count,
        "parts_count": parts_count,
        "active_warranties": active_warranties,
        "expired_warranties": devices_count - active_warranties,
        "active_amc": active_amc,
        "recent_devices": recent_devices
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
