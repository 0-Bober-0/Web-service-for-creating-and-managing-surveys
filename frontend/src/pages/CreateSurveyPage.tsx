import { useNavigate } from 'react-router-dom';
import { createSurvey } from '../api/surveys';
import { SurveyForm } from '../features/surveys/SurveyForm';
import type { SurveyCreateRequest } from '../types/api';

export function CreateSurveyPage() {
  const navigate = useNavigate();

  const handleSubmit = async (payload: SurveyCreateRequest) => {
    const survey = await createSurvey(payload);
    navigate(`/surveys/${survey.id}/edit`, {
      replace: true,
      state: { message: 'Опрос создан.' }
    });
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1>Новый опрос</h1>
          <p className="muted">Соберите структуру анкеты. После сохранения опрос можно опубликовать.</p>
        </div>
      </section>
      <SurveyForm submitLabel="Создать опрос" onSubmit={handleSubmit} />
    </div>
  );
}
