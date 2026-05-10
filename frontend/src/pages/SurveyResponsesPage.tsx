import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { getSurvey, getSurveyResponses } from '../api/surveys';
import type { Question, SubmittedAnswer, SubmittedSurveyResponse, Survey } from '../types/api';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function sortedQuestions(survey: Survey): Question[] {
  return [...survey.questions].sort((a, b) => a.position - b.position);
}

function formatAnswer(question: Question, answer?: SubmittedAnswer): string {
  if (!answer || answer.value === null || answer.value === undefined) return '—';

  if (question.type === 'text') {
    return String(answer.value).trim() || '—';
  }

  if (question.type === 'rating') {
    return `${answer.value} из 5`;
  }

  if (question.type === 'single_choice') {
    const selected = question.options.find((option) => option.id === String(answer.value));
    return selected?.text || 'Неизвестный вариант';
  }

  if (question.type === 'multiple_choice') {
    if (!Array.isArray(answer.value)) return '—';
    const selectedTexts = answer.value
      .map((optionId) => question.options.find((option) => option.id === String(optionId))?.text)
      .filter(Boolean);
    return selectedTexts.length > 0 ? selectedTexts.join(', ') : '—';
  }

  return String(answer.value);
}

export function SurveyResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SubmittedSurveyResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const questions = useMemo(() => survey ? sortedQuestions(survey) : [], [survey]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [surveyData, responseItems] = await Promise.all([
        getSurvey(id),
        getSurveyResponses(id)
      ]);
      setSurvey(surveyData);
      setResponses(responseItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить ответы');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <div className="card empty-state">Загружаем ответы...</div>;
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
            <h1>Ответы на опрос</h1>
            <StatusBadge status={survey.status} />
          </div>
          <p className="muted">{survey.title}</p>
        </div>
        <div className="button-row wrap">
          <button type="button" className="button secondary" onClick={loadData}>Обновить</button>
          <Link to={`/surveys/${survey.id}/edit`} className="button secondary">К опросу</Link>
          <Link to="/surveys" className="button ghost">К списку</Link>
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      <section className="card response-summary">
        <div>
          <span className="muted small-text">Всего отправленных анкет</span>
          <strong>{responses.length}</strong>
        </div>
        <div>
          <span className="muted small-text">Вопросов в анкете</span>
          <strong>{questions.length}</strong>
        </div>
      </section>

      {responses.length === 0 ? (
        <div className="card empty-state">
          <h2>Ответов пока нет</h2>
          <p className="muted">Скопируйте публичную ссылку на опубликованный опрос и отправьте ее респондентам.</p>
          {survey.status === 'published' && (
            <Link to={`/public/surveys/${survey.id}`} className="button primary">Открыть публичную форму</Link>
          )}
        </div>
      ) : (
        <div className="responses-list">
          {responses.map((response, index) => {
            const answersByQuestionId = new Map(response.answers.map((answer) => [answer.question_id, answer]));
            return (
              <article className="card response-card" key={response.id}>
                <div className="response-card-header">
                  <div>
                    <h2>Анкета #{responses.length - index}</h2>
                    <p className="muted small-text">Отправлена: {formatDate(response.created_at)}</p>
                  </div>
                  <span className="muted small-text">ID: {response.id}</span>
                </div>

                <div className="answers-table">
                  {questions.map((question) => (
                    <div className="answer-row" key={question.id}>
                      <div>
                        <strong>{question.text}</strong>
                        <span className="muted small-text">{question.type}</span>
                      </div>
                      <p>{formatAnswer(question, answersByQuestionId.get(question.id))}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
