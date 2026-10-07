from datetime import datetime, timezone, timedelta
from app.models.company import CompanyApprovalStatus


def get_tokens(client):
    """Helper to create admin, student, and company users and return their tokens."""
    # Admin
    client.post(
        "/api/auth/register",
        json={
            "email": "test_tpo_admin@campushire.edu",
            "password": "AdminPassword123!",
            "role": "ADMIN",
            "full_name": "TPO Head Officer"
        }
    )
    admin_token = client.post(
        "/api/auth/login",
        json={"email": "test_tpo_admin@campushire.edu", "password": "AdminPassword123!"}
    ).json()["access_token"]

    # Student
    client.post(
        "/api/auth/register",
        json={
            "email": "test_student@campushire.edu",
            "password": "StudentPassword123!",
            "role": "STUDENT",
            "full_name": "Test Student",
            "roll_number": "CS-001",
            "department": "Computer Science",
            "cgpa": 8.0
        }
    )
    student_token = client.post(
        "/api/auth/login",
        json={"email": "test_student@campushire.edu", "password": "StudentPassword123!"}
    ).json()["access_token"]

    # Company
    client.post(
        "/api/auth/register",
        json={
            "email": "test_recruiter@company.com",
            "password": "CompanyPassword123!",
            "role": "COMPANY",
            "company_name": "Alpha Tech Systems"
        }
    )
    company_token = client.post(
        "/api/auth/login",
        json={"email": "test_recruiter@company.com", "password": "CompanyPassword123!"}
    ).json()["access_token"]

    return (
        {"Authorization": f"Bearer {admin_token}"},
        {"Authorization": f"Bearer {student_token}"},
        {"Authorization": f"Bearer {company_token}"}
    )


def test_admin_authorization_and_unauthorized_access(client):
    admin_h, student_h, company_h = get_tokens(client)

    # 1. Unauthenticated request -> 401
    assert client.get("/api/admin/dashboard").status_code == 401
    assert client.get("/api/admin/companies").status_code == 401

    # 2. Student access -> 403 Forbidden
    res_student = client.get("/api/admin/dashboard", headers=student_h)
    assert res_student.status_code == 403
    assert "Access denied" in res_student.json()["detail"]

    # 3. Company access -> 403 Forbidden
    res_company = client.get("/api/admin/dashboard", headers=company_h)
    assert res_company.status_code == 403
    assert "Access denied" in res_company.json()["detail"]

    # 4. Admin access -> 200 OK
    res_admin = client.get("/api/admin/dashboard", headers=admin_h)
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "total_students" in data
    assert "total_companies" in data
    assert "active_jobs" in data
    assert "placement_rate_percentage" in data


