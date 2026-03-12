#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.auth import hash_password  # noqa: E402
from app.models import AuthSession, User, utc_now  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reseta a senha de um usuario administrador diretamente no PostgreSQL.",
    )
    parser.add_argument(
        "--username",
        default="admin",
        help="Usuario administrador a ser atualizado. Padrao: admin",
    )
    parser.add_argument(
        "--password",
        required=True,
        help="Nova senha em texto puro.",
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL") or "postgresql+psycopg://kanban:kanban@localhost:5432/kanban",
        help="URL de conexao com o PostgreSQL.",
    )
    parser.add_argument(
        "--must-change-password",
        action="store_true",
        help="Marca o usuario para trocar a senha no proximo login.",
    )
    parser.add_argument(
        "--keep-sessions",
        action="store_true",
        help="Mantem sessoes ativas. Por padrao, todas as sessoes do usuario sao invalidadas.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    engine = create_engine(args.database_url)

    with Session(engine) as db:
        user = db.scalar(select(User).where(User.username == args.username, User.role == "admin"))
        if user is None:
            print(f'Administrador "{args.username}" nao encontrado.', file=sys.stderr)
            return 1

        user.password_hash = hash_password(args.password)
        user.must_change_password = args.must_change_password
        user.updated_at = utc_now()

        if not args.keep_sessions:
            sessions = db.scalars(select(AuthSession).where(AuthSession.user_id == user.id)).all()
            for session in sessions:
                db.delete(session)

        db.add(user)
        db.commit()

    print(f'Senha do administrador "{args.username}" atualizada com sucesso.')
    if not args.keep_sessions:
        print("Sessoes existentes foram invalidadas.")
    if args.must_change_password:
        print("O usuario devera trocar a senha no proximo login.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
