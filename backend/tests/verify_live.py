import urllib.request
import json

def test_servers():
    print("Testing Backend (http://127.0.0.1:8000)...")
    req = urllib.request.Request("http://127.0.0.1:8000/docs")
    with urllib.request.urlopen(req) as resp:
        print(f"Backend HTTP {resp.status} OK")

    print("\nTesting Frontend (http://127.0.0.1:5173)...")
    req = urllib.request.Request("http://127.0.0.1:5173/")
    with urllib.request.urlopen(req) as resp:
        print(f"Frontend HTTP {resp.status} OK")

    # Now test student login or registration flow
    login_data = json.dumps({"email": "student_live@test.com", "password": "Password@123"}).encode('utf-8')
    reg_data = json.dumps({
        "email": "student_live@test.com",
        "password": "Password@123",
        "role": "STUDENT",
        "full_name": "Rohan Deshmukh",
        "department": "Computer Science & Engineering",
        "roll_number": "22BCE9999",
        "graduation_year": 2026
    }).encode('utf-8')

    print("\nTesting Auth & Student API flow...")
    token = None
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/auth/register",
            data=reg_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Student registered successfully!")
    except Exception as e:
        print("Student already registered or registered earlier.")

    # Login to obtain JWT access token
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        token = data.get("access_token")
        print("Student logged in successfully! Token acquired.")

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Dashboard
    req = urllib.request.Request("http://127.0.0.1:8000/api/student/dashboard", headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Student Dashboard API:", data.get("verification_status"), f"Profile {data.get('profile_completion')}% complete")

    # 2. Profile
    req = urllib.request.Request("http://127.0.0.1:8000/api/student/profile", headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Student Profile API:", data.get("full_name"), data.get("department"))

    # 3. Update profile
    update_data = json.dumps({
        "full_name": "Rohan Deshmukh",
        "phone": "+91 9999988888",
        "roll_number": "22BCE9999",
        "department": "Computer Science & Engineering",
        "graduation_year": 2026,
        "cgpa": 8.75,
        "percentage": 85.0,
        "backlogs": 0,
        "skills": "Python, FastAPI, React, SQL",
        "projects": "Campus Placement Engine",
        "certifications": "Python Certified Specialist"
    }).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/student/profile",
        data=update_data,
        headers={**headers, "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Profile updated! CGPA={data.get('cgpa')}, Completion={data.get('profile_completion')}%")

    # 4. Jobs & Eligibility
    req = urllib.request.Request("http://127.0.0.1:8000/api/student/jobs", headers=headers)
    with urllib.request.urlopen(req) as resp:
        jobs = json.loads(resp.read().decode('utf-8'))
        print(f"Student Jobs API: Loaded {len(jobs)} active jobs evaluated by Eligibility Engine.")

    # 5. Applications
    req = urllib.request.Request("http://127.0.0.1:8000/api/student/applications", headers=headers)
    with urllib.request.urlopen(req) as resp:
        apps = json.loads(resp.read().decode('utf-8'))
        print(f"Student Applications API: Loaded {len(apps)} applications.")

    # 6. Notifications
    req = urllib.request.Request("http://127.0.0.1:8000/api/student/notifications", headers=headers)
    with urllib.request.urlopen(req) as resp:
        notifs = json.loads(resp.read().decode('utf-8'))
        print(f"Student Notifications API: Loaded {len(notifs)} alerts.")

    print("\nALL LIVE INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    test_servers()
