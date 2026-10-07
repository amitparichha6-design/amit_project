import os
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.config import BACKEND_DIR
from app.database.session import get_db
from app.models.user import User, UserRole
from app.services.student_service import StudentService, UPLOADS_DIR
from app.schemas.student_module import (
    StudentProfileUpdateRequest,
    StudentProfileResponse,
    StudentJobResponse,
    StudentApplicationResponse,
    ApplicationCreateRequest,
    StudentNotificationResponse,
    StudentDashboardResponse,
)

router = APIRouter(prefix="/student", tags=["Student Module"])


# 1. Student Dashboard
@router.get("/dashboard", response_model=StudentDashboardResponse)
def get_student_dashboard(
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Get student dashboard overview, profile completion, eligible jobs count, upcoming interviews, and alerts."""
    return StudentService.get_dashboard(db, current_student)


# 2. Student Profile Management
@router.get("/profile", response_model=StudentProfileResponse)
def get_student_profile(
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Retrieve personal and academic profile details."""
    return StudentService.get_profile(db, current_student)


@router.put("/profile", response_model=StudentProfileResponse)
def update_student_profile(
    payload: StudentProfileUpdateRequest,
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Update student profile details, skills, projects, certifications, and portfolio links."""
    return StudentService.update_profile(db, current_student, payload)


# 3. Resume Upload & Download
@router.post("/resume", response_model=dict)
def upload_resume_pdf(
    file: UploadFile = File(...),
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """
    Upload resume in PDF format only.
    Validates file extension, MIME type, and size; archives inside backend uploads directory.
    """
    resume_path = StudentService.save_resume(db, current_student, file)
    return {
        "status": "success",
        "message": "Resume uploaded successfully.",
        "resume_url": resume_path,
    }


@router.get("/resume/download")
def download_resume(
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Download or view student's current uploaded resume."""
    student = StudentService.get_student_or_404(db, current_student)
    if not student.resume_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume has been uploaded yet."
        )

    clean_filename = os.path.basename(student.resume_url)
    file_path = UPLOADS_DIR / clean_filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file does not exist on disk."
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"{student.full_name.replace(' ', '_')}_Resume.pdf"
    )


# 4. Jobs & Eligibility Inspection
@router.get("/jobs", response_model=List[StudentJobResponse])
def get_jobs_for_student(
    eligible_only: bool = Query(False, description="Filter only jobs where student is eligible"),
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """
    View corporate job postings evaluated by the Eligibility Engine.
    Provides eligibility flag and detailed breakdown reasons if ineligible.
    """
    return StudentService.get_student_jobs(db, current_student, eligible_only=eligible_only)


@router.get("/jobs/{job_id}", response_model=StudentJobResponse)
def get_job_detail(
    job_id: int,
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Inspect full job opening, drive dates, selection rounds, and real-time eligibility evaluation."""
    return StudentService.get_job_detail(db, current_student, job_id)


# 5. Apply Workflow
@router.post("/jobs/{job_id}/apply", response_model=StudentApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: int,
    payload: Optional[ApplicationCreateRequest] = None,
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """
    Submit job application.
    Enforces all checks:
    - Profile must be verified by TPO
    - Student must meet eligibility criteria
    - Application deadline has not expired
    - Duplicate application prevention
    """
    notes = payload.notes if payload else None
    app_record = StudentService.apply_to_job(db, current_student, job_id, notes=notes)
    apps = StudentService.get_applications(db, current_student)
    return next(a for a in apps if a["id"] == app_record.id)


# 6. My Applications
@router.get("/applications", response_model=List[StudentApplicationResponse])
def get_my_applications(
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Security: Access strictly current student's own submitted applications."""
    return StudentService.get_applications(db, current_student)


# 7. Notifications
@router.get("/notifications", response_model=List[StudentNotificationResponse])
def get_my_notifications(
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """View student notifications, placement alerts, and circulars with read status."""
    return StudentService.get_notifications(db, current_student)


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Mark notification as read."""
    StudentService.mark_notification_read(db, current_student, notification_id)
    return {"status": "success", "message": "Marked notification as read."}


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    current_student: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    count = StudentService.mark_all_notifications_read(db, current_student)
    return {"status": "success", "marked_read_count": count}
