import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { archiveSurvey, getSurvey, publishSurvey, updateSurvey } from '../api/surveys';
import { SurveyForm } from '../features/surveys/SurveyForm';
import type { Survey, SurveyCreateRequest } from '../types/api';

interface LocationState {
  message?: string;
}

export function EditSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialMessage = (location.state as LocationState | null)?.message || null;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [isLoading, setIsLoading] = useState(true);

  const loadSurvey = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const item = await getSurvey(id);
      setSurvey(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить опрос');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  const handleSubmit = async (payload: SurveyCreateRequest) => {
    if (!id) return;
    const updated = await updateSurvey(id, payload);
    setSurvey(updated);
    setMessage('Изменения сохранены.');
  };

  const handlePublish = async () => {
    if (!id) return;
    setError(null);
    setMessage(null);
    try {
      const updated = await publishSurvey(id);
      setSurvey(updated);
      setMessage('Опрос опубликован. Теперь его можно пройти по публичной ссылке.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось опубликовать опрос');
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    setError(null);
    setMessage(null);
    try {
      const updated = await archiveSurvey(id);
      setSurvey(updated);
      setMessage('Опрос архивирован.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось архивировать опрос');
    }
  };

  if (isLoading) {
    return <div className="card empty-state">Загружаем опрос...</div>;
  }

  if (error && !survey) {
    return (
      <div className="page-stack">
        <Alert type="error">{error}</Alert>
        <button type="button" className="button secondary" onClick={() => navigate('/surveys')}>Назад к списку</button>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <div className="inline-title">
            <h1>Редактирование опроса</h1>
            <StatusBadge status={survey.status} />
          </div>
          <p className="muted">ID: {survey.id}</p>
        </div>
        <div className="button-row wrap">
          <Link to="/surveys" className="button secondary">К списку</Link>
          <Link to={`/surveys/${survey.id}/responses`} className="button secondary">Ответы</Link>
          {survey.status === 'draft' && (
            <button type="button" className="button primary" onClick={handlePublish}>Опубликовать</button>
          )}
          {survey.status === 'published' && (
            <>
              <Link to={`/public/surveys/${survey.id}`} className="button secondary">Открыть форму</Link>
              <button type="button" className="button ghost" onClick={handleArchive}>В архив</button>
            </>
          )}
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      {survey.status === 'archived' && <Alert>Архивный опрос нельзя редактировать.</Alert>}

      <SurveyForm
        initialSurvey={survey}
        submitLabel="Сохранить изменения"
        onSubmit={handleSubmit}
        disabled={survey.status === 'archived'}
      />
    </div>
  );
}
