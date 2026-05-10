import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { getPublicSurvey, submitPublicSurvey } from '../api/surveys';
import type { AnswerCreate, Question, Survey } from '../types/api';

type AnswerMap = Record<string, string | string[] | number | undefined>;

function sortedQuestions(survey: Survey): Question[] {
  return [...survey.questions].sort((a, b) => a.position - b.position);
}

function isEmptyValue(value: string | string[] | number | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function PublicSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useMemo(() => survey ? sortedQuestions(survey) : [], [survey]);

  const loadSurvey = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const item = await getPublicSurvey(id);
      setSurvey(item);
      const initialAnswers: AnswerMap = {};
      item.questions.forEach((question) => {
        if (question.type === 'rating') initialAnswers[question.id] = 5;
        if (question.type === 'multiple_choice') initialAnswers[question.id] = [];
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить опрос');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  const setAnswer = (questionId: string, value: string | string[] | number | undefined) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const toggleMultiAnswer = (questionId: string, optionId: string) => {
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] as string[] : [];
      const next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId];
      return { ...current, [questionId]: next };
    });
  };

  const validate = (): string | null => {
    for (const question of questions) {
      const value = answers[question.id];
      if (question.is_required && isEmptyValue(value)) {
        return `Ответьте на обязательный вопрос: «${question.text}».`;
      }
    }
    return null;
  };

  const buildPayload = (): AnswerCreate[] => {
    return questions.reduce<AnswerCreate[]>((acc, question) => {
      const value = answers[question.id];
      if (isEmptyValue(value)) return acc;

      if (question.type === 'rating') {
        acc.push({ question_id: question.id, value: Number(value) });
        return acc;
      }

      acc.push({ question_id: question.id, value });
      return acc;
    }, []);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    setError(null);
    setMessage(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPublicSurvey(id, { answers: buildPayload() });
      setMessage('Ответы отправлены. Спасибо за участие!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить ответы');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="public-page"><div className="card empty-state">Загружаем опрос...</div></div>;
  }

  if (error && !survey) {
    return (
      <div className="public-page">
        <div className="public-shell card">
          <h1>Опрос недоступен</h1>
          <Alert type="error">{error}</Alert>
          <Link to="/login" className="button secondary">Войти в систему</Link>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="public-page">
      <form className="public-shell" onSubmit={handleSubmit}>
        <section className="card public-header">
          <span className="brand compact-brand">Survey Service</span>
          <h1>{survey.title}</h1>
          {survey.description && <p className="muted">{survey.description}</p>}
        </section>

        {error && <Alert type="error">{error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}

        <div className="question-list">
          {questions.map((question, index) => (
            <article className="card question-card" key={question.id}>
              <div className="question-title-row">
                <h2>{index + 1}. {question.text}</h2>
                {question.is_required && <span className="required-mark">Обязательно</span>}
              </div>

              {question.type === 'text' && (
                <textarea
                  rows={4}
                  value={(answers[question.id] as string | undefined) || ''}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  placeholder="Введите ответ"
                  disabled={isSubmitting || Boolean(message)}
                />
              )}

              {question.type === 'single_choice' && (
                <div className="answer-options">
                  {[...question.options].sort((a, b) => a.position - b.position).map((option) => (
                    <label className="answer-option" key={option.id}>
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === option.id}
                        onChange={() => setAnswer(question.id, option.id)}
                        disabled={isSubmitting || Boolean(message)}
                      />
                      {option.text}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'multiple_choice' && (
                <div className="answer-options">
                  {[...question.options].sort((a, b) => a.position - b.position).map((option) => {
                    const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
                    return (
                      <label className="answer-option" key={option.id}>
                        <input
                          type="checkbox"
                          checked={selected.includes(option.id)}
                          onChange={() => toggleMultiAnswer(question.id, option.id)}
                          disabled={isSubmitting || Boolean(message)}
                        />
                        {option.text}
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === 'rating' && (
                <div className="rating-row">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label className="rating-item" key={value}>
                      <input
                        type="radio"
                        name={question.id}
                        checked={Number(answers[question.id]) === value}
                        onChange={() => setAnswer(question.id, value)}
                        disabled={isSubmitting || Boolean(message)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="sticky-actions public-actions">
          <button type="submit" className="button primary" disabled={isSubmitting || Boolean(message)}>
            {isSubmitting ? 'Отправляем...' : 'Отправить ответы'}
          </button>
        </div>
      </form>
    </div>
  );
}
