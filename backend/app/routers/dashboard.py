from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.company import Company
from app.models.admin import Admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard Placeholders"])


@router.get("/admin")
def get_admin_dashboard(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Protected Admin Dashboard Endpoint (Phase 1 Placeholder).
    Accessible strictly by users with role ADMIN.
    """
    total_users = db.query(User).count()
    total_students = db.query(Student).count()
    total_companies = db.query(Company).count()
    total_admins = db.query(Admin).count()

    return {
        "status": "success",
        "module": "ADMIN_DASHBOARD",
        "message": f"Welcome Administrator, {current_user.email}!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "admin_profile": current_user.admin_profile
        },
        "stats": {
            "total_users": total_users,
            "total_students": total_students,
            "total_companies": total_companies,
            "total_admins": total_admins,
        },
        "phase": "Phase 1 - Foundation Ready"
    }


@router.get("/student")
def get_student_dashboard(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    """
    Protected Student Dashboard Endpoint (Phase 1 Placeholder).
    Accessible strictly by users with role STUDENT.
    """
    return {
        "status": "success",
        "module": "STUDENT_DASHBOARD",
        "message": f"Welcome Student, {current_user.student_profile.full_name if current_user.student_profile else current_user.email}!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "student_profile": current_user.student_profile
        },
        "placement_status": {
            "eligible": True,
            "applications_count": 0,
            "interviews_scheduled": 0
        },
        "phase": "Phase 1 - Foundation Ready"
    }


@router.get("/company")
def get_company_dashboard(
    current_user: User = Depends(require_roles([UserRole.COMPANY])),
    db: Session = Depends(get_db)
):
    """
    Protected Company Dashboard Endpoint (Phase 1 Placeholder).
    Accessible strictly by users with role COMPANY.
    """
    return {
        "status": "success",
        "module": "COMPANY_DASHBOARD",
        "message": f"Welcome Partner, {current_user.company_profile.company_name if current_user.company_profile else current_user.email}!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "company_profile": current_user.company_profile
        },
        "recruitment_status": {
            "active_job_postings": 0,
            "candidates_applied": 0,
            "rounds_in_progress": 0
        },
        "phase": "Phase 1 - Foundation Ready"
    }


@router.get("/summary")
def get_user_dashboard_summary(
    current_user: User = Depends(get_current_user)
):
    """
    General summary accessible by any authenticated user regardless of role.
    """
    return {
        "status": "authenticated",
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value
    }
