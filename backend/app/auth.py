import os
import secrets
from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import SessionLocal

security = HTTPBearer(auto_error=False)
active_tokens: dict[str, str] = {}


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_expected_credentials() -> tuple[str, str]:
    return (
        os.getenv("APP_USERNAME", "admin"),
        os.getenv("APP_PASSWORD", "admin"),
    )


def issue_token(username: str, password: str) -> str:
    expected_username, expected_password = get_expected_credentials()
    if username != expected_username or password != expected_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas.",
        )

    token = secrets.token_urlsafe(32)
    active_tokens[token] = username
    return token


def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacao obrigatoria.",
        )

    token = credentials.credentials
    username = active_tokens.get(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessao expirada. Faça login novamente.",
        )

    return username
