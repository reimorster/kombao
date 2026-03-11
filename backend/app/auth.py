from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import AuthSession, User, utc_now

security = HTTPBearer(auto_error=False)
PBKDF2_ITERATIONS = 120_000


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_bootstrap_credentials() -> tuple[str, str, str | None]:
    return (
        os.getenv("APP_USERNAME", "admin"),
        os.getenv("APP_PASSWORD", "admin"),
        os.getenv("APP_EMAIL") or None,
    )


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    algorithm, iterations, salt, expected_digest = password_hash.split("$", 3)
    if algorithm != "pbkdf2_sha256":
        raise HTTPException(status_code=500, detail="Algoritmo de senha invalido.")

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return hmac.compare_digest(digest, expected_digest)


def bootstrap_admin_if_needed(db: Session) -> None:
    user_count = db.scalar(select(func.count(User.id))) or 0
    if user_count > 0:
        return

    username, password, email = get_bootstrap_credentials()
    db.add(
        User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            must_change_password=True,
            is_bootstrap_admin=True,
        )
    )
    db.commit()


def issue_token(db: Session, username: str, password: str) -> tuple[str, User]:
    user = db.scalar(select(User).where(User.username == username))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas.",
        )

    token = secrets.token_urlsafe(32)
    db.add(AuthSession(token=token, user_id=user.id))
    db.commit()
    db.refresh(user)
    return token, user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacao obrigatoria.",
        )

    session = db.scalar(
        select(AuthSession).where(AuthSession.token == credentials.credentials)
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessao expirada. Faça login novamente.",
        )

    session.last_used_at = utc_now()
    db.commit()
    return session.user


def require_auth(user: User = Depends(get_current_user)) -> User:
    return user


def require_active_user(user: User = Depends(get_current_user)) -> User:
    if user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Troca de senha obrigatoria antes de continuar.",
        )
    return user


def update_user_password(user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    user.must_change_password = False
