from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.db.models import SurveyResponse


class ResponseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, response: SurveyResponse) -> SurveyResponse:
        self.session.add(response)
        await self.session.commit()
        stmt = (
            select(SurveyResponse)
            .where(SurveyResponse.id == response.id)
            .options(selectinload(SurveyResponse.answers))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def list_for_survey(self, survey_id: UUID) -> list[SurveyResponse]:
        stmt = (
            select(SurveyResponse)
            .where(SurveyResponse.survey_id == survey_id)
            .options(selectinload(SurveyResponse.answers))
            .order_by(SurveyResponse.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
