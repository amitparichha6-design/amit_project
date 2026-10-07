from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models.user import User, UserRole
from app.services.admin_service import AdminService
from app.schemas.admin_module import (
    CompanyApprovalRequest,
    CompanyAdminResponse,
    StudentVerificationRequest,
    StudentAdminResponse,
    DriveCreateRequest,
    DriveUpdateRequest,
    DriveResponse,
    JobAdminCreateRequest,
    JobAdminResponse,
    NotificationCreateRequest,
    NotificationResponse,
    AuditLogResponse,
    AdminDashboardStatsResponse,
    ReportPlacementSummaryResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin / TPO Module"])


# 1. Admin Dashboard
@router.get("/dashboard", response_model=AdminDashboardStatsResponse)
def get_admin_dashboard_metrics(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Get aggregated placement analytics, KPIs, and recent audit logs."""
    return AdminService.get_dashboard_stats(db)


# 2. Company Management
@router.get("/companies", response_model=List[CompanyAdminResponse])
def get_all_companies(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by PENDING, APPROVED, REJECTED"),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """List all corporate recruiter registrations."""
    return AdminService.get_companies(db, status_filter=status_filter)


@router.get("/companies/{company_id}")
def get_company_profile(
    company_id: int,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Retrieve full company details, active jobs, and placement drives."""
    return AdminService.get_company_details(db, company_id)


@router.post("/companies/{company_id}/approval")
def approve_or_reject_company(
    company_id: int,
    payload: CompanyApprovalRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Approve or reject a company registration."""
    client_ip = request.client.host if request.client else None
    company = AdminService.approve_or_reject_company(
        db=db,
        admin=current_admin,
        company_id=company_id,
        approval_status=payload.status,
        reason=payload.rejection_reason,
        ip_address=client_ip
    )
    return {
        "status": "success",
        "company_id": company.id,
        "company_name": company.company_name,
        "approval_status": company.approval_status.value,
        "rejection_reason": company.rejection_reason,
    }


# 3. Student Management
@router.get("/students", response_model=List[StudentAdminResponse])
def get_all_students(
    department: Optional[str] = Query(None, description="Filter by department"),
    is_verified: Optional[bool] = Query(None, description="Filter by academic verification status"),
    search: Optional[str] = Query(None, description="Search by name or roll number"),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """View and search student profiles across departments."""
    return AdminService.get_students(
        db=db,
        department=department,
        is_verified=is_verified,
        search=search,
    )


@router.get("/students/{student_id}")
def get_student_profile(
    student_id: int,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Retrieve student academic profile and application history."""
    return AdminService.get_student_details(db, student_id)


@router.post("/students/{student_id}/verification")
def verify_student_academic_profile(
    student_id: int,
    payload: StudentVerificationRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Verify or unverify student academic eligibility records."""
    client_ip = request.client.host if request.client else None
    student = AdminService.verify_student(
        db=db,
        admin=current_admin,
        student_id=student_id,
        is_verified=payload.is_verified,
        backlogs=payload.backlogs,
        cgpa=payload.cgpa,
        ip_address=client_ip
    )
    return {
        "status": "success",
        "student_id": student.id,
        "full_name": student.full_name,
        "roll_number": student.roll_number,
        "is_verified": student.is_verified,
        "backlogs": student.backlogs,
        "cgpa": student.cgpa,
    }


# 4. Placement Drives & 5. Eligibility Criteria
@router.get("/drives", response_model=List[DriveResponse])
def get_placement_drives(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """List all placement drives with stored SQLite eligibility criteria."""
    return AdminService.get_drives(db)


@router.get("/drives/{drive_id}", response_model=DriveResponse)
def get_placement_drive_details(
    drive_id: int,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Retrieve single placement drive details and criteria."""
    return AdminService.get_drive_details(db, drive_id)


@router.post("/drives", response_model=DriveResponse, status_code=status.HTTP_201_CREATED)
def create_placement_drive(
    payload: DriveCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Create a new placement drive.
    Only approved companies are permitted. Stores eligibility criteria in SQLite.
    """
    client_ip = request.client.host if request.client else None
    drive = AdminService.create_drive(
        db=db,
        admin=current_admin,
        data=payload,
        ip_address=client_ip
    )
    return AdminService.get_drive_details(db, drive.id)


@router.put("/drives/{drive_id}", response_model=DriveResponse)
def update_placement_drive(
    drive_id: int,
    payload: DriveUpdateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Update drive details, venues, rounds, and eligibility criteria."""
    client_ip = request.client.host if request.client else None
    drive = AdminService.update_drive(
        db=db,
        admin=current_admin,
        drive_id=drive_id,
        data=payload,
        ip_address=client_ip
    )
    return AdminService.get_drive_details(db, drive.id)


@router.patch("/drives/{drive_id}/toggle-status")
def toggle_drive_active_status(
    drive_id: int,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a placement drive."""
    client_ip = request.client.host if request.client else None
    drive = AdminService.toggle_drive_status(
        db=db,
        admin=current_admin,
        drive_id=drive_id,
        ip_address=client_ip
    )
    return {
        "status": "success",
        "drive_id": drive.id,
        "title": drive.title,
        "is_active": drive.is_active,
    }


# 6. Job Management
@router.get("/jobs", response_model=List[JobAdminResponse])
def get_company_jobs(
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """View and manage company job listings."""
    return AdminService.get_jobs(db, company_id=company_id, is_active=is_active)


@router.post("/jobs", response_model=JobAdminResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobAdminCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Create a company job on behalf of an approved company."""
    client_ip = request.client.host if request.client else None
    job = AdminService.create_job_by_admin(
        db=db,
        admin=current_admin,
        data=payload,
        ip_address=client_ip
    )
    jobs = AdminService.get_jobs(db, company_id=job.company_id)
    return next(j for j in jobs if j["id"] == job.id)


@router.patch("/jobs/{job_id}/toggle-status")
def toggle_job_active_status(
    job_id: int,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a company job posting."""
    client_ip = request.client.host if request.client else None
    job = AdminService.toggle_job_status(
        db=db,
        admin=current_admin,
        job_id=job_id,
        ip_address=client_ip
    )
    return {
        "status": "success",
        "job_id": job.id,
        "title": job.title,
        "is_active": job.is_active,
    }


# 7. Notifications
@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Get all announcements made for students and campus partners."""
    return AdminService.get_notifications(db)


@router.post("/notifications", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: NotificationCreateRequest,
    request: Request,
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Create and broadcast announcements for students."""
    client_ip = request.client.host if request.client else None
    note = AdminService.create_notification(
        db=db,
        admin=current_admin,
        data=payload,
        ip_address=client_ip
    )
    notes = AdminService.get_notifications(db)
    return next(n for n in notes if n["id"] == note.id)


# 8. Reports
@router.get("/reports", response_model=ReportPlacementSummaryResponse)
def get_placement_reports(
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """Generate detailed placement and recruitment reports."""
    return AdminService.get_placement_reports(db)


# 9. Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_trail(
    limit: int = Query(100, ge=1, le=500),
    current_admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """View tamper-evident audit logs of all administrative operations."""
    return AdminService.get_audit_logs(db, limit=limit)
