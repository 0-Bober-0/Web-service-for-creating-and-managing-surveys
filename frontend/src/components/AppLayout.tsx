import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/surveys" className="brand">Survey Service</Link>
        <nav className="nav-links">
          <NavLink to="/surveys">Опросы</NavLink>
          <NavLink to="/surveys/new">Создать опрос</NavLink>
        </nav>
        <div className="topbar-user">
          <span>{user?.full_name || user?.email}</span>
          <button type="button" className="button ghost" onClick={handleLogout}>Выйти</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
