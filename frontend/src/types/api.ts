export type SurveyStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'text' | 'single_choice' | 'multiple_choice' | 'rating';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface QuestionOptionCreate {
  text: string;
  position: number;
}

export interface QuestionOption extends QuestionOptionCreate {
  id: string;
}

export interface QuestionCreate {
  text: string;
  type: QuestionType;
  is_required: boolean;
  position: number;
  options: QuestionOptionCreate[];
}

export interface Question extends Omit<QuestionCreate, 'options'> {
  id: string;
  options: QuestionOption[];
}

export interface SurveyCreateRequest {
  title: string;
  description?: string | null;
  questions: QuestionCreate[];
}

export interface SurveyUpdateRequest {
  title?: string;
  description?: string | null;
  status?: SurveyStatus;
  questions?: QuestionCreate[];
}

export interface SurveyListItem {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
}

export interface Survey extends SurveyListItem {
  questions: Question[];
}

export interface AnswerCreate {
  question_id: string;
  value: unknown;
}

export interface SubmitSurveyResponseRequest {
  answers: AnswerCreate[];
}

export interface ApiErrorPayload {
  detail?: string | { msg?: string }[];
}


export interface SubmittedAnswer {
  id: string;
  question_id: string;
  value: unknown;
}

export interface SubmittedSurveyResponse {
  id: string;
  survey_id: string;
  respondent_id: string | null;
  created_at: string;
  answers: SubmittedAnswer[];
}
