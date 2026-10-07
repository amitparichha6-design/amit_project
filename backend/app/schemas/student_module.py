import json
from typing import Optional, List, Any, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.application import ApplicationStatus


class StudentProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    percentage: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    backlogs: Optional[int] = Field(default=None, ge=0)
    phone: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[Union[List[str], str]] = None
    projects: Optional[Union[List[Any], str]] = None
    certifications: Optional[Union[List[Any], str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    percentage: Optional[float] = None
    backlogs: int = 0
    phone: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    projects: List[Any] = []
    certifications: List[Any] = []
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    is_verified: bool
    verified_at: Optional[datetime] = None
    is_placed: bool
    placed_company_name: Optional[str] = None
    placed_package: Optional[str] = None
    profile_completion: int = 0

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [s.strip() for s in v.split(",") if s.strip()]
        return v or []

    @field_validator("projects", "certifications", mode="before")
    @classmethod
    def parse_json_items(cls, v: Any) -> List[Dict[str, Any]]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        return v or []

    model_config = ConfigDict(from_attributes=True)


class StudentJobResponse(BaseModel):
    id: int
    company_id: int
    company_name: str
    drive_id: Optional[int] = None
    drive_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    role_category: Optional[str] = None
    salary_package: Optional[str] = None
    salary_range: Optional[str] = None
    job_location: Optional[str] = None
    location: Optional[str] = None
    job_type: str
    application_deadline: Optional[datetime] = None
    drive_date: Optional[datetime] = None
    venue: Optional[str] = None
    selection_rounds: List[str] = []
    required_skills: List[str] = []
    eligibility_criteria: Optional[Dict[str, Any]] = None
    is_eligible: bool = True
    can_apply: bool = False
    is_verified: bool = True
    eligibility_reasons: List[str] = []
    ineligibility_reasons: List[str] = []
    has_applied: bool = False
    already_applied: bool = False
    application_status: Optional[str] = None
    drive: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationCreateRequest(BaseModel):
    notes: Optional[str] = None


class StudentApplicationResponse(BaseModel):
    id: int
    job_id: int
    job_title: str
    company_name: str
    salary_package: Optional[str] = None
    job_location: Optional[str] = None
    status: ApplicationStatus
    interview_date: Optional[datetime] = None
    applied_at: datetime
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentNotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    target_audience: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentDashboardResponse(BaseModel):
    profile_completion: int
    cgpa: Optional[float] = None
    verification_status: str
    is_verified: bool
    eligible_jobs_count: int
    applied_jobs_count: int
    shortlisted_count: int
    upcoming_interviews: List[StudentApplicationResponse] = []
    recent_notifications: List[StudentNotificationResponse] = []
    unread_notifications_count: int = 0
    is_placed: bool = False
    placed_company_name: Optional[str] = None
    placed_package: Optional[str] = None
