import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert } from '../../components/Alert';
import type { QuestionType, Survey, SurveyCreateRequest } from '../../types/api';

type FormOption = {
  tempId: string;
  text: string;
};

type FormQuestion = {
  tempId: string;
  text: string;
  type: QuestionType;
  is_required: boolean;
  options: FormOption[];
};

interface SurveyFormProps {
  initialSurvey?: Survey | null;
  submitLabel: string;
  onSubmit: (payload: SurveyCreateRequest) => Promise<void>;
  disabled?: boolean;
}

const questionTypeLabels: Record<QuestionType, string> = {
  text: 'Текстовый ответ',
  single_choice: 'Один вариант',
  multiple_choice: 'Несколько вариантов',
  rating: 'Оценка 1–5'
};

function createTempId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function emptyQuestion(): FormQuestion {
  return {
    tempId: createTempId(),
    text: '',
    type: 'text',
    is_required: true,
    options: []
  };
}

function defaultChoiceOptions(): FormOption[] {
  return [
    { tempId: createTempId(), text: 'Вариант 1' },
    { tempId: createTempId(), text: 'Вариант 2' }
  ];
}

function isChoiceQuestion(type: QuestionType): boolean {
  return type === 'single_choice' || type === 'multiple_choice';
}

function buildQuestionsFromSurvey(survey?: Survey | null): FormQuestion[] {
  if (!survey?.questions?.length) return [emptyQuestion()];

  return [...survey.questions]
    .sort((a, b) => a.position - b.position)
    .map((question) => ({
      tempId: question.id,
      text: question.text,
      type: question.type,
      is_required: question.is_required,
      options: [...question.options]
        .sort((a, b) => a.position - b.position)
        .map((option) => ({ tempId: option.id, text: option.text }))
    }));
}

