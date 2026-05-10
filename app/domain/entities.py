from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.enums import QuestionType, SurveyStatus


@dataclass(frozen=True)
class UserEntity:
    id: UUID
    email: str
    full_name: str | None
    is_active: bool
    created_at: datetime


@dataclass(frozen=True)
class SurveyEntity:
    id: UUID
    owner_id: UUID
    title: str
    description: str | None
    status: SurveyStatus
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class QuestionEntity:
    id: UUID
    survey_id: UUID
    text: str
    type: QuestionType
    is_required: bool
    position: int
