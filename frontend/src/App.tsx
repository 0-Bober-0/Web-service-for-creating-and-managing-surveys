import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AuthLayout } from './components/AuthLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CreateSurveyPage } from './pages/CreateSurveyPage';
import { EditSurveyPage } from './pages/EditSurveyPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PublicSurveyPage } from './pages/PublicSurveyPage';
import { RegisterPage } from './pages/RegisterPage';
import { SurveysPage } from './pages/SurveysPage';
import { SurveyResponsesPage } from './pages/SurveyResponsesPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/public/surveys/:id" element={<PublicSurveyPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/surveys" element={<SurveysPage />} />
          <Route path="/surveys/new" element={<CreateSurveyPage />} />
          <Route path="/surveys/:id/edit" element={<EditSurveyPage />} />
          <Route path="/surveys/:id/responses" element={<SurveyResponsesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
