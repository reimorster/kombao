from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .auth import (
    bootstrap_admin_if_needed,
    get_db,
    issue_token,
    require_active_user,
    require_auth,
    update_user_password,
    verify_password,
)
from .database import Base, engine
from .models import Card, Namespace, User
from .schemas import (
    CardCreate,
    CardResponse,
    CardUpdate,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    NamespaceCreate,
    NamespaceResponse,
    NamespaceUpdate,
    ProfileUpdateRequest,
    UserResponse,
)

STATUSES = ("do", "doing", "done")

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="Simple Kanban")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_namespace_positions(db: Session) -> None:
    namespaces = db.scalars(select(Namespace).order_by(Namespace.position, Namespace.id)).all()
    for index, namespace in enumerate(namespaces):
        namespace.position = index
    db.flush()


def normalize_card_positions(db: Session, namespace_id: int, status_name: str) -> None:
    cards = db.scalars(
        select(Card)
        .where(Card.namespace_id == namespace_id, Card.status == status_name)
        .order_by(Card.position, Card.id)
    ).all()
    for index, card in enumerate(cards):
        card.position = index
    db.flush()


def get_namespace_or_404(db: Session, namespace_id: int) -> Namespace:
    namespace = db.get(Namespace, namespace_id)
    if namespace is None:
        raise HTTPException(status_code=404, detail="Namespace nao encontrado.")
    return namespace


def get_card_or_404(db: Session, card_id: int) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card nao encontrado.")
    return card


def list_namespaces(db: Session) -> list[Namespace]:
    return db.scalars(
        select(Namespace)
        .options(selectinload(Namespace.cards))
        .order_by(Namespace.position, Namespace.id)
    ).all()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        bootstrap_admin_if_needed(db)
        existing = db.scalar(select(Namespace.id).limit(1))
        if existing is None:
            db.add(Namespace(name="Projeto 1", position=0))
            db.commit()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    bootstrap_admin_if_needed(db)
    token, user = issue_token(db, payload.username, payload.password)
    return LoginResponse(
        token=token,
        must_change_password=user.must_change_password,
        user=user,
    )


@app.get("/auth/me", response_model=UserResponse)
def get_current_session_user(
    user: User = Depends(require_auth),
) -> User:
    return user


@app.post("/auth/change-password", response_model=UserResponse)
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> User:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual invalida.")

    update_user_password(user, payload.new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.patch("/auth/me", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> User:
    if payload.username is None and payload.email is None and payload.new_password is None:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    if payload.username is not None:
        normalized_username = payload.username.strip()
        existing_username = db.scalar(
            select(User).where(User.username == normalized_username, User.id != user.id)
        )
        if existing_username is not None:
            raise HTTPException(status_code=409, detail="Nome de usuario ja esta em uso.")
        user.username = normalized_username

    if payload.email is not None:
        normalized_email = payload.email.strip() or None
        existing_email = None
        if normalized_email is not None:
            existing_email = db.scalar(
                select(User).where(User.email == normalized_email, User.id != user.id)
            )
        if existing_email is not None:
            raise HTTPException(status_code=409, detail="E-mail ja esta em uso.")
        user.email = normalized_email

    if payload.new_password is not None:
        if payload.current_password is None:
            raise HTTPException(status_code=400, detail="Senha atual obrigatoria para trocar a senha.")
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Senha atual invalida.")
        update_user_password(user, payload.new_password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/namespaces", response_model=list[NamespaceResponse])
def get_namespaces(
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> list[Namespace]:
    return list_namespaces(db)


@app.post("/namespaces", response_model=list[NamespaceResponse], status_code=status.HTTP_201_CREATED)
def create_namespace(
    payload: NamespaceCreate,
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> list[Namespace]:
    next_position = db.query(Namespace).count()
    db.add(Namespace(name=payload.name.strip(), position=next_position))
    db.commit()
    return list_namespaces(db)


@app.patch("/namespaces/{namespace_id}", response_model=list[NamespaceResponse])
def rename_namespace(
    namespace_id: int,
    payload: NamespaceUpdate,
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> list[Namespace]:
    namespace = get_namespace_or_404(db, namespace_id)
    namespace.name = payload.name.strip()
    db.commit()
    return list_namespaces(db)


@app.delete("/namespaces/{namespace_id}", response_model=list[NamespaceResponse])
def delete_namespace(
    namespace_id: int,
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> list[Namespace]:
    namespace = get_namespace_or_404(db, namespace_id)
    db.delete(namespace)
    db.flush()
    normalize_namespace_positions(db)
    db.commit()
    if db.query(Namespace).count() == 0:
        db.add(Namespace(name="Projeto 1", position=0))
        db.commit()
    return list_namespaces(db)


@app.post("/namespaces/{namespace_id}/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    namespace_id: int,
    payload: CardCreate,
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> Card:
    get_namespace_or_404(db, namespace_id)
    next_position = db.query(Card).filter(
        Card.namespace_id == namespace_id,
        Card.status == payload.status,
    ).count()
    card = Card(
        namespace_id=namespace_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        status=payload.status,
        position=next_position,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@app.patch("/cards/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    payload: CardUpdate,
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> Card:
    card = get_card_or_404(db, card_id)
    original_namespace_id = card.namespace_id
    original_status = card.status

    if payload.title is not None:
        card.title = payload.title.strip()
    if payload.description is not None:
        card.description = payload.description.strip()

    target_namespace_id = payload.namespace_id if payload.namespace_id is not None else card.namespace_id
    target_status = payload.status if payload.status is not None else card.status
    if target_status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status invalido.")
    get_namespace_or_404(db, target_namespace_id)

    moved = target_namespace_id != card.namespace_id or target_status != card.status
    if moved:
        card.namespace_id = target_namespace_id
        card.status = target_status

    if payload.position is not None:
        desired_position = max(payload.position, 0)
        siblings = db.scalars(
            select(Card)
            .where(Card.namespace_id == card.namespace_id, Card.status == card.status, Card.id != card.id)
            .order_by(Card.position, Card.id)
        ).all()
        siblings.insert(min(desired_position, len(siblings)), card)
        for index, sibling in enumerate(siblings):
            sibling.position = index
    elif moved:
        next_position = db.query(Card).filter(
            Card.namespace_id == card.namespace_id,
            Card.status == card.status,
            Card.id != card.id,
        ).count()
        card.position = next_position

    normalize_card_positions(db, original_namespace_id, original_status)
    normalize_card_positions(db, card.namespace_id, card.status)
    db.commit()
    db.refresh(card)
    return card


@app.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    _: User = Depends(require_active_user),
    db: Session = Depends(get_db),
) -> Response:
    card = get_card_or_404(db, card_id)
    namespace_id = card.namespace_id
    status_name = card.status
    db.delete(card)
    db.flush()
    normalize_card_positions(db, namespace_id, status_name)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
