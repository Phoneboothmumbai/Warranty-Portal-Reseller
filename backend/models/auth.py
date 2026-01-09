"""
Authentication related models
"""
import uuid
from pydantic import BaseModel, Field, ConfigDict
from utils.helpers import get_ist_isoformat


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
    created_at: str = Field(default_factory=get_ist_isoformat)


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminCreate(BaseModel):
    email: str
    name: str
    password: str
