from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.models.user import UserRole
from app.schemas.student import StudentResponse
from app.schemas.company import CompanyResponse
from app.schemas.admin import AdminResponse


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.STUDENT


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")
    role: UserRole = UserRole.STUDENT

    # Student specific fields
    roll_number: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)

    # Company specific fields
    company_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None

    # Common / Admin fields
    designation: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def sanitize_email(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("roll_number", mode="before")
    @classmethod
    def sanitize_roll_number(cls, v: Any) -> Optional[str]:
        if isinstance(v, str):
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    student_profile: Optional[StudentResponse] = None
    company_profile: Optional[CompanyResponse] = None
    admin_profile: Optional[AdminResponse] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
