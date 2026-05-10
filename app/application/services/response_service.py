from uuid import UUID

from app.domain.enums import QuestionType, SurveyStatus
from app.domain.exceptions import NotFoundError, ValidationError
from app.infrastructure.db.models import Answer, Survey, SurveyResponse, User
from app.infrastructure.repositories.response_repository import ResponseRepository
from app.infrastructure.repositories.survey_repository import SurveyRepository
from app.presentation.api.v1.schemas import AnswerCreate, SubmitSurveyResponseRequest


class ResponseService:
    def __init__(self, survey_repository: SurveyRepository, response_repository: ResponseRepository) -> None:
        self.survey_repository = survey_repository
        self.response_repository = response_repository

    async def list_responses_for_owner(self, *, survey_id: UUID, owner: User) -> list[SurveyResponse]:
        survey = await self.survey_repository.get_by_id(survey_id, with_questions=False)
        if not survey or survey.owner_id != owner.id:
            raise NotFoundError("Survey not found")
        return await self.response_repository.list_for_survey(survey_id)

    async def submit_response(
        self,
        *,
        survey_id: UUID,
        payload: SubmitSurveyResponseRequest,
        respondent: User | None,
    ) -> SurveyResponse:
        survey = await self.survey_repository.get_by_id(survey_id, with_questions=True)
        if not survey or survey.status != SurveyStatus.PUBLISHED:
            raise NotFoundError("Published survey not found")

        self._validate_answers(survey, payload.answers)
        response = SurveyResponse(
            survey_id=survey.id,
            respondent_id=respondent.id if respondent else None,
            answers=[Answer(question_id=answer.question_id, value=answer.value) for answer in payload.answers],
        )
        return await self.response_repository.create(response)

    @staticmethod
    def _validate_answers(survey: Survey, answers: list[AnswerCreate]) -> None:
        question_by_id = {question.id: question for question in survey.questions}
        answer_by_question_id = {answer.question_id: answer for answer in answers}

        if len(answer_by_question_id) != len(answers):
            raise ValidationError("Only one answer per question is allowed")

        unknown_question_ids = set(answer_by_question_id) - set(question_by_id)
        if unknown_question_ids:
            raise ValidationError("Answer contains question from another survey")

        missing_required = [
            question.id
            for question in survey.questions
            if question.is_required and question.id not in answer_by_question_id
        ]
        if missing_required:
            raise ValidationError("Required questions are missing")

        for question_id, answer in answer_by_question_id.items():
            question = question_by_id[question_id]
            value = answer.value

            if question.type == QuestionType.TEXT:
                if value is not None and not isinstance(value, str):
                    raise ValidationError("Text answer must be a string")

            if question.type == QuestionType.RATING:
                if not isinstance(value, int) or value < 1 or value > 5:
                    raise ValidationError("Rating answer must be an integer from 1 to 5")

            if question.type == QuestionType.SINGLE_CHOICE:
                allowed_option_ids = {str(option.id) for option in question.options}
                if not isinstance(value, str) or value not in allowed_option_ids:
                    raise ValidationError("Single choice answer must be an option id")

            if question.type == QuestionType.MULTIPLE_CHOICE:
                allowed_option_ids = {str(option.id) for option in question.options}
                if not isinstance(value, list) or not value or not all(isinstance(item, str) for item in value):
                    raise ValidationError("Multiple choice answer must be a non-empty list of option ids")
                if not set(value).issubset(allowed_option_ids):
                    raise ValidationError("Multiple choice answer contains unknown option id")
