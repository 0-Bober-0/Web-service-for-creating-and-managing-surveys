from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.auth_service import AuthService
from app.application.services.response_service import ResponseService
from app.application.services.survey_service import SurveyService
from app.core.security import decode_access_token
from app.domain.exceptions import UnauthorizedError
from app.infrastructure.db.models import User
from app.infrastructure.db.session import get_db_session
from app.infrastructure.repositories.response_repository import ResponseRepository
from app.infrastructure.repositories.survey_repository import SurveyRepository
from app.infrastructure.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_user_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserRepository:
    return UserRepository(session)


async def get_survey_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SurveyRepository:
    return SurveyRepository(session)


async def get_response_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ResponseRepository:
    return ResponseRepository(session)


async def get_auth_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> AuthService:
    return AuthService(user_repository)


async def get_survey_service(
    survey_repository: Annotated[SurveyRepository, Depends(get_survey_repository)],
) -> SurveyService:
    return SurveyService(survey_repository)


async def get_response_service(
    survey_repository: Annotated[SurveyRepository, Depends(get_survey_repository)],
    response_repository: Annotated[ResponseRepository, Depends(get_response_repository)],
) -> ResponseService:
    return ResponseService(survey_repository, response_repository)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    if not credentials:
        raise UnauthorizedError("Authorization header is missing")
    subject = decode_access_token(credentials.credentials)
    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token subject") from exc

    user = await auth_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("Could not validate credentials")
    return user


async def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User | None:
    if not credentials:
        return None
    return await get_current_user(credentials, auth_service)
