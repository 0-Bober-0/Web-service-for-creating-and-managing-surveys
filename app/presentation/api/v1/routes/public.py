from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.application.services.response_service import ResponseService
from app.application.services.survey_service import SurveyService
from app.infrastructure.db.models import Survey, SurveyResponse, User
from app.presentation.api.v1.deps import get_optional_current_user, get_response_service, get_survey_service
from app.presentation.api.v1.schemas import SubmittedResponseSchema, SubmitSurveyResponseRequest, SurveyResponseSchema

router = APIRouter(prefix="/public/surveys", tags=["public surveys"])


@router.get("/{survey_id}", response_model=SurveyResponseSchema)
async def get_published_survey(
    survey_id: UUID,
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> Survey:
    return await survey_service.get_published_survey(survey_id=survey_id)


@router.post("/{survey_id}/responses", response_model=SubmittedResponseSchema, status_code=status.HTTP_201_CREATED)
async def submit_survey_response(
    survey_id: UUID,
    payload: SubmitSurveyResponseRequest,
    response_service: Annotated[ResponseService, Depends(get_response_service)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)],
) -> SurveyResponse:
    return await response_service.submit_response(
        survey_id=survey_id,
        payload=payload,
        respondent=current_user,
    )
