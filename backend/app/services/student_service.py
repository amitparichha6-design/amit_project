import os
import re
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings, BACKEND_DIR
from app.models.user import User
from app.models.student import Student
from app.models.job import Job
from app.models.company import Company, CompanyApprovalStatus
from app.models.drive import PlacementDrive
from app.models.application import Application, ApplicationStatus
from app.models.notification import Notification
from app.services.eligibility_service import EligibilityService
from app.schemas.student_module import StudentProfileUpdateRequest

UPLOADS_DIR = BACKEND_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class StudentService:
    @staticmethod
    def calculate_profile_completion(student: Student) -> int:
        """Calculate the percentage of student profile fields that are completed."""
        fields_to_check = [
            bool(student.full_name),
            bool(student.roll_number),
            bool(student.department),
            bool(student.graduation_year),
            bool(student.cgpa is not None),
            bool(student.phone),
            bool(student.bio),
            bool(student.skills and student.skills != "[]"),
            bool(student.resume_url),
            bool(student.github_url or student.linkedin_url),
        ]
        completed = sum(1 for f in fields_to_check if f)
        return int((completed / len(fields_to_check)) * 100)

    @staticmethod
    def get_student_or_404(db: Session, user: User) -> Student:
        """Security: Retrieve the student record associated with the authenticated User."""
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found for this account."
            )
        return student

    @staticmethod
    def get_profile(db: Session, user: User) -> Dict[str, Any]:
        student = StudentService.get_student_or_404(db, user)
        completion = StudentService.calculate_profile_completion(student)

        skills_list = json.loads(student.skills) if student.skills else []
        projects_list = json.loads(student.projects) if student.projects else []
        certs_list = json.loads(student.certifications) if student.certifications else []

        return {
            "id": student.id,
            "user_id": student.user_id,
            "email": user.email,
            "full_name": student.full_name,
            "roll_number": student.roll_number,
            "department": student.department,
            "graduation_year": student.graduation_year,
            "cgpa": student.cgpa,
            "percentage": student.percentage,
            "backlogs": student.backlogs,
            "phone": student.phone,
            "bio": student.bio,
            "skills": skills_list,
            "projects": projects_list,
            "certifications": certs_list,
            "github_url": student.github_url,
            "linkedin_url": student.linkedin_url,
            "resume_url": student.resume_url,
            "is_verified": student.is_verified,
            "verified_at": student.verified_at,
            "is_placed": student.is_placed,
            "placed_company_name": student.placed_company_name,
            "placed_package": student.placed_package,
            "profile_completion": completion,
        }

    @staticmethod
    def update_profile(
        db: Session,
        user: User,
        data: StudentProfileUpdateRequest
    ) -> Dict[str, Any]:
        student = StudentService.get_student_or_404(db, user)

        if data.full_name is not None:
            student.full_name = data.full_name.strip()
        if data.roll_number is not None:
            student.roll_number = data.roll_number.strip()
        if data.department is not None:
            student.department = data.department.strip()
        if data.graduation_year is not None:
            student.graduation_year = data.graduation_year
        if data.cgpa is not None:
            student.cgpa = data.cgpa
            if data.percentage is None and data.cgpa is not None:
                student.percentage = round(data.cgpa * 9.5, 2)
        if data.percentage is not None:
            student.percentage = data.percentage
        if data.backlogs is not None:
            student.backlogs = data.backlogs
        if data.phone is not None:
            student.phone = data.phone.strip()
        if data.bio is not None:
            student.bio = data.bio.strip()
        if data.github_url is not None:
            student.github_url = data.github_url.strip()
        if data.linkedin_url is not None:
            student.linkedin_url = data.linkedin_url.strip()

        if data.skills is not None:
            if isinstance(data.skills, str):
                parsed_skills = [s.strip() for s in data.skills.split(",") if s.strip()]
            else:
                parsed_skills = data.skills
            student.skills = json.dumps(parsed_skills)
        if data.projects is not None:
            if isinstance(data.projects, str):
                parsed_projects = [{"title": s.strip()} for s in data.projects.split("\n") if s.strip()] if data.projects.strip() else []
            else:
                parsed_projects = data.projects
            student.projects = json.dumps(parsed_projects)
        if data.certifications is not None:
            if isinstance(data.certifications, str):
                parsed_certs = [{"name": s.strip()} for s in data.certifications.split("\n") if s.strip()] if data.certifications.strip() else []
            else:
                parsed_certs = data.certifications
            student.certifications = json.dumps(parsed_certs)

        db.commit()
        db.refresh(student)
        return StudentService.get_profile(db, user)

    @staticmethod
    def save_resume(
        db: Session,
        user: User,
        file: UploadFile
    ) -> str:
        """
        Secure Resume Upload:
        - Validates file type is strictly PDF.
        - Validates file size (max 8MB).
        - Generates safe filename preventing directory traversal.
        - Stores in backend/uploads/.
        """
        student = StudentService.get_student_or_404(db, user)

        # 1. Validate file extension
        filename = file.filename or "resume.pdf"
        ext = os.path.splitext(filename)[1].lower()
        if ext != ".pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files (.pdf) are allowed."
            )

        # 2. Validate MIME content-type
        content_type = file.content_type or ""
        if "pdf" not in content_type.lower() and content_type != "application/octet-stream":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security rejection: uploaded file is not recognized as a PDF document."
            )

        # 3. Read and validate file size (Limit: 8 MB)
        content = file.file.read()
        max_size = 8 * 1024 * 1024  # 8 MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the 8 MB limit."
            )

        # 4. Generate safe filename
        safe_base = re.sub(r"[^a-zA-Z0-9_\-]", "_", os.path.splitext(filename)[0])[:30]
        unique_token = uuid.uuid4().hex[:10]
        safe_filename = f"student_{student.id}_{unique_token}_{safe_base}.pdf"
        destination_path = UPLOADS_DIR / safe_filename

        with open(destination_path, "wb") as f:
            f.write(content)

        # Update student record
        student.resume_url = f"/uploads/{safe_filename}"
        db.commit()
        db.refresh(student)

        # Create confirmation notification
        notification = Notification(
            title="Resume Uploaded Successfully",
            message=f"Your verified resume '{filename}' has been safely archived.",
            recipient_id=user.id,
            created_by_id=user.id,
            notification_type="SYSTEM",
        )
        db.add(notification)
        db.commit()

        return student.resume_url

    # -------------------------------------------------------------
    # Jobs & Eligibility Workflow
    # -------------------------------------------------------------
    @staticmethod
    def get_student_jobs(
        db: Session,
        user: User,
        eligible_only: bool = False
    ) -> List[Dict[str, Any]]:
        student = StudentService.get_student_or_404(db, user)

        # Ensure any active placement drives without jobs have an accessible job listing
        active_drives = (
            db.query(PlacementDrive)
            .join(Company, PlacementDrive.company_id == Company.id)
            .filter(
                PlacementDrive.is_active == True,
                Company.approval_status == CompanyApprovalStatus.APPROVED
            )
            .all()
        )
        for drive in active_drives:
            if not drive.jobs:
                auto_job = Job(
                    company_id=drive.company_id,
                    drive_id=drive.id,
                    title=drive.title,
                    description=drive.description or f"Campus placement drive for {drive.company.company_name}",
                    role_category="Campus Recruitment",
                    salary_package="Competitive",
                    job_location=drive.venue or "Campus Auditorium",
                    job_type="Full-Time",
                    is_active=True,
                )
                db.add(auto_job)
                db.commit()

        # Retrieve all active jobs from APPROVED companies
        jobs = (
            db.query(Job)
            .join(Company, Job.company_id == Company.id)
            .filter(
                Job.is_active == True,
                Company.approval_status == CompanyApprovalStatus.APPROVED
            )
            .order_by(Job.created_at.desc())
            .all()
        )

        results = []
        now_utc = datetime.now(timezone.utc)
        for job in jobs:
            # Check eligibility using reusable EligibilityService
            elig_res = EligibilityService.check_job_eligibility(student, job)

            # Check if student already applied
            application = (
                db.query(Application)
                .filter(
                    Application.job_id == job.id,
                    Application.student_id == student.id
                )
                .first()
            )

            is_deadline_passed = False
            if job.application_deadline:
                dl = job.application_deadline
                if dl.tzinfo is None:
                    dl = dl.replace(tzinfo=timezone.utc)
                if now_utc > dl:
                    is_deadline_passed = True

            rounds = []
            if job.drive and job.drive.selection_rounds:
                try:
                    rounds = json.loads(job.drive.selection_rounds)
                except Exception:
                    rounds = [r.strip() for r in job.drive.selection_rounds.split(",") if r.strip()]

            skills = []
            if job.required_skills:
                try:
                    skills = json.loads(job.required_skills)
                except Exception:
                    skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

            can_apply = (
                elig_res.is_eligible
                and student.is_verified
                and not is_deadline_passed
                and (application is None)
            )

            drive_obj = None
            if job.drive:
                drive_obj = {
                    "id": job.drive.id,
                    "title": job.drive.title,
                    "description": job.drive.description,
                    "drive_date": job.drive.drive_date,
                    "venue": job.drive.venue,
                    "selection_rounds": rounds,
                    "is_active": job.drive.is_active,
                }

            job_dict = {
                "id": job.id,
                "company_id": job.company_id,
                "company_name": job.company.company_name if job.company else "Recruiter Partner",
                "drive_id": job.drive_id,
                "drive_title": job.drive.title if job.drive else None,
                "title": job.title,
                "description": job.description,
                "role_category": job.role_category,
                "salary_package": job.salary_package,
                "salary_range": job.salary_package,
                "job_location": job.job_location,
                "location": job.job_location,
                "job_type": job.job_type,
                "application_deadline": job.application_deadline,
                "drive_date": job.drive.drive_date if job.drive else None,
                "venue": job.drive.venue if job.drive else None,
                "selection_rounds": rounds,
                "required_skills": skills,
                "eligibility_criteria": elig_res.matched_criteria,
                "is_eligible": elig_res.is_eligible,
                "can_apply": can_apply,
                "is_verified": student.is_verified,
                "eligibility_reasons": elig_res.reasons,
                "ineligibility_reasons": elig_res.reasons,
                "has_applied": application is not None,
                "already_applied": application is not None,
                "application_status": application.status.value if application else None,
                "drive": drive_obj,
                "created_at": job.created_at,
            }

            if eligible_only and not elig_res.is_eligible:
                continue

            results.append(job_dict)

        return results

    @staticmethod
    def get_job_detail(
        db: Session,
        user: User,
        job_id: int
    ) -> Dict[str, Any]:
        student = StudentService.get_student_or_404(db, user)
        job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found or inactive")

        elig_res = EligibilityService.check_job_eligibility(student, job)
        application = (
            db.query(Application)
            .filter(Application.job_id == job.id, Application.student_id == student.id)
            .first()
        )

        now_utc = datetime.now(timezone.utc)
        is_deadline_passed = False
        if job.application_deadline:
            dl = job.application_deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            if now_utc > dl:
                is_deadline_passed = True

        rounds = []
        if job.drive and job.drive.selection_rounds:
            try:
                rounds = json.loads(job.drive.selection_rounds)
            except Exception:
                rounds = [r.strip() for r in job.drive.selection_rounds.split(",") if r.strip()]

        skills = []
        if job.required_skills:
            try:
                skills = json.loads(job.required_skills)
            except Exception:
                skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

        can_apply = (
            elig_res.is_eligible
            and student.is_verified
            and not is_deadline_passed
            and (application is None)
        )

        drive_obj = None
        if job.drive:
            drive_obj = {
                "id": job.drive.id,
                "title": job.drive.title,
                "description": job.drive.description,
                "drive_date": job.drive.drive_date,
                "venue": job.drive.venue,
                "selection_rounds": rounds,
                "is_active": job.drive.is_active,
            }

        return {
            "id": job.id,
            "company_id": job.company_id,
            "company_name": job.company.company_name if job.company else "Recruiter Partner",
            "drive_id": job.drive_id,
            "drive_title": job.drive.title if job.drive else None,
            "title": job.title,
            "description": job.description,
            "role_category": job.role_category,
            "salary_package": job.salary_package,
            "salary_range": job.salary_package,
            "job_location": job.job_location,
            "location": job.job_location,
            "job_type": job.job_type,
            "application_deadline": job.application_deadline,
            "drive_date": job.drive.drive_date if job.drive else None,
            "venue": job.drive.venue if job.drive else None,
            "selection_rounds": rounds,
            "required_skills": skills,
            "eligibility_criteria": elig_res.matched_criteria,
            "is_eligible": elig_res.is_eligible,
            "can_apply": can_apply,
            "is_verified": student.is_verified,
            "eligibility_reasons": elig_res.reasons,
            "ineligibility_reasons": elig_res.reasons,
            "has_applied": application is not None,
            "already_applied": application is not None,
            "application_status": application.status.value if application else None,
            "drive": drive_obj,
            "created_at": job.created_at,
        }

    # -------------------------------------------------------------
    # Application Workflow (Apply & Prevent Ineligibility/Duplicates)
    # -------------------------------------------------------------
    @staticmethod
    def apply_to_job(
        db: Session,
        user: User,
        job_id: int,
        notes: Optional[str] = None
    ) -> Application:
        student = StudentService.get_student_or_404(db, user)

        # Condition 1: Profile MUST be verified by TPO
        if not student.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your academic profile is currently unverified. TPO verification is required before applying to campus drives."
            )

        job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job opening is either closed or no longer active."
            )

        # Condition 2: Check Deadline
        if job.application_deadline:
            # Make sure timezone aware comparison
            now_utc = datetime.now(timezone.utc)
            deadline = job.application_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            if now_utc > deadline:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"The application deadline for '{job.title}' expired on {deadline.strftime('%Y-%m-%d %H:%M UTC')}."
                )

        # Condition 3: Eligibility Engine Check
        elig_res = EligibilityService.check_job_eligibility(student, job)
        if not elig_res.is_eligible:
            reasons_text = "; ".join(elig_res.reasons)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You do not meet the eligibility criteria: {reasons_text}"
            )

        # Condition 4: Prevent Duplicate Applications
        existing_app = (
            db.query(Application)
            .filter(
                Application.job_id == job.id,
                Application.student_id == student.id
            )
            .first()
        )
        if existing_app:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted an application for this position."
            )

        # Create new application
        app_record = Application(
            job_id=job.id,
            student_id=student.id,
            status=ApplicationStatus.APPLIED,
            notes=notes,
            applied_at=datetime.now(timezone.utc),
        )
        db.add(app_record)

        # Send confirmation notification to student
        notification = Notification(
            title=f"Application Submitted: {job.title}",
            message=f"Your application for {job.title} at {job.company.company_name} has been received and forwarded to recruiters.",
            recipient_id=user.id,
            created_by_id=user.id,
            notification_type="APPLICATION_SUBMITTED",
            link_url="/student/applications",
        )
        db.add(notification)

        db.commit()
        db.refresh(app_record)
        return app_record

    @staticmethod
    def get_applications(db: Session, user: User) -> List[Dict[str, Any]]:
        student = StudentService.get_student_or_404(db, user)

        # Security: student can strictly access only their own applications
        applications = (
            db.query(Application)
            .filter(Application.student_id == student.id)
            .order_by(Application.applied_at.desc())
            .all()
        )

        results = []
        for app in applications:
            results.append({
                "id": app.id,
                "job_id": app.job_id,
                "job_title": app.job.title if app.job else "Unknown Role",
                "company_name": app.job.company.company_name if app.job and app.job.company else "Corporate Partner",
                "salary_package": app.job.salary_package if app.job else None,
                "job_location": app.job.job_location if app.job else None,
                "status": app.status,
                "interview_date": app.interview_date,
                "applied_at": app.applied_at,
                "notes": app.notes,
            })
        return results

    # -------------------------------------------------------------
    # Notifications Workflow (Read / Unread support)
    # -------------------------------------------------------------
    @staticmethod
    def get_notifications(db: Session, user: User) -> List[Notification]:
        student = StudentService.get_student_or_404(db, user)

        # Broadcast audience includes "ALL", "STUDENT", or student's specific department
        dept = student.department or ""
        notifications = (
            db.query(Notification)
            .filter(
                or_(
                    Notification.recipient_id == user.id,
                    Notification.target_audience.in_(["ALL", "STUDENT", dept])
                )
            )
            .order_by(Notification.created_at.desc())
            .all()
        )
        return notifications

    @staticmethod
    def mark_notification_read(db: Session, user: User, notification_id: int) -> bool:
        note = db.query(Notification).filter(Notification.id == notification_id).first()
        if not note:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

        # Security: verify access
        if note.recipient_id and note.recipient_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        note.is_read = True
        db.commit()
        return True

    @staticmethod
    def mark_all_notifications_read(db: Session, user: User) -> int:
        notes = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == user.id,
                Notification.is_read == False
            )
            .all()
        )
        for n in notes:
            n.is_read = True
        db.commit()
        return len(notes)

    # -------------------------------------------------------------
    # Student Dashboard
    # -------------------------------------------------------------
    @staticmethod
    def get_dashboard(db: Session, user: User) -> Dict[str, Any]:
        student = StudentService.get_student_or_404(db, user)
        completion = StudentService.calculate_profile_completion(student)

        # Count active jobs that are eligible
        all_jobs = (
            db.query(Job)
            .join(Company, Job.company_id == Company.id)
            .filter(Job.is_active == True, Company.approval_status == CompanyApprovalStatus.APPROVED)
            .all()
        )
        eligible_jobs_count = sum(
            1 for j in all_jobs if EligibilityService.check_job_eligibility(student, j).is_eligible
        )

        applied_apps = db.query(Application).filter(Application.student_id == student.id).all()
        applied_jobs_count = len(applied_apps)
        shortlisted_count = sum(1 for a in applied_apps if a.status in [ApplicationStatus.SHORTLISTED, ApplicationStatus.SELECTED])

        # Upcoming interviews
        upcoming_interviews_list = [
            {
                "id": a.id,
                "job_id": a.job_id,
                "job_title": a.job.title if a.job else "Role",
                "company_name": a.job.company.company_name if a.job and a.job.company else "Partner",
                "salary_package": a.job.salary_package if a.job else None,
                "job_location": a.job.job_location if a.job else None,
                "status": a.status,
                "interview_date": a.interview_date,
                "applied_at": a.applied_at,
                "notes": a.notes,
            }
            for a in applied_apps if a.status == ApplicationStatus.INTERVIEW_SCHEDULED
        ]

        # Recent notifications
        dept = student.department or ""
        notifications = (
            db.query(Notification)
            .filter(
                or_(
                    Notification.recipient_id == user.id,
                    Notification.target_audience.in_(["ALL", "STUDENT", dept])
                )
            )
            .order_by(Notification.created_at.desc())
            .limit(5)
            .all()
        )
        unread_count = sum(1 for n in notifications if not n.is_read)

        return {
            "profile_completion": completion,
            "cgpa": student.cgpa,
            "verification_status": "VERIFIED" if student.is_verified else "UNVERIFIED",
            "is_verified": student.is_verified,
            "eligible_jobs_count": eligible_jobs_count,
            "applied_jobs_count": applied_jobs_count,
            "shortlisted_count": shortlisted_count,
            "upcoming_interviews": upcoming_interviews_list,
            "recent_notifications": notifications,
            "unread_notifications_count": unread_count,
            "is_placed": student.is_placed,
            "placed_company_name": student.placed_company_name,
            "placed_package": student.placed_package,
        }
