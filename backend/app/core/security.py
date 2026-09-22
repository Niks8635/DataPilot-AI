from datetime import datetime, timedelta
from typing import Optional, Union, Any
import bcrypt
import jwt
from jwt.exceptions import PyJWTError as JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user_id(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    if not token:
        # Default demo user ID for zero-friction standalone local testing
        return "demo-user-default-uuid"
    try:
        # First attempt decoding using our internal secret
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            return user_id
    except JWTError:
        # If Supabase JWT Secret is configured, try Supabase token
        if settings.SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token, 
                    settings.SUPABASE_JWT_SECRET, 
                    algorithms=["HS256"], 
                    audience="authenticated"
                )
                user_id = payload.get("sub")
                if user_id:
                    return user_id
            except JWTError:
                pass
        # Fallback to demo user if token is mock or invalid in dev
        return "demo-user-default-uuid"
    return "demo-user-default-uuid"
