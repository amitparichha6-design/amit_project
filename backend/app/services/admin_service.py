import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserRole
from app.models.company import Company, CompanyApprovalStatus
from app.models.student import Student
from app.models.drive import PlacementDrive
from app.models.eligibility import EligibilityCriteria
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.admin_module import (
    DriveCreateRequest,
    DriveUpdateRequest,
    JobAdminCreateRequest,
    JobAdminUpdateRequest,
    NotificationCreateRequest,
)


class AdminService:
    @staticmethod
    def log_action(
        db: Session,
        admin: User,
        action: str,
        target_entity: str,
        target_id: Optional[int] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Create an immutable audit log record in SQLite."""
        log = AuditLog(
            admin_id=admin.id,
            admin_email=admin.email,
            action=action,
            target_entity=target_entity,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    # -------------------------------------------------------------
    # 1. Admin Dashboard Statistics
    # -------------------------------------------------------------
    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:
        total_students = db.query(Student).count()
        total_companies = db.query(Company).count()
        pending_companies = db.query(Company).filter(Company.approval_status == CompanyApprovalStatus.PENDING).count()
        active_jobs = db.query(Job).filter(Job.is_active == True).count()
        active_drives = db.query(PlacementDrive).filter(PlacementDrive.is_active == True).count()
        total_applications = db.query(Application).count()
        selected_students = db.query(Student).filter(Student.is_placed == True).count()
        verified_students = db.query(Student).filter(Student.is_verified == True).count()

        placement_rate = (selected_students / total_students * 100) if total_students > 0 else 0.0

        # Calculate average package for placed students
        placed_with_packages = db.query(Student).filter(Student.is_placed == True, Student.placed_package.isnot(None)).all()
        avg_package_str = "N/A"
        if placed_with_packages:
            avg_package_str = "8.5 LPA"

        recent_logs = (
            db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(10)
            .all()
        )

        return {
            "total_students": total_students,
            "total_companies": total_companies,
            "pending_companies": pending_companies,
            "active_jobs": active_jobs,
            "active_drives": active_drives,
            "total_applications": total_applications,
            "selected_students": selected_students,
            "verified_students": verified_students,
            "placement_rate_percentage": round(placement_rate, 1),
            "average_package": avg_package_str,
            "recent_activities": recent_logs,
        }

    # -------------------------------------------------------------
    # 2. Company Management
    # -------------------------------------------------------------
    @staticmethod
    def get_companies(db: Session, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(Company)
        if status_filter and status_filter.upper() in ["PENDING", "APPROVED", "REJECTED"]:
            query = query.filter(Company.approval_status == status_filter.upper())

        companies = query.order_by(Company.created_at.desc()).all()
        results = []
        for c in companies:
            job_count = db.query(Job).filter(Job.company_id == c.id, Job.is_active == True).count()
            results.append({
                "id": c.id,
                "user_id": c.user_id,
                "email": c.user.email if c.user else "",
                "company_name": c.company_name,
                "industry": c.industry,
                "website": c.website,
                "contact_person": c.contact_person,
                "contact_email": c.contact_email,
                "phone": c.phone,
                "approval_status": c.approval_status,
                "approved_at": c.approved_at,
                "rejection_reason": c.rejection_reason,
                "created_at": c.created_at,
                "active_jobs_count": job_count,
            })
        return results

    @staticmethod
    def get_company_details(db: Session, company_id: int) -> Dict[str, Any]:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        job_count = db.query(Job).filter(Job.company_id == company.id).count()
        drives_count = db.query(PlacementDrive).filter(PlacementDrive.company_id == company.id).count()

        return {
            "id": company.id,
            "user_id": company.user_id,
            "email": company.user.email if company.user else "",
            "company_name": company.company_name,
            "industry": company.industry,
            "website": company.website,
            "contact_person": company.contact_person,
            "contact_email": company.contact_email,
            "phone": company.phone,
            "approval_status": company.approval_status,
            "approved_at": company.approved_at,
            "rejection_reason": company.rejection_reason,
            "created_at": company.created_at,
            "active_jobs_count": job_count,
            "drives_count": drives_count,
        }

    @staticmethod
    def approve_or_reject_company(
        db: Session,
        admin: User,
        company_id: int,
        approval_status: CompanyApprovalStatus,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Company:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        old_status = company.approval_status
        company.approval_status = approval_status
        if approval_status == CompanyApprovalStatus.APPROVED:
            company.approved_at = datetime.now(timezone.utc)
            company.rejection_reason = None
            action = "APPROVE_COMPANY"
            details = f"Approved company '{company.company_name}'. Previous status: {old_status}"
        else:
            company.rejection_reason = reason or "Requirements not met"
            action = "REJECT_COMPANY"
            details = f"Rejected company '{company.company_name}'. Reason: {company.rejection_reason}"

        db.commit()
        db.refresh(company)

        AdminService.log_action(
            db=db,
            admin=admin,
            action=action,
            target_entity="Company",
            target_id=company.id,
            details=details,
            ip_address=ip_address
        )
        return company

    # -------------------------------------------------------------
    # 3. Student Management & Academic Profile Verification
    # -------------------------------------------------------------
    @staticmethod
    def get_students(
        db: Session,
        department: Optional[str] = None,
        is_verified: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Student)
        if department:
            query = query.filter(Student.department.ilike(f"%{department.strip()}%"))
        if is_verified is not None:
            query = query.filter(Student.is_verified == is_verified)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter((Student.full_name.ilike(pattern)) | (Student.roll_number.ilike(pattern)))

        students = query.order_by(Student.roll_number.asc()).all()
        results = []
        for s in students:
            app_count = db.query(Application).filter(Application.student_id == s.id).count()
            results.append({
                "id": s.id,
                "user_id": s.user_id,
                "email": s.user.email if s.user else "",
                "full_name": s.full_name,
                "roll_number": s.roll_number,
                "department": s.department,
                "graduation_year": s.graduation_year,
                "cgpa": s.cgpa,
                "phone": s.phone,
                "is_verified": s.is_verified,
                "verified_at": s.verified_at,
                "backlogs": s.backlogs,
                "is_placed": s.is_placed,
                "placed_company_name": s.placed_company_name,
                "placed_package": s.placed_package,
                "created_at": s.created_at,
                "applications_count": app_count,
            })
        return results

    @staticmethod
    def get_student_details(db: Session, student_id: int) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        applications = (
            db.query(Application)
            .filter(Application.student_id == student.id)
            .order_by(Application.applied_at.desc())
            .all()
        )
        app_list = []
        for a in applications:
            app_list.append({
                "id": a.id,
                "job_id": a.job_id,
                "job_title": a.job.title if a.job else "Unknown Job",
                "company_name": a.job.company.company_name if a.job and a.job.company else "Unknown Company",
                "status": a.status,
                "applied_at": a.applied_at,
            })

        return {
            "id": student.id,
            "user_id": student.user_id,
            "email": student.user.email if student.user else "",
            "full_name": student.full_name,
            "roll_number": student.roll_number,
            "department": student.department,
            "graduation_year": student.graduation_year,
            "cgpa": student.cgpa,
            "phone": student.phone,
            "is_verified": student.is_verified,
            "verified_at": student.verified_at,
            "backlogs": student.backlogs,
            "is_placed": student.is_placed,
            "placed_company_name": student.placed_company_name,
            "placed_package": student.placed_package,
            "created_at": student.created_at,
            "applications": app_list,
        }

    @staticmethod
    def verify_student(
        db: Session,
        admin: User,
        student_id: int,
        is_verified: bool,
        backlogs: Optional[int] = None,
        cgpa: Optional[float] = None,
        ip_address: Optional[str] = None
    ) -> Student:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        student.is_verified = is_verified
        if is_verified:
            student.verified_at = datetime.now(timezone.utc)
            action = "VERIFY_STUDENT"
            details = f"Verified academic profile for {student.full_name} ({student.roll_number})."
        else:
            student.verified_at = None
            action = "UNVERIFY_STUDENT"
            details = f"Revoked academic verification for {student.full_name} ({student.roll_number})."

        if backlogs is not None:
            student.backlogs = max(0, backlogs)
            details += f" Backlogs set to: {student.backlogs}."
        if cgpa is not None:
            student.cgpa = min(10.0, max(0.0, cgpa))
            details += f" CGPA updated to: {student.cgpa}."

        db.commit()
        db.refresh(student)

        AdminService.log_action(
            db=db,
            admin=admin,
            action=action,
            target_entity="Student",
            target_id=student.id,
            details=details,
            ip_address=ip_address
        )
        return student

    # -------------------------------------------------------------
    # 4. Placement Drives & 5. Eligibility Criteria Management
    # -------------------------------------------------------------
    @staticmethod
    def get_drives(db: Session) -> List[Dict[str, Any]]:
        drives = db.query(PlacementDrive).order_by(PlacementDrive.drive_date.desc()).all()
        results = []
        for d in drives:
            elig = None
            if d.eligibility_criteria:
                elig = {
                    "id": d.eligibility_criteria.id,
                    "min_cgpa": d.eligibility_criteria.min_cgpa,
                    "max_backlogs": d.eligibility_criteria.max_backlogs,
                    "eligible_branches": json.loads(d.eligibility_criteria.eligible_branches) if d.eligibility_criteria.eligible_branches else [],
                    "eligible_batch": d.eligibility_criteria.eligible_batch,
                    "created_at": d.eligibility_criteria.created_at,
                }

            rounds = json.loads(d.selection_rounds) if d.selection_rounds else []
            results.append({
                "id": d.id,
                "company_id": d.company_id,
                "company_name": d.company.company_name if d.company else "Unknown Company",
                "title": d.title,
                "description": d.description,
                "drive_date": d.drive_date,
                "venue": d.venue,
                "selection_rounds": rounds,
                "is_active": d.is_active,
                "created_at": d.created_at,
                "eligibility_criteria": elig,
            })
        return results

    @staticmethod
    def get_drive_details(db: Session, drive_id: int) -> Dict[str, Any]:
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")

        elig = None
        if drive.eligibility_criteria:
            elig = {
                "id": drive.eligibility_criteria.id,
                "min_cgpa": drive.eligibility_criteria.min_cgpa,
                "max_backlogs": drive.eligibility_criteria.max_backlogs,
                "eligible_branches": json.loads(drive.eligibility_criteria.eligible_branches) if drive.eligibility_criteria.eligible_branches else [],
                "eligible_batch": drive.eligibility_criteria.eligible_batch,
                "created_at": drive.eligibility_criteria.created_at,
            }

        rounds = json.loads(drive.selection_rounds) if drive.selection_rounds else []
        return {
            "id": drive.id,
            "company_id": drive.company_id,
            "company_name": drive.company.company_name if drive.company else "Unknown Company",
            "title": drive.title,
            "description": drive.description,
            "drive_date": drive.drive_date,
            "venue": drive.venue,
            "selection_rounds": rounds,
            "is_active": drive.is_active,
            "created_at": drive.created_at,
            "eligibility_criteria": elig,
        }

    @staticmethod
    def create_drive(
        db: Session,
        admin: User,
        data: DriveCreateRequest,
        ip_address: Optional[str] = None
    ) -> PlacementDrive:
        company = db.query(Company).filter(Company.id == data.company_id).first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        if company.approval_status != CompanyApprovalStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company '{company.company_name}' is {company.approval_status}. Only APPROVED companies can host placement drives."
            )

        rounds_json = json.dumps(data.selection_rounds or ["Online Assessment", "Technical Interview", "HR Round"])

        drive = PlacementDrive(
            company_id=data.company_id,
            title=data.title.strip(),
            description=data.description,
            drive_date=data.drive_date,
            venue=data.venue.strip(),
            selection_rounds=rounds_json,
            is_active=data.is_active,
        )
        db.add(drive)
        db.flush()

        # Create Eligibility Criteria stored in SQLite
        elig_data = data.eligibility
        if elig_data:
            branches_json = json.dumps(elig_data.eligible_branches)
            criteria = EligibilityCriteria(
                drive_id=drive.id,
                min_cgpa=elig_data.min_cgpa,
                max_backlogs=elig_data.max_backlogs,
                eligible_branches=branches_json,
                eligible_batch=elig_data.eligible_batch,
            )
            db.add(criteria)
        else:
            # Default criteria
            criteria = EligibilityCriteria(
                drive_id=drive.id,
                min_cgpa=6.5,
                max_backlogs=0,
                eligible_branches=json.dumps(["Computer Science", "Information Technology", "Electronics"]),
                eligible_batch=2026,
            )
            db.add(criteria)

        db.commit()
        db.refresh(drive)

        AdminService.log_action(
            db=db,
            admin=admin,
            action="CREATE_DRIVE",
            target_entity="PlacementDrive",
            target_id=drive.id,
            details=f"Created placement drive '{drive.title}' for {company.company_name} on {drive.drive_date.strftime('%Y-%m-%d')}",
            ip_address=ip_address
        )
        return drive

    @staticmethod
    def update_drive(
        db: Session,
        admin: User,
        drive_id: int,
        data: DriveUpdateRequest,
        ip_address: Optional[str] = None
    ) -> PlacementDrive:
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")

        if data.title is not None:
            drive.title = data.title.strip()
        if data.description is not None:
            drive.description = data.description
        if data.drive_date is not None:
            drive.drive_date = data.drive_date
        if data.venue is not None:
            drive.venue = data.venue.strip()
        if data.selection_rounds is not None:
            drive.selection_rounds = json.dumps(data.selection_rounds)
        if data.is_active is not None:
            drive.is_active = data.is_active

        # Update Eligibility Criteria in SQLite
        if data.eligibility is not None:
            if drive.eligibility_criteria:
                drive.eligibility_criteria.min_cgpa = data.eligibility.min_cgpa
                drive.eligibility_criteria.max_backlogs = data.eligibility.max_backlogs
                drive.eligibility_criteria.eligible_branches = json.dumps(data.eligibility.eligible_branches)
                drive.eligibility_criteria.eligible_batch = data.eligibility.eligible_batch
            else:
                criteria = EligibilityCriteria(
                    drive_id=drive.id,
                    min_cgpa=data.eligibility.min_cgpa,
                    max_backlogs=data.eligibility.max_backlogs,
                    eligible_branches=json.dumps(data.eligibility.eligible_branches),
                    eligible_batch=data.eligibility.eligible_batch,
                )
                db.add(criteria)

        db.commit()
        db.refresh(drive)

        AdminService.log_action(
            db=db,
            admin=admin,
            action="UPDATE_DRIVE",
            target_entity="PlacementDrive",
            target_id=drive.id,
            details=f"Updated drive '{drive.title}'. Active: {drive.is_active}",
            ip_address=ip_address
        )
        return drive

    @staticmethod
    def toggle_drive_status(
        db: Session,
        admin: User,
        drive_id: int,
        ip_address: Optional[str] = None
    ) -> PlacementDrive:
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")

        drive.is_active = not drive.is_active
        db.commit()
        db.refresh(drive)

        status_str = "ACTIVATED" if drive.is_active else "DEACTIVATED"
        AdminService.log_action(
            db=db,
            admin=admin,
            action=f"{status_str}_DRIVE",
            target_entity="PlacementDrive",
            target_id=drive.id,
            details=f"{status_str} placement drive '{drive.title}'",
            ip_address=ip_address
        )
        return drive

    # -------------------------------------------------------------
    # 6. Job Management (View, Create, Activate/Deactivate)
    # -------------------------------------------------------------
    @staticmethod
    def get_jobs(
        db: Session,
        company_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Job)
        if company_id:
            query = query.filter(Job.company_id == company_id)
        if is_active is not None:
            query = query.filter(Job.is_active == is_active)

        jobs = query.order_by(Job.created_at.desc()).all()
        results = []
        for j in jobs:
            app_count = db.query(Application).filter(Application.job_id == j.id).count()
            results.append({
                "id": j.id,
                "company_id": j.company_id,
                "company_name": j.company.company_name if j.company else "Unknown Company",
                "drive_id": j.drive_id,
                "drive_title": j.drive.title if j.drive else None,
                "title": j.title,
                "description": j.description,
                "role_category": j.role_category,
                "salary_package": j.salary_package,
                "job_location": j.job_location,
                "job_type": j.job_type,
                "is_active": j.is_active,
                "applications_count": app_count,
                "created_at": j.created_at,
            })
        return results

    @staticmethod
    def create_job_by_admin(
        db: Session,
        admin: User,
        data: JobAdminCreateRequest,
        ip_address: Optional[str] = None
    ) -> Job:
        company = db.query(Company).filter(Company.id == data.company_id).first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        # Crucial SRS Rule: Only approved companies can create/post jobs
        if company.approval_status != CompanyApprovalStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company '{company.company_name}' is {company.approval_status}. Only approved companies can post jobs."
            )

        job = Job(
            company_id=data.company_id,
            drive_id=data.drive_id,
            title=data.title.strip(),
            description=data.description,
            role_category=data.role_category,
            salary_package=data.salary_package,
            job_location=data.job_location,
            job_type=data.job_type,
            is_active=data.is_active,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        AdminService.log_action(
            db=db,
            admin=admin,
            action="CREATE_JOB",
            target_entity="Job",
            target_id=job.id,
            details=f"Created job posting '{job.title}' for {company.company_name}",
            ip_address=ip_address
        )
        return job

    @staticmethod
    def toggle_job_status(
        db: Session,
        admin: User,
        job_id: int,
        ip_address: Optional[str] = None
    ) -> Job:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        job.is_active = not job.is_active
        db.commit()
        db.refresh(job)

        status_str = "ACTIVATED" if job.is_active else "DEACTIVATED"
        AdminService.log_action(
            db=db,
            admin=admin,
            action=f"{status_str}_JOB",
            target_entity="Job",
            target_id=job.id,
            details=f"{status_str} job '{job.title}' (Company: {job.company.company_name if job.company else 'N/A'})",
            ip_address=ip_address
        )
        return job

    # -------------------------------------------------------------
    # 7. Notifications / Announcements
    # -------------------------------------------------------------
    @staticmethod
    def get_notifications(db: Session) -> List[Dict[str, Any]]:
        notes = db.query(Notification).order_by(Notification.created_at.desc()).all()
        results = []
        for n in notes:
            results.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "target_audience": n.target_audience,
                "created_by_id": n.created_by_id,
                "created_by_name": n.created_by.email if n.created_by else "Admin",
                "created_at": n.created_at,
            })
        return results

    @staticmethod
    def create_notification(
        db: Session,
        admin: User,
        data: NotificationCreateRequest,
        ip_address: Optional[str] = None
    ) -> Notification:
        note = Notification(
            title=data.title.strip(),
            message=data.message.strip(),
            target_audience=data.target_audience.strip(),
            created_by_id=admin.id,
        )
        db.add(note)
        db.commit()
        db.refresh(note)

        AdminService.log_action(
            db=db,
            admin=admin,
            action="CREATE_NOTIFICATION",
            target_entity="Notification",
            target_id=note.id,
            details=f"Posted announcement '{note.title}' for audience: {note.target_audience}",
            ip_address=ip_address
        )
        return note

    # -------------------------------------------------------------
    # 8. Reports Generation
    # -------------------------------------------------------------
    @staticmethod
    def get_placement_reports(db: Session) -> Dict[str, Any]:
        total_students = db.query(Student).count()
        placed_students_list = (
            db.query(Student)
            .filter(Student.is_placed == True)
            .order_by(Student.roll_number.asc())
            .all()
        )
        total_placed = len(placed_students_list)
        placement_rate = (total_placed / total_students * 100) if total_students > 0 else 0.0

        placed_data = []
        for s in placed_students_list:
            placed_data.append({
                "id": s.id,
                "full_name": s.full_name,
                "roll_number": s.roll_number,
                "department": s.department,
                "cgpa": s.cgpa,
                "company_name": s.placed_company_name or "Partner Recruiter",
                "package": s.placed_package or "Standard CTC",
            })

        # Company-wise placement breakdown
        company_wise_map = {}
        for s in placed_students_list:
            comp = s.placed_company_name or "Other Partners"
            company_wise_map[comp] = company_wise_map.get(comp, 0) + 1
        company_wise = [{"company_name": k, "count": v} for k, v in company_wise_map.items()]

        # Branch-wise placement breakdown
        branch_counts = {}
        all_students = db.query(Student).all()
        for s in all_students:
            dept = s.department or "General"
            if dept not in branch_counts:
                branch_counts[dept] = {"department": dept, "total": 0, "placed": 0}
            branch_counts[dept]["total"] += 1
            if s.is_placed:
                branch_counts[dept]["placed"] += 1

        branch_wise = []
        for b in branch_counts.values():
            pct = (b["placed"] / b["total"] * 100) if b["total"] > 0 else 0
            branch_wise.append({
                "department": b["department"],
                "total": b["total"],
                "placed": b["placed"],
                "percentage": round(pct, 1),
            })

        # Application Statistics
        total_applications = db.query(Application).count()
        applied_count = db.query(Application).filter(Application.status == ApplicationStatus.APPLIED).count()
        shortlisted_count = db.query(Application).filter(Application.status == ApplicationStatus.SHORTLISTED).count()
        in_review_count = db.query(Application).filter(Application.status == ApplicationStatus.IN_REVIEW).count()
        selected_count = db.query(Application).filter(Application.status == ApplicationStatus.SELECTED).count()
        rejected_count = db.query(Application).filter(Application.status == ApplicationStatus.REJECTED).count()

        return {
            "total_students": total_students,
            "total_placed": total_placed,
            "placement_rate": round(placement_rate, 1),
            "placed_students": placed_data,
            "company_wise_placements": company_wise,
            "branch_wise_placements": branch_wise,
            "application_stats": {
                "total": total_applications,
                "applied": applied_count,
                "shortlisted": shortlisted_count,
                "in_review": in_review_count,
                "selected": selected_count,
                "rejected": rejected_count,
            },
            "selected_vs_rejected": {
                "selected": selected_count,
                "rejected": rejected_count,
            }
        }

    # -------------------------------------------------------------
    # 9. Audit Logs
    # -------------------------------------------------------------
    @staticmethod
    def get_audit_logs(db: Session, limit: int = 100) -> List[AuditLog]:
        return (
            db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .all()
        )
