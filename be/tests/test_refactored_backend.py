import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password, verify_password

client = TestClient(app)


def test_root_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["version"] == "2.0.0"


def test_bcrypt_hashing():
    pw = "SuperSecretPassword123!"
    hashed = hash_password(pw)
    assert hashed.startswith("$2b$")
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_login_and_token():
    # Login with demo user
    res = client.post("/api/v1/auth/login", json={
        "email": "demouser@uit.edu.vn",
        "password": "123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "demouser@uit.edu.vn"
    assert data["role"] == "user"


def test_admin_rbac_protection():
    # 1. Unauthenticated request to /admin/stats must fail with 401
    res = client.get("/api/v1/admin/stats")
    assert res.status_code == 401

    # 2. Regular user request to /admin/stats must fail with 403 Forbidden
    user_res = client.post("/api/v1/auth/login", json={
        "email": "demouser@uit.edu.vn",
        "password": "123456"
    })
    user_token = user_res.json()["access_token"]
    res_user = client.get("/api/v1/admin/stats", headers={
        "Authorization": f"Bearer {user_token}"
    })
    assert res_user.status_code == 403

    # 3. Admin user request to /admin/stats must succeed with 200 OK
    admin_res = client.post("/api/v1/auth/login", json={
        "email": "admin@uit.edu.vn",
        "password": "admin123"
    })
    admin_token = admin_res.json()["access_token"]
    res_admin = client.get("/api/v1/admin/stats", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res_admin.status_code == 200
    stats = res_admin.json()
    assert "total_users" in stats
    assert "total_food_items" in stats


def test_food_logs_idor_protection():
    # Log in as demo user
    user_res = client.post("/api/v1/auth/login", json={
        "email": "demouser@uit.edu.vn",
        "password": "123456"
    })
    user_data = user_res.json()
    user_id = user_data["user_id"]
    token = user_data["access_token"]

    # 1. Accessing own food logs succeeds
    own_res = client.get(f"/api/v1/food-logs/{user_id}", headers={
        "Authorization": f"Bearer {token}"
    })
    assert own_res.status_code == 200

    # 2. Attempting to access someone else's food logs (e.g. user_id = 999999) fails with 403 Forbidden
    other_res = client.get("/api/v1/food-logs/999999", headers={
        "Authorization": f"Bearer {token}"
    })
    assert other_res.status_code == 403
