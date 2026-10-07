import json
import io
from datetime import datetime, timezone, timedelta
from app.models.student import Student
from app.models.eligibility import EligibilityCriteria
from app.services.eligibility_service import EligibilityService


def create_user_and_token(client, email, password, role, extra_data=None):
    payload = {"email": email, "password": password, "role": role}
    if extra_data:
        payload.update(extra_data)
    client.post("/api/auth/register", json=payload)
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def setup_approved_company_and_job(client, admin_headers, min_cgpa=7.0, max_backlogs=0, branches=None, batch=2026, deadline=None):
    if branches is None:
        branches = ["Computer Science", "Information Technology"]

    # Register Company
    client.post(
        "/api/auth/register",
        json={
            "email": "corp_recruiter@tech.com",
            "password": "Password123!",
            "role": "COMPANY",
            "company_name": "MegaTech Systems"
        }
    )
    companies = client.get("/api/admin/companies", headers=admin_headers).json()
    comp = next(c for c in companies if c["company_name"] == "MegaTech Systems")
    company_id = comp["id"]

    # Approve Company
    client.post(f"/api/admin/companies/{company_id}/approval", json={"status": "APPROVED"}, headers=admin_headers)

    # Create Drive with Eligibility Criteria in SQLite
    drive_date = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    drive_res = client.post(
        "/api/admin/drives",
        json={
            "company_id": company_id,
            "title": "MegaTech Campus Drive 2026",
            "drive_date": drive_date,
            "venue": "Main Auditorium",
            "selection_rounds": ["Online Test", "Technical", "HR"],
            "eligibility": {
                "min_cgpa": min_cgpa,
                "max_backlogs": max_backlogs,
                "eligible_branches": branches,
                "eligible_batch": batch
            }
        },
        headers=admin_headers
    )
    drive_id = drive_res.json()["id"]

    # Create Job
    job_res = client.post(
        "/api/admin/jobs",
        json={
            "company_id": company_id,
            "drive_id": drive_id,
            "title": "Software Development Engineer",
            "salary_package": "12 LPA",
            "job_location": "Bengaluru",
            "job_type": "Full-Time",
            "is_active": True
        },
        headers=admin_headers
    )
    job_id = job_res.json()["id"]
    return company_id, drive_id, job_id


# -------------------------------------------------------------
# 1. Unit Tests for EligibilityEngine (Pass / Fail Scenarios)
# -------------------------------------------------------------
def test_eligibility_engine_scenarios():
    criteria = EligibilityCriteria(
        min_cgpa=7.5,
        max_backlogs=0,
        eligible_branches=json.dumps(["Computer Science", "Information Technology"]),
        eligible_batch=2026
    )

    # Case 1: Pass
    student_pass = Student(
        full_name="Valid Student",
        cgpa=8.2,
        backlogs=0,
        department="Computer Science",
        graduation_year=2026
    )
    res_pass = EligibilityService.check_eligibility(student_pass, criteria)
    assert res_pass.is_eligible is True
    assert len(res_pass.reasons) == 0

    # Case 2: CGPA failure
    student_cgpa_fail = Student(
        full_name="Low CGPA",
        cgpa=6.8,
        backlogs=0,
        department="Computer Science",
        graduation_year=2026
    )
    res_cgpa = EligibilityService.check_eligibility(student_cgpa_fail, criteria)
    assert res_cgpa.is_eligible is False
    assert any("CGPA" in r for r in res_cgpa.reasons)

    # Case 3: Backlog failure
    student_backlog_fail = Student(
        full_name="Backlogs Student",
        cgpa=8.5,
        backlogs=2,
        department="Computer Science",
        graduation_year=2026
    )
    res_backlog = EligibilityService.check_eligibility(student_backlog_fail, criteria)
    assert res_backlog.is_eligible is False
    assert any("Active backlogs" in r for r in res_backlog.reasons)

    # Case 4: Branch failure
    student_branch_fail = Student(
        full_name="Civil Student",
        cgpa=8.5,
        backlogs=0,
        department="Civil Engineering",
        graduation_year=2026
    )
    res_branch = EligibilityService.check_eligibility(student_branch_fail, criteria)
    assert res_branch.is_eligible is False
    assert any("not among eligible branches" in r for r in res_branch.reasons)

    # Case 5: Batch failure
    student_batch_fail = Student(
        full_name="Older Batch",
        cgpa=8.5,
        backlogs=0,
        department="Computer Science",
        graduation_year=2025
    )
    res_batch = EligibilityService.check_eligibility(student_batch_fail, criteria)
    assert res_batch.is_eligible is False
    assert any("Graduation batch" in r for r in res_batch.reasons)


