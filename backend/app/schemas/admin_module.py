import json
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.company import CompanyApprovalStatus
from app.models.application import ApplicationStatus


# --- Company Approval Schemas ---
class CompanyApprovalRequest(BaseModel):
    status: CompanyApprovalStatus
    rejection_reason: Optional[str] = None


class CompanyAdminResponse(BaseModel):
    id: int
    user_id: int
    email: str
    company_name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    approval_status: CompanyApprovalStatus
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    active_jobs_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- Student Management Schemas ---
class StudentVerificationRequest(BaseModel):
    is_verified: bool
    backlogs: Optional[int] = Field(default=0, ge=0)
    cgpa: Optional[float] = Field(default=None, ge=0, le=10)


class StudentAdminResponse(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    phone: Optional[str] = None
    is_verified: bool
    verified_at: Optional[datetime] = None
    backlogs: int = 0
    is_placed: bool = False
    placed_company_name: Optional[str] = None
    placed_package: Optional[str] = None
    created_at: datetime
    applications_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- Eligibility Criteria Schemas ---
class EligibilityCriteriaBase(BaseModel):
    min_cgpa: float = Field(default=6.0, ge=0.0, le=10.0)
    max_backlogs: int = Field(default=0, ge=0)
    eligible_branches: List[str] = Field(default_factory=lambda: ["Computer Science", "Information Technology"])
    eligible_batch: int = Field(default=2026, ge=2000, le=2100)


class EligibilityCriteriaCreate(EligibilityCriteriaBase):
    pass


class EligibilityCriteriaResponse(BaseModel):
    id: int
    min_cgpa: float
    max_backlogs: int
    eligible_branches: List[str]
    eligible_batch: int
    created_at: datetime

    @field_validator("eligible_branches", mode="before")
    @classmethod
    def parse_branches(cls, value: Any) -> List[str]:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return [b.strip() for b in value.split(",") if b.strip()]
        return value or []

    model_config = ConfigDict(from_attributes=True)


# --- Placement Drive Schemas ---
class DriveCreateRequest(BaseModel):
    company_id: int
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    drive_date: datetime
    venue: str = Field(..., min_length=2, max_length=255)
    selection_rounds: List[str] = Field(default_factory=lambda: ["Online Assessment", "Technical Interview", "HR Round"])
    is_active: bool = True
    eligibility: Optional[EligibilityCriteriaCreate] = None


class DriveUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    drive_date: Optional[datetime] = None
    venue: Optional[str] = None
    selection_rounds: Optional[List[str]] = None
    is_active: Optional[bool] = None
    eligibility: Optional[EligibilityCriteriaCreate] = None


class DriveResponse(BaseModel):
    id: int
    company_id: int
    company_name: str
    title: str
    description: Optional[str] = None
    drive_date: datetime
    venue: str
    selection_rounds: List[str]
    is_active: bool
    created_at: datetime
    eligibility_criteria: Optional[EligibilityCriteriaResponse] = None

    @field_validator("selection_rounds", mode="before")
    @classmethod
    def parse_rounds(cls, value: Any) -> List[str]:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return [r.strip() for r in value.split(",") if r.strip()]
        return value or []

    model_config = ConfigDict(from_attributes=True)


# --- Job Management Schemas ---
class JobAdminCreateRequest(BaseModel):
    company_id: int
    drive_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    role_category: Optional[str] = None
    salary_package: Optional[str] = None
    job_location: Optional[str] = None
    job_type: str = "Full-Time"
    is_active: bool = True


class JobAdminUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    role_category: Optional[str] = None
    salary_package: Optional[str] = None
    job_location: Optional[str] = None
    job_type: Optional[str] = None
    is_active: Optional[bool] = None


class JobAdminResponse(BaseModel):
    id: int
    company_id: int
    company_name: str
    drive_id: Optional[int] = None
    drive_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    role_category: Optional[str] = None
    salary_package: Optional[str] = None
    job_location: Optional[str] = None
    job_type: str
    is_active: bool
    applications_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Notifications Schemas ---
class NotificationCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=2)
    target_audience: str = "ALL"


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    target_audience: str
    created_by_id: int
    created_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    admin_id: int
    admin_email: str
    action: str
    target_entity: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Stats & Reports ---
class AdminDashboardStatsResponse(BaseModel):
    total_students: int
    total_companies: int
    pending_companies: int
    active_jobs: int
    active_drives: int
    total_applications: int
    selected_students: int
    verified_students: int
    placement_rate_percentage: float
    average_package: str
    recent_activities: List[AuditLogResponse] = []


class ReportPlacementSummaryResponse(BaseModel):
    total_students: int
    total_placed: int
    placement_rate: float
    placed_students: List[dict]
    company_wise_placements: List[dict]
    branch_wise_placements: List[dict]
    application_stats: dict
    selected_vs_rejected: dict
