"""
Service related models (Tickets, History, etc.)
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from utils.helpers import get_ist_isoformat


class ServiceTicket(BaseModel):
    """Service tickets created by company users"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_number: str = Field(default_factory=lambda: f"TKT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    company_id: str
    device_id: str
    created_by: str
    issue_category: str
    priority: str = "medium"
    subject: str
    description: str
    status: str = "open"
    sla_status: str = "on_track"
    attachments: List[str] = Field(default_factory=list)
    comments: List[dict] = Field(default_factory=list)
    assigned_to: Optional[str] = None
    resolved_at: Optional[str] = None
    closed_at: Optional[str] = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=get_ist_isoformat)
    updated_at: str = Field(default_factory=get_ist_isoformat)


class ServiceTicketCreate(BaseModel):
    device_id: str
    issue_category: str
    subject: str
    description: str
    attachments: List[str] = []


class ServiceTicketComment(BaseModel):
    comment: str
    attachments: List[str] = []


class RenewalRequest(BaseModel):
    """Warranty/AMC renewal requests from companies"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_number: str = Field(default_factory=lambda: f"REN-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    company_id: str
    request_type: str
    device_id: Optional[str] = None
    amc_contract_id: Optional[str] = None
    requested_by: str
    notes: Optional[str] = None
    status: str = "pending"
    admin_notes: Optional[str] = None
    processed_by: Optional[str] = None
    processed_at: Optional[str] = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=get_ist_isoformat)


class RenewalRequestCreate(BaseModel):
    request_type: str
    device_id: Optional[str] = None
    amc_contract_id: Optional[str] = None
    notes: Optional[str] = None


class ServiceAttachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_name: str
    file_type: str
    file_size: int
    uploaded_at: str = Field(default_factory=get_ist_isoformat)


class ServiceHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    company_id: str
    site_id: Optional[str] = None
    deployment_id: Optional[str] = None
    service_date: str
    service_type: str
    problem_reported: Optional[str] = None
    action_taken: str
    parts_used: Optional[List[dict]] = None
    parts_involved: Optional[List[dict]] = None
    labor_cost: Optional[float] = None
    parts_cost: Optional[float] = None
    total_cost: Optional[float] = None
    warranty_impact: str = "not_applicable"
    extends_device_warranty: bool = False
    new_warranty_end_date: Optional[str] = None
    consumes_amc_quota: bool = False
    amc_quota_type: Optional[str] = None
    technician_name: Optional[str] = None
    ticket_id: Optional[str] = None
    notes: Optional[str] = None
    attachments: List[ServiceAttachment] = []
    amc_contract_id: Optional[str] = None
    amc_covered: bool = False
    billing_type: str = "covered"
    chargeable_reason: Optional[str] = None
    created_by: str
    created_by_name: str
    created_at: str = Field(default_factory=get_ist_isoformat)


class ServiceHistoryCreate(BaseModel):
    device_id: str
    site_id: Optional[str] = None
    deployment_id: Optional[str] = None
    service_date: str
    service_type: str
    problem_reported: Optional[str] = None
    action_taken: str
    parts_used: Optional[List[dict]] = None
    parts_involved: Optional[List[dict]] = None
    labor_cost: Optional[float] = None
    parts_cost: Optional[float] = None
    warranty_impact: str = "not_applicable"
    extends_device_warranty: bool = False
    new_warranty_end_date: Optional[str] = None
    consumes_amc_quota: bool = False
    amc_quota_type: Optional[str] = None
    technician_name: Optional[str] = None
    ticket_id: Optional[str] = None
    notes: Optional[str] = None
    amc_contract_id: Optional[str] = None
    billing_type: str = "covered"
    chargeable_reason: Optional[str] = None


class ServiceHistoryUpdate(BaseModel):
    service_date: Optional[str] = None
    service_type: Optional[str] = None
    problem_reported: Optional[str] = None
    action_taken: Optional[str] = None
    parts_used: Optional[List[dict]] = None
    parts_involved: Optional[List[dict]] = None
    labor_cost: Optional[float] = None
    parts_cost: Optional[float] = None
    warranty_impact: Optional[str] = None
    extends_device_warranty: Optional[bool] = None
    new_warranty_end_date: Optional[str] = None
    consumes_amc_quota: Optional[bool] = None
    amc_quota_type: Optional[str] = None
    technician_name: Optional[str] = None
    ticket_id: Optional[str] = None
    notes: Optional[str] = None
    site_id: Optional[str] = None
    deployment_id: Optional[str] = None
    amc_contract_id: Optional[str] = None
    billing_type: Optional[str] = None
    chargeable_reason: Optional[str] = None


class ServicePartUsed(BaseModel):
    """Part used during a service record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    part_name: str
    part_type: str
    serial_number: Optional[str] = None
    quantity: int = 1
    replacement_type: str = "new"
    warranty_inherited_from_amc: bool = False
    warranty_start_date: Optional[str] = None
    warranty_end_date: Optional[str] = None
    linked_device_id: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None
