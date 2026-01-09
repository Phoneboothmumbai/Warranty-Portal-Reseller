"""
AMC (Annual Maintenance Contract) related models
"""
import uuid
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from utils.helpers import get_ist_isoformat


class AMC(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    start_date: str
    end_date: str
    notes: Optional[str] = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=get_ist_isoformat)


class AMCCreate(BaseModel):
    device_id: str
    start_date: str
    end_date: str
    notes: Optional[str] = None


class AMCUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None


class AMCCoverageIncludes(BaseModel):
    onsite_support: bool = False
    remote_support: bool = False
    preventive_maintenance: bool = False


class AMCExclusions(BaseModel):
    hardware_parts: bool = True
    consumables: bool = True
    accessories: bool = True
    third_party_software: bool = True
    physical_liquid_damage: bool = True


class AMCEntitlements(BaseModel):
    onsite_visits_per_year: Optional[int] = None
    remote_support_type: str = "unlimited"
    remote_support_count: Optional[int] = None
    preventive_maintenance_frequency: str = "quarterly"


class AMCAssetMapping(BaseModel):
    mapping_type: str = "all_company"
    selected_asset_ids: List[str] = []
    selected_device_types: List[str] = []


class AMCContract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    amc_type: str = "comprehensive"
    start_date: str
    end_date: str
    coverage_includes: dict = Field(default_factory=lambda: AMCCoverageIncludes().model_dump())
    exclusions: dict = Field(default_factory=lambda: AMCExclusions().model_dump())
    entitlements: dict = Field(default_factory=lambda: AMCEntitlements().model_dump())
    asset_mapping: dict = Field(default_factory=lambda: AMCAssetMapping().model_dump())
    internal_notes: Optional[str] = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=get_ist_isoformat)
    updated_at: str = Field(default_factory=get_ist_isoformat)


class AMCContractCreate(BaseModel):
    company_id: str
    name: str
    amc_type: str = "comprehensive"
    start_date: str
    end_date: str
    coverage_includes: Optional[dict] = None
    exclusions: Optional[dict] = None
    entitlements: Optional[dict] = None
    asset_mapping: Optional[dict] = None
    internal_notes: Optional[str] = None


class AMCContractUpdate(BaseModel):
    name: Optional[str] = None
    amc_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    coverage_includes: Optional[dict] = None
    exclusions: Optional[dict] = None
    entitlements: Optional[dict] = None
    asset_mapping: Optional[dict] = None
    internal_notes: Optional[str] = None


class AMCUsageRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amc_contract_id: str
    service_id: Optional[str] = None
    usage_type: str
    usage_date: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=get_ist_isoformat)


class AMCDeviceAssignment(BaseModel):
    """Join table for AMC Contract to Device assignments"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amc_contract_id: str
    device_id: str
    coverage_start: str
    coverage_end: str
    coverage_source: str = "manual"
    status: str = "active"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=get_ist_isoformat)
    created_by: Optional[str] = None


class AMCDeviceAssignmentCreate(BaseModel):
    amc_contract_id: str
    device_id: str
    coverage_start: str
    coverage_end: str
    coverage_source: str = "manual"
    notes: Optional[str] = None


class AMCBulkAssignmentPreview(BaseModel):
    amc_contract_id: str
    device_identifiers: List[str]
    coverage_start: str
    coverage_end: str