# -------------------------------------------------------------
# 2. Unverified Student Cannot Apply
# -------------------------------------------------------------
def test_unverified_student_cannot_apply(client):
    admin_h = create_user_and_token(client, "admin_tpo@college.edu", "AdminPass123!", "ADMIN")
    _, _, job_id = setup_approved_company_and_job(client, admin_h, min_cgpa=6.0)

    # Student registers (is_verified is False by default)
    student_h = create_user_and_token(
        client,
        "unverified_st@college.edu",
        "StudentPass123!",
        "STUDENT",
        {"full_name": "Unverified Person", "department": "Computer Science", "graduation_year": 2026, "cgpa": 8.0}
    )

    # Attempt to apply -> Must fail with 400
    res = client.post(f"/api/student/jobs/{job_id}/apply", headers=student_h)
    assert res.status_code == 400
    assert "unverified" in res.json()["detail"].lower()


# -------------------------------------------------------------
# 3. Successful Application & Notification Generation
# -------------------------------------------------------------
def test_successful_application_and_notifications(client):
    admin_h = create_user_and_token(client, "admin_officer@college.edu", "AdminPass123!", "ADMIN")
    _, _, job_id = setup_approved_company_and_job(client, admin_h, min_cgpa=7.0)

    # Student registers
    student_h = create_user_and_token(
        client,
        "eligible_st@college.edu",
        "StudentPass123!",
        "STUDENT",
        {"full_name": "Eligible Candidate", "department": "Computer Science", "graduation_year": 2026, "cgpa": 8.5}
    )

    # Admin verifies the student profile
    students = client.get("/api/admin/students", headers=admin_h).json()
    st_id = next(s["id"] for s in students if s["email"] == "eligible_st@college.edu")
    client.post(f"/api/admin/students/{st_id}/verification", json={"is_verified": True, "backlogs": 0, "cgpa": 8.5}, headers=admin_h)

    # Student checks jobs list
    jobs_res = client.get("/api/student/jobs", headers=student_h)
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) >= 1
    assert jobs[0]["is_eligible"] is True

    # Student applies
    apply_res = client.post(f"/api/student/jobs/{job_id}/apply", json={"notes": "Eager to join the engineering team."}, headers=student_h)
    assert apply_res.status_code == 201
    assert apply_res.json()["status"] == "APPLIED"

    # Check My Applications
    my_apps = client.get("/api/student/applications", headers=student_h)
    assert my_apps.status_code == 200
    assert len(my_apps.json()) == 1
    assert my_apps.json()[0]["job_id"] == job_id

    # Check Notifications
    notes = client.get("/api/student/notifications", headers=student_h)
    assert notes.status_code == 200
    assert len(notes.json()) >= 1
    assert any("Application Submitted" in n["title"] for n in notes.json())


# -------------------------------------------------------------
# 4. Duplicate Application Prevention
# -------------------------------------------------------------
def test_duplicate_application_prevention(client):
    admin_h = create_user_and_token(client, "admin_dup@college.edu", "AdminPass123!", "ADMIN")
    _, _, job_id = setup_approved_company_and_job(client, admin_h, min_cgpa=6.0)

    student_h = create_user_and_token(
        client,
        "dup_student@college.edu",
        "StudentPass123!",
        "STUDENT",
        {"full_name": "Dup Student", "department": "Computer Science", "graduation_year": 2026, "cgpa": 8.0}
    )

    students = client.get("/api/admin/students", headers=admin_h).json()
    st_id = next(s["id"] for s in students if s["email"] == "dup_student@college.edu")
    client.post(f"/api/admin/students/{st_id}/verification", json={"is_verified": True, "backlogs": 0, "cgpa": 8.0}, headers=admin_h)

    # First application -> Succeeds
    res1 = client.post(f"/api/student/jobs/{job_id}/apply", headers=student_h)
    assert res1.status_code == 201

    # Second application -> Fails with 400
    res2 = client.post(f"/api/student/jobs/{job_id}/apply", headers=student_h)
    assert res2.status_code == 400
    assert "already" in res2.json()["detail"].lower()


