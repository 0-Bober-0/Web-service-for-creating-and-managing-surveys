import { request } from './http';
import type {
  SubmittedSurveyResponse,
  SubmitSurveyResponseRequest,
  Survey,
  SurveyCreateRequest,
  SurveyListItem,
  SurveyStatus,
  SurveyUpdateRequest
} from '../types/api';

export function listSurveys(status?: SurveyStatus | 'all'): Promise<SurveyListItem[]> {
  const suffix = status && status !== 'all' ? `?status=${status}` : '';
  return request<SurveyListItem[]>(`/surveys${suffix}`);
}

export function getSurvey(id: string): Promise<Survey> {
  return request<Survey>(`/surveys/${id}`);
}

export function createSurvey(payload: SurveyCreateRequest): Promise<Survey> {
  return request<Survey>('/surveys', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateSurvey(id: string, payload: SurveyUpdateRequest): Promise<Survey> {
  return request<Survey>(`/surveys/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function publishSurvey(id: string): Promise<Survey> {
  return request<Survey>(`/surveys/${id}/publish`, { method: 'POST' });
}

export function archiveSurvey(id: string): Promise<Survey> {
  return request<Survey>(`/surveys/${id}/archive`, { method: 'POST' });
}

export function deleteSurvey(id: string): Promise<void> {
  return request<void>(`/surveys/${id}`, { method: 'DELETE' });
}

export function getSurveyResponses(id: string): Promise<SubmittedSurveyResponse[]> {
  return request<SubmittedSurveyResponse[]>(`/surveys/${id}/responses`);
}

export function getPublicSurvey(id: string): Promise<Survey> {
  return request<Survey>(`/public/surveys/${id}`);
}

export function submitPublicSurvey(id: string, payload: SubmitSurveyResponseRequest): Promise<unknown> {
  return request<unknown>(`/public/surveys/${id}/responses`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
