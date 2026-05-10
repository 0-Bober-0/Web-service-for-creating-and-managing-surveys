import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { useAuth } from '../features/auth/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email.trim(), password, fullName.trim() || undefined);
      navigate('/surveys', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Регистрация</h2>
      <p className="muted">Создайте аккаунт, чтобы управлять собственными опросами.</p>

      {error && <Alert type="error">{error}</Alert>}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Имя
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Иван Иванов"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 8 символов"
            required
          />
        </label>
        <button type="submit" className="button primary full" disabled={isSubmitting}>
          {isSubmitting ? 'Создаем...' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="auth-switch">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
