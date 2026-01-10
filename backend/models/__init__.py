"""
Pydantic models package
All data models for the application
"""

# Auth models
from models.auth import (
    Token, AdminUser, AdminLogin, AdminCreate
)

# Common/Master models
from models.common import (
    MasterItem, MasterItemCreate, MasterItemUpdate,
    AuditLog, Settings, SettingsUpdate
)

# Company models
from models.company import (
    Company, CompanyCreate, CompanyUpdate,
    User, UserCreate, UserUpdate,
    CompanyUser, CompanyUserCreate, CompanyUserUpdate,
    CompanyUserRegister, CompanyLogin
)

# Device models
from models.device import (
    ConsumableItem, Device, DeviceCreate, DeviceUpdate,
    AssignmentHistory, Part, PartCreate, PartUpdate,
    ConsumableOrderItem, ConsumableOrder
)

# Service models
from models.service import (
    ServiceTicket, ServiceTicketCreate, ServiceTicketComment,
    RenewalRequest, RenewalRequestCreate,
    ServiceAttachment, ServiceHistory, ServiceHistoryCreate, ServiceHistoryUpdate,
    ServicePartUsed
)

# AMC models
from models.amc import (
    AMC, AMCCreate, AMCUpdate,
    AMCCoverageIncludes, AMCExclusions, AMCEntitlements, AMCAssetMapping,
    AMCContract, AMCContractCreate, AMCContractUpdate,
    AMCUsageRecord, AMCDeviceAssignment, AMCDeviceAssignmentCreate,
    AMCBulkAssignmentPreview
)

# Site/Deployment models
from models.site import (
    Site, SiteCreate, SiteUpdate,
    DeploymentItem, Deployment, DeploymentCreate, DeploymentUpdate
)

# License models
from models.license import (
    License, LicenseCreate, LicenseUpdate
)

# Supply models
from models.supplies import (
    SupplyCategory, SupplyCategoryCreate, SupplyCategoryUpdate,
    SupplyProduct, SupplyProductCreate, SupplyProductUpdate,
    SupplyOrderItem, SupplyOrderLocation, SupplyOrder
)

# Engineer models
from models.engineer import (
    Engineer, EngineerCreate, EngineerUpdate, EngineerLogin,
    FieldVisit, ServiceReportSubmit
)
