from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    must_change_password: bool
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr | None = None
    role: str
    must_change_password: bool
    is_bootstrap_admin: bool
    created_at: datetime
    updated_at: datetime


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=255)
    new_password: str = Field(min_length=8, max_length=255)


class ProfileUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    current_password: str | None = Field(default=None, min_length=1, max_length=255)
    new_password: str | None = Field(default=None, min_length=8, max_length=255)


class CardBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(default="", max_length=5000)
    status: str = Field(default="do", pattern="^(do|doing|done)$")


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    status: str | None = Field(default=None, pattern="^(do|doing|done)$")
    namespace_id: int | None = None
    position: int | None = None


class CardResponse(CardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    namespace_id: int
    position: int
    created_at: datetime
    updated_at: datetime


class NamespaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class NamespaceCreate(NamespaceBase):
    pass


class NamespaceUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class NamespaceResponse(NamespaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    cards: list[CardResponse]