export function SurveyForm({ initialSurvey, submitLabel, onSubmit, disabled = false }: SurveyFormProps) {
  const [title, setTitle] = useState(initialSurvey?.title || '');
  const [description, setDescription] = useState(initialSurvey?.description || '');
  const [questions, setQuestions] = useState<FormQuestion[]>(() => buildQuestionsFromSurvey(initialSurvey));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSurvey) {
      setTitle(initialSurvey.title);
      setDescription(initialSurvey.description || '');
      setQuestions(buildQuestionsFromSurvey(initialSurvey));
    }
  }, [initialSurvey]);

  const questionCountText = useMemo(() => {
    const count = questions.length;
    if (count === 1) return '1 вопрос';
    if (count >= 2 && count <= 4) return `${count} вопроса`;
    return `${count} вопросов`;
  }, [questions.length]);

  const updateQuestion = (tempId: string, patch: Partial<FormQuestion>) => {
    setQuestions((current) => current.map((question) => {
      if (question.tempId !== tempId) return question;
      const nextType = patch.type || question.type;
      const typeWasChanged = patch.type && patch.type !== question.type;
      let nextOptions = patch.options ?? question.options;

      if (typeWasChanged && isChoiceQuestion(nextType) && nextOptions.length < 2) {
        nextOptions = defaultChoiceOptions();
      }
      if (typeWasChanged && !isChoiceQuestion(nextType)) {
        nextOptions = [];
      }

      return { ...question, ...patch, options: nextOptions };
    }));
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, emptyQuestion()]);
  };

  const removeQuestion = (tempId: string) => {
    setQuestions((current) => current.length === 1
      ? current
      : current.filter((question) => question.tempId !== tempId));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setQuestions((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  };

  const addOption = (questionId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.tempId !== questionId) return question;
      return {
        ...question,
        options: [...question.options, { tempId: createTempId(), text: `Вариант ${question.options.length + 1}` }]
      };
    }));
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.tempId !== questionId) return question;
      return {
        ...question,
        options: question.options.map((option) => option.tempId === optionId ? { ...option, text } : option)
      };
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.tempId !== questionId) return question;
      return { ...question, options: question.options.filter((option) => option.tempId !== optionId) };
    }));
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Введите название опроса.';
    if (!questions.length) return 'Добавьте хотя бы один вопрос.';

    for (const [index, question] of questions.entries()) {
      if (!question.text.trim()) return `Заполните текст вопроса №${index + 1}.`;
      if (isChoiceQuestion(question.type)) {
        const validOptions = question.options.filter((option) => option.text.trim());
        if (validOptions.length < 2) {
          return `Для вопроса №${index + 1} нужно минимум два непустых варианта ответа.`;
        }
      }
    }

    return null;
  };

  const buildPayload = (): SurveyCreateRequest => ({
    title: title.trim(),
    description: description.trim() || null,
    questions: questions.map((question, questionIndex) => ({
      text: question.text.trim(),
      type: question.type,
      is_required: question.is_required,
      position: questionIndex,
      options: isChoiceQuestion(question.type)
        ? question.options
          .filter((option) => option.text.trim())
          .map((option, optionIndex) => ({ text: option.text.trim(), position: optionIndex }))
        : []
    }))
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(buildPayload());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить опрос');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="survey-form" onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}

      <section className="card form-section">
        <div className="section-title">
          <div>
            <h2>Основная информация</h2>
            <p className="muted">Название и описание будут видны респондентам.</p>
          </div>
          <span className="counter-pill">{questionCountText}</span>
        </div>

        <div className="form grid-two">
          <label>
            Название опроса
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: Оценка качества обслуживания"
              disabled={disabled || isSubmitting}
              required
            />
          </label>
          <label>
            Описание
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Кратко объясните цель опроса"
              disabled={disabled || isSubmitting}
              rows={3}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-title">
          <div>
            <h2>Вопросы</h2>
            <p className="muted">Поддерживаются текстовые ответы, выбор вариантов и шкала оценки.</p>
          </div>
          <button type="button" className="button secondary" onClick={addQuestion} disabled={disabled || isSubmitting}>
            + Добавить вопрос
          </button>
        </div>

        <div className="question-list">
          {questions.map((question, index) => (
            <article className="card question-card" key={question.tempId}>
              <div className="question-card-header">
                <strong>Вопрос {index + 1}</strong>
                <div className="button-row compact">
                  <button type="button" className="button ghost" onClick={() => moveQuestion(index, -1)} disabled={disabled || isSubmitting || index === 0}>↑</button>
                  <button type="button" className="button ghost" onClick={() => moveQuestion(index, 1)} disabled={disabled || isSubmitting || index === questions.length - 1}>↓</button>
                  <button type="button" className="button danger ghost" onClick={() => removeQuestion(question.tempId)} disabled={disabled || isSubmitting || questions.length === 1}>Удалить</button>
                </div>
              </div>

              <div className="form grid-two">
                <label>
                  Текст вопроса
                  <input
                    value={question.text}
                    onChange={(event) => updateQuestion(question.tempId, { text: event.target.value })}
                    placeholder="Введите вопрос"
                    disabled={disabled || isSubmitting}
                  />
                </label>
                <label>
                  Тип вопроса
                  <select
                    value={question.type}
                    onChange={(event) => updateQuestion(question.tempId, { type: event.target.value as QuestionType })}
                    disabled={disabled || isSubmitting}
                  >
                    {Object.entries(questionTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={question.is_required}
                  onChange={(event) => updateQuestion(question.tempId, { is_required: event.target.checked })}
                  disabled={disabled || isSubmitting}
                />
                Обязательный вопрос
              </label>

              {isChoiceQuestion(question.type) && (
                <div className="options-block">
                  <div className="options-header">
                    <strong>Варианты ответа</strong>
                    <button type="button" className="button secondary small" onClick={() => addOption(question.tempId)} disabled={disabled || isSubmitting}>
                      + Вариант
                    </button>
                  </div>
                  {question.options.map((option, optionIndex) => (
                    <div className="option-row" key={option.tempId}>
                      <span>{optionIndex + 1}</span>
                      <input
                        value={option.text}
                        onChange={(event) => updateOption(question.tempId, option.tempId, event.target.value)}
                        placeholder="Текст варианта"
                        disabled={disabled || isSubmitting}
                      />
                      <button
                        type="button"
                        className="button danger ghost"
                        onClick={() => removeOption(question.tempId, option.tempId)}
                        disabled={disabled || isSubmitting || question.options.length <= 2}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <p className="muted field-hint">Респондент сможет выбрать целую оценку от 1 до 5.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="sticky-actions">
        <button type="submit" className="button primary" disabled={disabled || isSubmitting}>
          {isSubmitting ? 'Сохраняем...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