# -------------------------------------------------------------
# 5. Ineligible Student Application Blocked
# -------------------------------------------------------------
def test_ineligible_student_application_blocked(client):
    admin_h = create_user_and_token(client, "admin_block@college.edu", "AdminPass123!", "ADMIN")
    _, _, job_id = setup_approved_company_and_job(client, admin_h, min_cgpa=8.0, branches=["Information Technology"])

    student_h = create_user_and_token(
        client,
        "low_cgpa_st@college.edu",
        "StudentPass123!",
        "STUDENT",
        {"full_name": "Low CGPA", "department": "Mechanical Engineering", "graduation_year": 2026, "cgpa": 6.5}
    )

    students = client.get("/api/admin/students", headers=admin_h).json()
    st_id = next(s["id"] for s in students if s["email"] == "low_cgpa_st@college.edu")
    client.post(f"/api/admin/students/{st_id}/verification", json={"is_verified": True, "backlogs": 0, "cgpa": 6.5}, headers=admin_h)

    # Student views jobs -> flagged as ineligible with reasons
    job_detail = client.get(f"/api/student/jobs/{job_id}", headers=student_h).json()
    assert job_detail["is_eligible"] is False
    assert len(job_detail["eligibility_reasons"]) >= 1

    # Attempt to apply -> Fails with 400
    apply_res = client.post(f"/api/student/jobs/{job_id}/apply", headers=student_h)
    assert apply_res.status_code == 400
    assert "eligibility criteria" in apply_res.json()["detail"].lower()


# -------------------------------------------------------------
# 6. Unauthorized Student Data Access Prevention
# -------------------------------------------------------------
def test_unauthorized_student_data_access(client):
    student_a_h = create_user_and_token(client, "student_a@college.edu", "Password123!", "STUDENT")
    student_b_h = create_user_and_token(client, "student_b@college.edu", "Password123!", "STUDENT")
    company_h = create_user_and_token(client, "unauth_comp@co.com", "Password123!", "COMPANY")

    # Non-students cannot access student dashboard or applications
    assert client.get("/api/student/dashboard", headers=company_h).status_code == 403
    assert client.get("/api/student/profile", headers=company_h).status_code == 403

    # Student A accesses own profile
    profile_a = client.get("/api/student/profile", headers=student_a_h).json()
    assert profile_a["email"] == "student_a@college.edu"

    # Student B accesses own profile
    profile_b = client.get("/api/student/profile", headers=student_b_h).json()
    assert profile_b["email"] == "student_b@college.edu"
    assert profile_b["id"] != profile_a["id"]


# -------------------------------------------------------------
# 7. Resume Upload Validation
# -------------------------------------------------------------
def test_resume_upload_validation(client):
    student_h = create_user_and_token(client, "resume_test@college.edu", "Password123!", "STUDENT")

    # 1. Non-pdf upload rejected
    bad_file = ("script.exe", b"executable payload", "application/octet-stream")
    bad_res = client.post("/api/student/resume", files={"file": bad_file}, headers=student_h)
    assert bad_res.status_code == 400
    assert "Only PDF files" in bad_res.json()["detail"]

    # 2. Valid PDF upload accepted
    pdf_content = b"%PDF-1.4 Mock valid PDF document binary format"
    valid_file = ("my_resume.pdf", pdf_content, "application/pdf")
    good_res = client.post("/api/student/resume", files={"file": valid_file}, headers=student_h)
    assert good_res.status_code == 200
    assert "resume_url" in good_res.json()

    # 3. Download resume
    dl_res = client.get("/api/student/resume/download", headers=student_h)
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
