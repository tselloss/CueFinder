import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import AuthPage from './pages/AuthPage.jsx';
import BookTable from './pages/bookings/BookTable.jsx';
import BookingsDashboard from './pages/bookings/BookingsDashboard.jsx';
import MyBookings from './pages/bookings/MyBookings.jsx';
import Clubs from './pages/Clubs.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import FindBuddy from './pages/FindBuddy.jsx';
import LiveTables from './pages/LiveTables.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import { useTranslation } from 'react-i18next';

const OWNER_ROLES = ['club_owner', 'clubowner', 'club owner', 'owner'];

export default function App() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isOwner = OWNER_ROLES.includes(role);
  const isUser = !!user && !isAdmin && !isOwner;

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  if (loading) {
    return (
      <Layout>
        <div className="card">{t('common.loading')}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/book" element={<BookTable />} />
        <Route path="/find-buddy" element={<FindBuddy />} />
        <Route
          path="/dashboard"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : isAdmin ? (
              <Clubs />
            ) : isOwner ? (
              <OwnerDashboard />
            ) : (
              <Navigate to="/my-bookings" replace />
            )
          }
        />
        <Route
          path="/my-bookings"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : isUser ? (
              <MyBookings />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/club-bookings"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : isAdmin || isOwner ? (
              <BookingsDashboard />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/live-tables"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : isAdmin || isOwner ? (
              <LiveTables />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
