from uuid import UUID

from app.domain.enums import QuestionType, SurveyStatus
from app.domain.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.infrastructure.db.models import Question, QuestionOption, Survey, User
from app.infrastructure.repositories.survey_repository import SurveyRepository
from app.presentation.api.v1.schemas import QuestionCreate, SurveyCreateRequest, SurveyUpdateRequest


class SurveyService:
    def __init__(self, survey_repository: SurveyRepository) -> None:
        self.survey_repository = survey_repository

    async def create_survey(self, *, owner: User, payload: SurveyCreateRequest) -> Survey:
        self._validate_question_positions(payload.questions)
        survey = Survey(
            owner_id=owner.id,
            title=payload.title,
            description=payload.description,
            status=SurveyStatus.DRAFT,
            questions=self._build_questions(payload.questions),
        )
        return await self.survey_repository.create(survey)

    async def list_my_surveys(self, *, owner: User, status: SurveyStatus | None = None) -> list[Survey]:
        return await self.survey_repository.list_for_owner(owner.id, status=status)

    async def get_survey_for_owner(self, *, survey_id: UUID, owner: User) -> Survey:
        survey = await self.survey_repository.get_by_id(survey_id, with_questions=True)
        if not survey:
            raise NotFoundError("Survey not found")
        if survey.owner_id != owner.id:
            raise ForbiddenError("You cannot access this survey")
        return survey

    async def get_published_survey(self, *, survey_id: UUID) -> Survey:
        survey = await self.survey_repository.get_by_id(survey_id, with_questions=True)
        if not survey or survey.status != SurveyStatus.PUBLISHED:
            raise NotFoundError("Published survey not found")
        return survey

    async def update_survey(self, *, survey_id: UUID, owner: User, payload: SurveyUpdateRequest) -> Survey:
        survey = await self.get_survey_for_owner(survey_id=survey_id, owner=owner)
        if survey.status == SurveyStatus.ARCHIVED:
            raise ValidationError("Archived survey cannot be edited")

        update_data = payload.model_dump(exclude_unset=True, exclude={"questions"})
        for key, value in update_data.items():
            setattr(survey, key, value)

        if payload.questions is not None:
            self._validate_question_positions(payload.questions)
            new_questions = self._build_questions(payload.questions)
            if survey.status == SurveyStatus.PUBLISHED:
                self._validate_question_set(new_questions)
            await self.survey_repository.save(survey)
            return await self.survey_repository.replace_questions(survey, new_questions)

        if survey.status == SurveyStatus.PUBLISHED:
            self._validate_publishable(survey)

        return await self.survey_repository.save(survey)

    async def publish_survey(self, *, survey_id: UUID, owner: User) -> Survey:
        survey = await self.get_survey_for_owner(survey_id=survey_id, owner=owner)
        self._validate_publishable(survey)
        survey.status = SurveyStatus.PUBLISHED
        return await self.survey_repository.save(survey)

    async def archive_survey(self, *, survey_id: UUID, owner: User) -> Survey:
        survey = await self.get_survey_for_owner(survey_id=survey_id, owner=owner)
        survey.status = SurveyStatus.ARCHIVED
        return await self.survey_repository.save(survey)

    async def delete_survey(self, *, survey_id: UUID, owner: User) -> None:
        survey = await self.get_survey_for_owner(survey_id=survey_id, owner=owner)
        await self.survey_repository.delete(survey)

    def _build_questions(self, questions: list[QuestionCreate]) -> list[Question]:
        db_questions: list[Question] = []
        for question in questions:
            db_question = Question(
                text=question.text,
                type=question.type,
                is_required=question.is_required,
                position=question.position,
                options=[
                    QuestionOption(text=option.text, position=option.position)
                    for option in question.options
                ],
            )
            db_questions.append(db_question)
        return db_questions

    @staticmethod
    def _validate_question_positions(questions: list[QuestionCreate]) -> None:
        positions = [question.position for question in questions]
        if len(positions) != len(set(positions)):
            raise ValidationError("Question positions must be unique")
        for question in questions:
            option_positions = [option.position for option in question.options]
            if len(option_positions) != len(set(option_positions)):
                raise ValidationError("Option positions must be unique inside each question")

    @classmethod
    def _validate_publishable(cls, survey: Survey) -> None:
        cls._validate_question_set(survey.questions)

    @staticmethod
    def _validate_question_set(questions: list[Question]) -> None:
        if not questions:
            raise ValidationError("Survey must contain at least one question before publishing")
        for question in questions:
            if question.type in {QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE} and len(question.options) < 2:
                raise ValidationError("Choice questions require at least two options")
