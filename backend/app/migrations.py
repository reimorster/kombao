from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session


def apply_runtime_migrations(engine: Engine, db: Session) -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("users")}

    if "display_name" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR(120)"))
            connection.execute(text("UPDATE users SET display_name = username WHERE display_name IS NULL"))
            connection.execute(text("ALTER TABLE users ALTER COLUMN display_name SET NOT NULL"))

    db.execute(
        text(
            """
            UPDATE users
            SET display_name = username
            WHERE display_name IS NULL OR BTRIM(display_name) = ''
            """
        )
    )
    db.commit()