def test_company_approval_and_rejection(client):
    admin_h, student_h, company_h = get_tokens(client)

    # List companies
    companies_res = client.get("/api/admin/companies", headers=admin_h)
    assert companies_res.status_code == 200
    companies = companies_res.json()
    assert len(companies) >= 1

    company_id = companies[0]["id"]
    assert companies[0]["approval_status"] == "PENDING"

    # Approve company
    approve_res = client.post(
        f"/api/admin/companies/{company_id}/approval",
        json={"status": "APPROVED"},
        headers=admin_h
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "APPROVED"

    # Verify approved state
    detail_res = client.get(f"/api/admin/companies/{company_id}", headers=admin_h)
    assert detail_res.status_code == 200
    assert detail_res.json()["approval_status"] == "APPROVED"
    assert detail_res.json()["approved_at"] is not None

    # Register another company and reject it
    client.post(
        "/api/auth/register",
        json={
            "email": "fake_recruiter@spam.com",
            "password": "Password123!",
            "role": "COMPANY",
            "company_name": "Spam Corp"
        }
    )
    all_companies = client.get("/api/admin/companies", headers=admin_h).json()
    spam_company = next(c for c in all_companies if c["company_name"] == "Spam Corp")

    reject_res = client.post(
        f"/api/admin/companies/{spam_company['id']}/approval",
        json={"status": "REJECTED", "rejection_reason": "Suspicious business profile"},
        headers=admin_h
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["approval_status"] == "REJECTED"
    assert reject_res.json()["rejection_reason"] == "Suspicious business profile"


def test_only_approved_companies_can_post_jobs(client):
    admin_h, student_h, company_h = get_tokens(client)

    # Register an unapproved company
    client.post(
        "/api/auth/register",
        json={
            "email": "pending_co@startup.com",
            "password": "Password123!",
            "role": "COMPANY",
            "company_name": "Pending Co"
        }
    )
    all_companies = client.get("/api/admin/companies", headers=admin_h).json()
    pending_co = next(c for c in all_companies if c["company_name"] == "Pending Co")

    # Attempt to create job for pending company -> Must fail with 400
    fail_res = client.post(
        "/api/admin/jobs",
        json={
            "company_id": pending_co["id"],
            "title": "Software Engineer",
            "salary_package": "10 LPA"
        },
        headers=admin_h
    )
    assert fail_res.status_code == 400
    assert "Only approved companies" in fail_res.json()["detail"]

    # Approve company
    client.post(
        f"/api/admin/companies/{pending_co['id']}/approval",
        json={"status": "APPROVED"},
        headers=admin_h
    )

    # Now create job -> Succeeds!
    success_res = client.post(
        "/api/admin/jobs",
        json={
            "company_id": pending_co["id"],
            "title": "Software Engineer",
            "salary_package": "10 LPA"
        },
        headers=admin_h
    )
    assert success_res.status_code == 201
    assert success_res.json()["title"] == "Software Engineer"


def test_student_verification(client):
    admin_h, student_h, company_h = get_tokens(client)

    students = client.get("/api/admin/students", headers=admin_h).json()
    assert len(students) >= 1
    student_id = students[0]["id"]
    assert students[0]["is_verified"] is False

    # Verify student
    verify_res = client.post(
        f"/api/admin/students/{student_id}/verification",
        json={"is_verified": True, "backlogs": 0, "cgpa": 8.75},
        headers=admin_h
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True
    assert verify_res.json()["cgpa"] == 8.75

    # Check student details
    s_detail = client.get(f"/api/admin/students/{student_id}", headers=admin_h).json()
    assert s_detail["is_verified"] is True
    assert s_detail["verified_at"] is not None

    # Unverify student
    unverify_res = client.post(
        f"/api/admin/students/{student_id}/verification",
        json={"is_verified": False, "backlogs": 1},
        headers=admin_h
    )
    assert unverify_res.status_code == 200
    assert unverify_res.json()["is_verified"] is False
    assert unverify_res.json()["backlogs"] == 1


def test_placement_drive_creation_and_eligibility_criteria(client):
    admin_h, student_h, company_h = get_tokens(client)

    # Approve company first
    companies = client.get("/api/admin/companies", headers=admin_h).json()
    company_id = companies[0]["id"]
    client.post(
        f"/api/admin/companies/{company_id}/approval",
        json={"status": "APPROVED"},
        headers=admin_h
    )

    drive_date = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()

    # Create drive with SQLite Eligibility Criteria
    create_drive_res = client.post(
        "/api/admin/drives",
        json={
            "company_id": company_id,
            "title": "Alpha Tech Placement Drive 2026",
            "description": "On-campus recruitment for SDE",
            "drive_date": drive_date,
            "venue": "Campus Convention Center",
            "selection_rounds": ["Aptitude Test", "Technical Interview", "HR Discussion"],
            "is_active": True,
            "eligibility": {
                "min_cgpa": 7.5,
                "max_backlogs": 0,
                "eligible_branches": ["Computer Science", "Information Technology"],
                "eligible_batch": 2026
            }
        },
        headers=admin_h
    )
    assert create_drive_res.status_code == 201
    drive_data = create_drive_res.json()
    assert drive_data["title"] == "Alpha Tech Placement Drive 2026"
    assert drive_data["venue"] == "Campus Convention Center"
    assert len(drive_data["selection_rounds"]) == 3

    # Verify Eligibility Criteria stored in SQLite
    elig = drive_data["eligibility_criteria"]
    assert elig is not None
    assert elig["min_cgpa"] == 7.5
    assert elig["max_backlogs"] == 0
    assert "Computer Science" in elig["eligible_branches"]
    assert elig["eligible_batch"] == 2026

    # Update drive
    drive_id = drive_data["id"]
    update_res = client.put(
        f"/api/admin/drives/{drive_id}",
        json={
            "venue": "Virtual Google Meet",
            "eligibility": {
                "min_cgpa": 8.0,
                "max_backlogs": 0,
                "eligible_branches": ["Computer Science"],
                "eligible_batch": 2026
            }
        },
        headers=admin_h
    )
    assert update_res.status_code == 200
    assert update_res.json()["venue"] == "Virtual Google Meet"
    assert update_res.json()["eligibility_criteria"]["min_cgpa"] == 8.0

    # Toggle drive status
    toggle_res = client.patch(f"/api/admin/drives/{drive_id}/toggle-status", headers=admin_h)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False


def test_notifications_reports_and_audit_logs(client):
    admin_h, student_h, company_h = get_tokens(client)

    # 1. Create notification
    note_res = client.post(
        "/api/admin/notifications",
        json={
            "title": "Drive Date Extended",
            "message": "The registration deadline has been extended to Friday.",
            "target_audience": "STUDENT"
        },
        headers=admin_h
    )
    assert note_res.status_code == 201
    assert note_res.json()["title"] == "Drive Date Extended"

    # Get notifications
    all_notes = client.get("/api/admin/notifications", headers=admin_h)
    assert all_notes.status_code == 200
    assert len(all_notes.json()) >= 1

    # 2. Get reports
    reports_res = client.get("/api/admin/reports", headers=admin_h)
    assert reports_res.status_code == 200
    reports = reports_res.json()
    assert "total_students" in reports
    assert "placed_students" in reports
    assert "company_wise_placements" in reports
    assert "branch_wise_placements" in reports
    assert "application_stats" in reports

    # 3. Get audit logs
    audit_res = client.get("/api/admin/audit-logs", headers=admin_h)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 1
    # Check that operations were logged
    actions = [l["action"] for l in logs]
    assert "CREATE_NOTIFICATION" in actions
