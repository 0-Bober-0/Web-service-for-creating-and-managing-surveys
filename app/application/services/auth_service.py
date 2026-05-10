from uuid import UUID

from app.core.security import create_access_token, get_password_hash, verify_password
from app.domain.exceptions import ConflictError, UnauthorizedError
from app.infrastructure.db.models import User
from app.infrastructure.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def register(self, *, email: str, password: str, full_name: str | None) -> User:
        existing_user = await self.user_repository.get_by_email(email)
        if existing_user:
            raise ConflictError("User with this email already exists")
        return await self.user_repository.create(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
        )

    async def authenticate(self, *, email: str, password: str) -> tuple[User, str]:
        user = await self.user_repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("User is inactive")
        token = create_access_token(user.id)
        return user, token

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        return await self.user_repository.get_by_id(user_id)
