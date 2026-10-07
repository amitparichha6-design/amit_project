from app.models.user import UserRole


def test_register_student(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "student@college.edu",
            "password": "Password123!",
            "role": "STUDENT",
            "full_name": "John Doe",
            "roll_number": "CS2026-001",
            "department": "Computer Science",
            "graduation_year": 2026,
            "cgpa": 8.75,
            "phone": "9876543210"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "student@college.edu"
    assert data["role"] == "STUDENT"
    assert data["student_profile"] is not None
    assert data["student_profile"]["full_name"] == "John Doe"
    assert data["student_profile"]["roll_number"] == "CS2026-001"


def test_register_company(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "hr@acmecorp.com",
            "password": "SecretCompany123!",
            "role": "COMPANY",
            "company_name": "Acme Technologies",
            "industry": "Information Technology",
            "website": "https://acme.example.com",
            "contact_person": "Jane Smith",
            "contact_email": "jane@acmecorp.com",
            "phone": "9998887776"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "hr@acmecorp.com"
    assert data["role"] == "COMPANY"
    assert data["company_profile"] is not None
    assert data["company_profile"]["company_name"] == "Acme Technologies"


def test_register_admin(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "admin@college.edu",
            "password": "SuperAdminPass123!",
            "role": "ADMIN",
            "full_name": "Dr. Placement Officer",
            "designation": "Head of Corporate Relations",
            "phone": "9123456789"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "admin@college.edu"
    assert data["role"] == "ADMIN"
    assert data["admin_profile"] is not None
    assert data["admin_profile"]["designation"] == "Head of Corporate Relations"


def test_duplicate_registration_fails(client):
    payload = {
        "email": "duplicate@college.edu",
        "password": "Password123!",
        "role": "STUDENT",
        "full_name": "Duplicate Student"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_login_success(client):
    # Register first
    client.post(
        "/api/auth/register",
        json={
            "email": "login_test@college.edu",
            "password": "CorrectPassword123!",
            "role": "STUDENT",
            "full_name": "Test User"
        }
    )

    # Login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "login_test@college.edu",
            "password": "CorrectPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login_test@college.edu"


def test_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "wrong_pwd@college.edu",
            "password": "CorrectPassword123!",
            "role": "STUDENT",
            "full_name": "Test User"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrong_pwd@college.edu",
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_current_user_me(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "me_user@college.edu",
            "password": "Password123!",
            "role": "STUDENT",
            "full_name": "Me User"
        }
    )
    login_res = client.post(
        "/api/auth/login",
        json={"email": "me_user@college.edu", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]

    # Test me with Bearer token
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me_user@college.edu"

    # Test me without token
    unauth_response = client.get("/api/auth/me")
    assert unauth_response.status_code == 401
