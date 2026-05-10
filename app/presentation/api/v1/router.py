from fastapi import APIRouter

from app.presentation.api.v1.routes import auth, health, public, surveys

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(surveys.router)
api_router.include_router(public.router)
