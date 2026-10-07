"""CampusHire ORM Models."""
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.company import Company, CompanyApprovalStatus
from app.models.admin import Admin
from app.models.drive import PlacementDrive
from app.models.eligibility import EligibilityCriteria
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog

__all__ = [
    "User",
    "UserRole",
    "Student",
    "Company",
    "CompanyApprovalStatus",
    "Admin",
    "PlacementDrive",
    "EligibilityCriteria",
    "Job",
    "Application",
    "ApplicationStatus",
    "Notification",
    "AuditLog",
]
