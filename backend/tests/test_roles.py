def test_role_based_access_control(client):
    # 1. Register Student
    client.post(
        "/api/auth/register",
        json={
            "email": "student_role@college.edu",
            "password": "Password123!",
            "role": "STUDENT",
            "full_name": "Student Role Test"
        }
    )
    student_token = client.post(
        "/api/auth/login",
        json={"email": "student_role@college.edu", "password": "Password123!"}
    ).json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 2. Register Company
    client.post(
        "/api/auth/register",
        json={
            "email": "company_role@acme.com",
            "password": "Password123!",
            "role": "COMPANY",
            "company_name": "Acme Role Test"
        }
    )
    company_token = client.post(
        "/api/auth/login",
        json={"email": "company_role@acme.com", "password": "Password123!"}
    ).json()["access_token"]
    company_headers = {"Authorization": f"Bearer {company_token}"}

    # 3. Register Admin
    client.post(
        "/api/auth/register",
        json={
            "email": "admin_role@college.edu",
            "password": "Password123!",
            "role": "ADMIN",
            "full_name": "Admin Role Test"
        }
    )
    admin_token = client.post(
        "/api/auth/login",
        json={"email": "admin_role@college.edu", "password": "Password123!"}
    ).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Test Student Access
    res_student_on_student = client.get("/api/dashboard/student", headers=student_headers)
    assert res_student_on_student.status_code == 200
    assert res_student_on_student.json()["module"] == "STUDENT_DASHBOARD"

    # Student cannot access Admin or Company dashboards
    res_student_on_admin = client.get("/api/dashboard/admin", headers=student_headers)
    assert res_student_on_admin.status_code == 403
    assert "Access denied" in res_student_on_admin.json()["detail"]

    res_student_on_company = client.get("/api/dashboard/company", headers=student_headers)
    assert res_student_on_company.status_code == 403

    # Test Company Access
    res_company_on_company = client.get("/api/dashboard/company", headers=company_headers)
    assert res_company_on_company.status_code == 200
    assert res_company_on_company.json()["module"] == "COMPANY_DASHBOARD"

    res_company_on_student = client.get("/api/dashboard/student", headers=company_headers)
    assert res_company_on_student.status_code == 403

    res_company_on_admin = client.get("/api/dashboard/admin", headers=company_headers)
    assert res_company_on_admin.status_code == 403

    # Test Admin Access
    res_admin_on_admin = client.get("/api/dashboard/admin", headers=admin_headers)
    assert res_admin_on_admin.status_code == 200
    assert res_admin_on_admin.json()["module"] == "ADMIN_DASHBOARD"

    # Test Unauthenticated access
    res_unauth = client.get("/api/dashboard/admin")
    assert res_unauth.status_code == 401

    # Test common summary access
    assert client.get("/api/dashboard/summary", headers=student_headers).status_code == 200
    assert client.get("/api/dashboard/summary", headers=company_headers).status_code == 200
    assert client.get("/api/dashboard/summary", headers=admin_headers).status_code == 200
