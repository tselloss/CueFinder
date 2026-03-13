import { NavLink, useNavigate } from 'react-router-dom';
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
        <div className="header-brand">
          <div className="brand">BookBilliard</div>
          <a href={CUEFINDER_SITE_URL} className="brand-back-link">
            ← BilliardsCueFinder
          </a>
        </div>
        <nav className="nav-links">
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/clubs">{t('nav.clubs')}</NavLink>
          {user && <NavLink to="/find-buddy">{t('nav.findBuddy')}</NavLink>}
          {user && (isAdmin || isOwner) && <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink>}
          {user && (isAdmin || isOwner) && <NavLink to="/live-tables">{t('nav.liveTables')}</NavLink>}
          {isUser && <NavLink to="/my-bookings">{t('nav.myBookings')}</NavLink>}
          {!user && <NavLink to="/login">{t('nav.login')}</NavLink>}
          {user && (
            <button type="button" className="secondary nav-logout" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          )}
          <div className="lang-switch">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              aria-pressed={i18n.language === 'en'}
            >
              EN
            </button>
            <button
              type="button"
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
        <span className="footer-copy">© {new Date().getFullYear()} BookBilliard</span>
        <div className="footer-links">
          <a href={CUEFINDER_SITE_URL} target="_blank" rel="noreferrer">BilliardsCueFinder</a>
          <span className="footer-sep">·</span>
          <a href={`${CUEFINDER_SITE_URL}/terms-en.html`} target="_blank" rel="noreferrer">
            {t('auth.termsLink')}
          </a>
        </div>
      </footer>
    </div>
  );
}
