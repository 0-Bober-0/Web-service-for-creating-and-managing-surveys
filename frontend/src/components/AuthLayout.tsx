import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link to="/" className="brand">Survey Service</Link>
        <h1>Веб-сервис для создания и управления опросами</h1>
        <p>Авторизация, управление анкетами, публикация и сбор ответов в одном интерфейсе.</p>
      </section>
      <section className="auth-card">
        <Outlet />
      </section>
    </main>
  );
}
