import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { archiveSurvey, deleteSurvey, listSurveys, publishSurvey } from '../api/surveys';
import type { SurveyListItem, SurveyStatus } from '../types/api';

const statusOptions: Array<{ value: SurveyStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'archived', label: 'Архив' }
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function SurveysPage() {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [status, setStatus] = useState<SurveyStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSurveys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listSurveys(status);
      setSurveys(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить опросы');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const handlePublish = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await publishSurvey(id);
      setMessage('Опрос опубликован. Публичная ссылка доступна в карточке опроса.');
      await loadSurveys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось опубликовать опрос');
    }
  };

  const handleArchive = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await archiveSurvey(id);
      setMessage('Опрос перенесен в архив.');
      await loadSurveys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось архивировать опрос');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Удалить опрос? Это действие нельзя отменить.');
    if (!confirmed) return;

    setError(null);
    setMessage(null);
    try {
      await deleteSurvey(id);
      setMessage('Опрос удален.');
      await loadSurveys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить опрос');
    }
  };

  const copyPublicLink = async (id: string) => {
    const link = `${window.location.origin}/public/surveys/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage('Публичная ссылка скопирована.');
    } catch {
      setMessage(link);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1>Мои опросы</h1>
          <p className="muted">Создавайте анкеты, публикуйте их и открывайте публичную форму для прохождения.</p>
        </div>
        <Link to="/surveys/new" className="button primary">Создать опрос</Link>
      </section>

      <section className="toolbar card">
        <label>
          Статус
          <select value={status} onChange={(event) => setStatus(event.target.value as SurveyStatus | 'all')}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="button" className="button secondary" onClick={loadSurveys}>Обновить</button>
      </section>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      {isLoading ? (
        <div className="card empty-state">Загружаем список опросов...</div>
      ) : surveys.length === 0 ? (
        <div className="card empty-state">
          <h2>Опросов пока нет</h2>
          <p className="muted">Создайте первый опрос, добавьте вопросы и опубликуйте его для респондентов.</p>
          <Link to="/surveys/new" className="button primary">Создать первый опрос</Link>
        </div>
      ) : (
        <div className="survey-grid">
          {surveys.map((survey) => (
            <article className="card survey-card" key={survey.id}>
              <div className="survey-card-top">
                <StatusBadge status={survey.status} />
                <span className="muted small-text">Обновлен: {formatDate(survey.updated_at)}</span>
              </div>
              <h2>{survey.title}</h2>
              <p className="survey-description">{survey.description || 'Описание не указано.'}</p>
              <div className="button-row wrap">
                <Link to={`/surveys/${survey.id}/edit`} className="button secondary">Редактировать</Link>
                <Link to={`/surveys/${survey.id}/responses`} className="button secondary">Ответы</Link>
                {survey.status === 'draft' && (
                  <button type="button" className="button primary" onClick={() => handlePublish(survey.id)}>Опубликовать</button>
                )}
                {survey.status === 'published' && (
                  <>
                    <Link to={`/public/surveys/${survey.id}`} className="button secondary">Открыть форму</Link>
                    <button type="button" className="button secondary" onClick={() => copyPublicLink(survey.id)}>Скопировать ссылку</button>
                    <button type="button" className="button ghost" onClick={() => handleArchive(survey.id)}>В архив</button>
                  </>
                )}
                {survey.status !== 'published' && (
                  <button type="button" className="button danger ghost" onClick={() => handleDelete(survey.id)}>Удалить</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
