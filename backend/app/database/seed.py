import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
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
from app.core.security import get_password_hash


def seed_demo_users_if_empty(db: Session) -> None:
    """Seed comprehensive initial dataset into SQLite if database has no users."""
    user_count = db.query(User).count()
    if user_count > 0:
        return

    # 1. Admin Demo User
    admin_user = User(
        email="admin@campushire.edu",
        hashed_password=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    admin_profile = Admin(
        user_id=admin_user.id,
        full_name="Dr. Arthur Vance",
        designation="Director of Corporate Placements & TPO",
        phone="+1 (555) 019-2831"
    )
    db.add(admin_profile)

    # 2. Student 1: Alex Morgan (Verified, in placement process)
    student_user_1 = User(
        email="student@campushire.edu",
        hashed_password=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(student_user_1)
    db.flush()

    student_profile_1 = Student(
        user_id=student_user_1.id,
        full_name="Alex Morgan",
        roll_number="CS2026-042",
        department="Computer Science & Engineering",
        graduation_year=2026,
        cgpa=8.92,
        phone="+1 (555) 018-7744",
        is_verified=True,
        verified_at=datetime.now(timezone.utc) - timedelta(days=5),
        backlogs=0,
        is_placed=False,
    )
    db.add(student_profile_1)

    # 3. Student 2: Priya Sharma (Verified and Placed!)
    student_user_2 = User(
        email="priya@campushire.edu",
        hashed_password=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(student_user_2)
    db.flush()

    student_profile_2 = Student(
        user_id=student_user_2.id,
        full_name="Priya Sharma",
        roll_number="CS2026-105",
        department="Computer Science & Engineering",
        graduation_year=2026,
        cgpa=9.35,
        phone="+1 (555) 018-9911",
        is_verified=True,
        verified_at=datetime.now(timezone.utc) - timedelta(days=10),
        backlogs=0,
        is_placed=True,
        placed_company_name="TechCorp Global Solutions",
        placed_package="14.5 LPA",
    )
    db.add(student_profile_2)

    # 4. Student 3: Rohan Gupta (Pending Academic Verification)
    student_user_3 = User(
        email="rohan@campushire.edu",
        hashed_password=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(student_user_3)
    db.flush()

    student_profile_3 = Student(
        user_id=student_user_3.id,
        full_name="Rohan Gupta",
        roll_number="ECE2026-018",
        department="Electronics & Communication",
        graduation_year=2026,
        cgpa=7.80,
        phone="+1 (555) 018-3322",
        is_verified=False,
        backlogs=1,
        is_placed=False,
    )
    db.add(student_profile_3)

    # 5. Company 1: TechCorp (APPROVED)
    company_user_1 = User(
        email="recruiter@techcorp.com",
        hashed_password=get_password_hash("CompanyPass123!"),
        role=UserRole.COMPANY,
        is_active=True
    )
    db.add(company_user_1)
    db.flush()

    company_profile_1 = Company(
        user_id=company_user_1.id,
        company_name="TechCorp Global Solutions",
        industry="Enterprise Software & Cloud Platforms",
        website="https://techcorp.example.com",
        contact_person="Sarah Jenkins (Head Talent Scout)",
        contact_email="sarah.jenkins@techcorp.com",
        phone="+1 (555) 017-9922",
        approval_status=CompanyApprovalStatus.APPROVED,
        approved_at=datetime.now(timezone.utc) - timedelta(days=15),
    )
    db.add(company_profile_1)
    db.flush()

    # 6. Company 2: Nova Systems AI (PENDING approval for Admin to review)
    company_user_2 = User(
        email="startup@novasystems.io",
        hashed_password=get_password_hash("CompanyPass123!"),
        role=UserRole.COMPANY,
        is_active=True
    )
    db.add(company_user_2)
    db.flush()

    company_profile_2 = Company(
        user_id=company_user_2.id,
        company_name="Nova Systems AI",
        industry="Artificial Intelligence & Machine Learning",
        website="https://novasystems.io",
        contact_person="Michael Chang (VP Engineering)",
        contact_email="michael@novasystems.io",
        phone="+1 (555) 017-4488",
        approval_status=CompanyApprovalStatus.PENDING,
    )
    db.add(company_profile_2)
    db.flush()

    # 7. Placement Drive for TechCorp
    drive = PlacementDrive(
        company_id=company_profile_1.id,
        title="TechCorp Annual Campus Hiring Drive 2026",
        description="On-campus placement drive for 2026 graduating batch software engineering & data engineering roles.",
        drive_date=datetime.now(timezone.utc) + timedelta(days=7),
        venue="Auditorium Hall B & Computer Labs 3-4",
        selection_rounds=json.dumps(["Online Aptitude & Coding Test", "Technical Interview Round 1", "System Design & HR"]),
        is_active=True,
    )
    db.add(drive)
    db.flush()

    # 8. Eligibility Criteria for the Drive
    criteria = EligibilityCriteria(
        drive_id=drive.id,
        min_cgpa=7.0,
        max_backlogs=0,
        eligible_branches=json.dumps(["Computer Science & Engineering", "Information Technology", "Electronics & Communication"]),
        eligible_batch=2026,
    )
    db.add(criteria)

    # 9. Job for TechCorp
    job = Job(
        company_id=company_profile_1.id,
        drive_id=drive.id,
        title="Associate Software Development Engineer (SDE-1)",
        description="Full stack web services, Python / React development, scalable backend microservices.",
        role_category="Software Engineering",
        salary_package="14.5 LPA",
        job_location="Bengaluru / Hybrid",
        job_type="Full-Time",
        is_active=True,
    )
    db.add(job)
    db.flush()

    # 10. Application for Alex Morgan
    app_record = Application(
        job_id=job.id,
        student_id=student_profile_1.id,
        status=ApplicationStatus.SHORTLISTED,
        notes="Passed initial screening test with 92% score."
    )
    db.add(app_record)

    # 11. Initial Admin Announcements
    note1 = Notification(
        title="Campus Hiring Season 2026 Officially Open",
        message="All students must ensure their academic records (CGPA and backlogs) are verified by the TPO cell before registering for active drives.",
        target_audience="ALL",
        created_by_id=admin_user.id,
    )
    note2 = Notification(
        title="TechCorp Placement Drive Registration Open",
        message="TechCorp Global Solutions drive date is set for next week. Eligible branches: CSE, IT, ECE. Minimum CGPA required is 7.0.",
        target_audience="STUDENT",
        created_by_id=admin_user.id,
    )
    db.add_all([note1, note2])

    # 12. Initial Audit Logs
    audit1 = AuditLog(
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        action="APPROVE_COMPANY",
        target_entity="Company",
        target_id=company_profile_1.id,
        details=f"Approved recruiter company '{company_profile_1.company_name}' for campus recruitment.",
    )
    audit2 = AuditLog(
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        action="VERIFY_STUDENT",
        target_entity="Student",
        target_id=student_profile_1.id,
        details=f"Verified academic profile for {student_profile_1.full_name} ({student_profile_1.roll_number}).",
    )
    audit3 = AuditLog(
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        action="CREATE_DRIVE",
        target_entity="PlacementDrive",
        target_id=drive.id,
        details=f"Created placement drive '{drive.title}' with SQLite eligibility criteria.",
    )
    db.add_all([audit1, audit2, audit3])

    db.commit()
