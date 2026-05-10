from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.application.services.auth_service import AuthService
from app.infrastructure.db.models import User
from app.presentation.api.v1.deps import get_auth_service, get_current_user
from app.presentation.api.v1.schemas import LoginRequest, TokenResponse, UserRegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    return await auth_service.register(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    _, access_token = await auth_service.authenticate(email=payload.email, password=payload.password)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
