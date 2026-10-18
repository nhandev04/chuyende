import logging
import hashlib
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.database import get_db
from app.db.models import User

logger = logging.getLogger(__name__)

# HTTP Bearer token extractor
security_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """
    Hashes a password using standard bcrypt.
    Truncates password to 72 bytes per bcrypt specification.
    """
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password. Supports standard bcrypt hashes ($2b$, $2a$),
    with graceful fallback to legacy SHA256 hashes for backward compatibility.
    """
    if not plain_password or not hashed_password:
        return False

    pw_bytes = plain_password.encode("utf-8")[:72]

    # Standard Bcrypt check
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))
        except Exception as e:
            logger.warning(f"Bcrypt verification error: {e}")
            return False

    # Fallback to legacy SHA256 salt for existing users (e.g. demo/admin accounts)
    legacy_hash = hashlib.sha256((plain_password + "salt_health_ai").encode("utf-8")).hexdigest()
    return legacy_hash == hashed_password


from datetime import datetime, timedelta, timezone

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to extract and validate the authenticated user from Bearer JWT.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims: missing subject identifier.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired or is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user account does not exist."
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optional user extractor: returns User if valid Bearer token provided, None otherwise.
    Never raises 401 if token is absent.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    FastAPI dependency enforcing Admin Role-Based Access Control (RBAC).
    Raises HTTP 403 if the user is not an administrator.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )
    return current_user


def verify_user_access(current_user: User, target_user_id: int) -> None:
    """
    Guards against IDOR (Insecure Direct Object References).
    Allows operation only if current_user is the target user OR has admin privileges.
    """
    if current_user.role != "admin" and current_user.id != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot access or modify another user's personal data."
        )
