from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.domain.enums import QuestionType, SurveyStatus


class ErrorResponse(BaseModel):
    detail: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str | None
    is_active: bool
    created_at: datetime


class QuestionOptionCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    position: int = Field(ge=0)


class QuestionOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    text: str
    position: int


class QuestionCreate(BaseModel):
    text: str = Field(min_length=1)
    type: QuestionType
    is_required: bool = True
    position: int = Field(ge=0)
    options: list[QuestionOptionCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_options(self) -> "QuestionCreate":
        if self.type in {QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE} and len(self.options) < 2:
            raise ValueError("Choice questions require at least two options")
        if self.type in {QuestionType.TEXT, QuestionType.RATING} and self.options:
            raise ValueError("Text and rating questions must not contain options")
        return self


class QuestionUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    type: QuestionType | None = None
    is_required: bool | None = None
    position: int | None = Field(default=None, ge=0)
    options: list[QuestionOptionCreate] | None = None


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    text: str
    type: QuestionType
    is_required: bool
    position: int
    options: list[QuestionOptionResponse] = []


class SurveyCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    questions: list[QuestionCreate] = Field(default_factory=list)


class SurveyUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: SurveyStatus | None = None
    questions: list[QuestionCreate] | None = None


class SurveyResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    title: str
    description: str | None
    status: SurveyStatus
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionResponse] = []


class SurveyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    title: str
    description: str | None
    status: SurveyStatus
    created_at: datetime
    updated_at: datetime


class AnswerCreate(BaseModel):
    question_id: UUID
    value: Any = None


class SubmitSurveyResponseRequest(BaseModel):
    answers: list[AnswerCreate] = Field(min_length=1)


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: UUID
    value: Any


class SubmittedResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    survey_id: UUID
    respondent_id: UUID | None
    created_at: datetime
    answers: list[AnswerResponse] = []
