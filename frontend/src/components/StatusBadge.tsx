import type { SurveyStatus } from '../types/api';

const labelByStatus: Record<SurveyStatus, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив'
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return <span className={`status-badge status-${status}`}>{labelByStatus[status]}</span>;
}
