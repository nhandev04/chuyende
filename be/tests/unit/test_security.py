import pytest
from fastapi import HTTPException
from app.db.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_user_access
)


def test_hash_and_verify_password():
    raw = "MyP@ssw0rd2026!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_verify_password_legacy_sha256():
    # Legacy SHA256 with salt_health_ai
    # For '123456', sha256("123456salt_health_ai") = "4ea193fba24564c7e614138e6e5dff252033bc883907c050a4980fc858b29c29"
    import hashlib
    legacy_hash = hashlib.sha256("123456salt_health_ai".encode("utf-8")).hexdigest()
    assert verify_password("123456", legacy_hash) is True
    assert verify_password("wrong", legacy_hash) is False


def test_verify_password_edge_cases():
    assert verify_password("", "somehash") is False
    assert verify_password("password", "") is False
    assert verify_password(None, None) is False


def test_create_access_token():
    from jose import jwt
    from app.core.config import SECRET_KEY, ALGORITHM

    token = create_access_token({"sub": "42", "role": "admin"})
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "42"
    assert decoded["role"] == "admin"
    assert "exp" in decoded


def test_verify_user_access_allowed_for_owner():
    owner = User(id=10, email="owner@uit.edu.vn", role="user")
    # Accessing own data should succeed without raising any exception
    verify_user_access(owner, target_user_id=10)


def test_verify_user_access_allowed_for_admin():
    admin = User(id=1, email="admin@uit.edu.vn", role="admin")
    # Admin can access target_user_id = 99
    verify_user_access(admin, target_user_id=99)


def test_verify_user_access_forbidden_for_other_user():
    user = User(id=10, email="user@uit.edu.vn", role="user")
    # Regular user attempting to access target_user_id = 99 must raise HTTP 403
    with pytest.raises(HTTPException) as exc_info:
        verify_user_access(user, target_user_id=99)
    assert exc_info.value.status_code == 403
    assert "cannot access or modify another user" in exc_info.value.detail.lower()
