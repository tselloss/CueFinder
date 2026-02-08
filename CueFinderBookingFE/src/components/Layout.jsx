import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext.jsx';
import { CUEFINDER_SITE_URL } from '../config/siteConfig.js';

const OWNER_ROLES = ['club_owner', 'clubowner', 'club owner', 'owner'];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isOwner = OWNER_ROLES.includes(role);
  const isUser = !!user && !isAdmin && !isOwner;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLanguageChange = (lang) => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      localStorage.setItem('lang', lang);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">BookBilliard</div>
        <nav className="nav-links">
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/clubs">{t('nav.clubs')}</Link>
          {user && (isAdmin || isOwner) && <Link to="/dashboard">{t('nav.dashboard')}</Link>}
          {isUser && <Link to="/my-bookings">{t('nav.myBookings')}</Link>}
          {!user && <Link to="/login">{t('nav.login')}</Link>}
          {user && (
            <button type="button" className="secondary" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          )}
          <div className="lang-switch">
            <button
              type="button"
              className="secondary"
              onClick={() => handleLanguageChange('en')}
              aria-pressed={i18n.language === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => handleLanguageChange('gr')}
              aria-pressed={i18n.language === 'gr'}
            >
              ΕΛ
            </button>
          </div>
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <a href={`${CUEFINDER_SITE_URL}/terms-en.html`} target="_blank" rel="noreferrer">
          {t('auth.termsLink')}
        </a>
      </footer>
    </div>
  );
}
