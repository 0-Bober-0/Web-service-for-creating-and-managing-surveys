from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.enums import SurveyStatus
from app.infrastructure.db.models import Question, QuestionOption, Survey


class SurveyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def with_graph():
        return selectinload(Survey.questions).selectinload(Question.options)

    async def create(self, survey: Survey) -> Survey:
        self.session.add(survey)
        await self.session.commit()
        return await self.get_by_id(survey.id, with_questions=True)  # type: ignore[return-value]

    async def get_by_id(self, survey_id: UUID, *, with_questions: bool = False) -> Survey | None:
        stmt = select(Survey).where(Survey.id == survey_id)
        if with_questions:
            stmt = stmt.options(self.with_graph())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_owner(self, owner_id: UUID, *, status: SurveyStatus | None = None) -> list[Survey]:
        stmt = select(Survey).where(Survey.owner_id == owner_id).order_by(Survey.created_at.desc())
        if status:
            stmt = stmt.where(Survey.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def replace_questions(self, survey: Survey, questions: list[Question]) -> Survey:
        await self.session.execute(delete(Question).where(Question.survey_id == survey.id))
        await self.session.flush()
        for question in questions:
            question.survey_id = survey.id
            self.session.add(question)
        await self.session.commit()
        return await self.get_by_id(survey.id, with_questions=True)  # type: ignore[return-value]

    async def save(self, survey: Survey) -> Survey:
        self.session.add(survey)
        await self.session.commit()
        return await self.get_by_id(survey.id, with_questions=True)  # type: ignore[return-value]

    async def delete(self, survey: Survey) -> None:
        await self.session.delete(survey)
        await self.session.commit()
