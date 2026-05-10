from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.application.services.response_service import ResponseService
from app.application.services.survey_service import SurveyService
from app.domain.enums import SurveyStatus
from app.infrastructure.db.models import Survey, User
from app.presentation.api.v1.deps import get_current_user, get_response_service, get_survey_service
from app.presentation.api.v1.schemas import SubmittedResponseSchema, SurveyCreateRequest, SurveyListItem, SurveyResponseSchema, SurveyUpdateRequest

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("", response_model=SurveyResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_survey(
    payload: SurveyCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> Survey:
    return await survey_service.create_survey(owner=current_user, payload=payload)


@router.get("", response_model=list[SurveyListItem])
async def list_my_surveys(
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
    status_filter: SurveyStatus | None = Query(default=None, alias="status"),
) -> list[Survey]:
    return await survey_service.list_my_surveys(owner=current_user, status=status_filter)


@router.get("/{survey_id}", response_model=SurveyResponseSchema)
async def get_survey(
    survey_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> Survey:
    return await survey_service.get_survey_for_owner(survey_id=survey_id, owner=current_user)


@router.get("/{survey_id}/responses", response_model=list[SubmittedResponseSchema])
async def list_survey_responses(
    survey_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    response_service: Annotated[ResponseService, Depends(get_response_service)],
) -> list:
    return await response_service.list_responses_for_owner(survey_id=survey_id, owner=current_user)


@router.patch("/{survey_id}", response_model=SurveyResponseSchema)
async def update_survey(
    survey_id: UUID,
    payload: SurveyUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> Survey:
    return await survey_service.update_survey(survey_id=survey_id, owner=current_user, payload=payload)


@router.post("/{survey_id}/publish", response_model=SurveyResponseSchema)
async def publish_survey(
    survey_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> Survey:
    return await survey_service.publish_survey(survey_id=survey_id, owner=current_user)


@router.post("/{survey_id}/archive", response_model=SurveyResponseSchema)
async def archive_survey(
    survey_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> Survey:
    return await survey_service.archive_survey(survey_id=survey_id, owner=current_user)


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_survey(
    survey_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    survey_service: Annotated[SurveyService, Depends(get_survey_service)],
) -> None:
    await survey_service.delete_survey(survey_id=survey_id, owner=current_user)
