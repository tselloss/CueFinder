import { useEffect, useMemo, useState } from 'react';
import Clubs from './Clubs.jsx';
import BookingsDashboard from './bookings/BookingsDashboard.jsx';
import { useTranslation } from 'react-i18next';
import { getBookings } from '../api/bookingService.js';

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('clubs');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getBookings()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        const pending = list.filter((booking) => (booking.status || '').toLowerCase() === 'pending').length;
        setPendingCount(pending);
        if (pending > 0) {
          setActiveTab('bookings');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setPendingCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = useMemo(() => ([
    { key: 'clubs', label: t('owner.tabs.clubs') },
    { key: 'bookings', label: t('owner.tabs.bookings') }
  ]), [t]);

  return (
    <div className="dashboard-grid">
      <section className="card">
        <div className="section-header">
          <h1 className="section-title">{t('owner.title')}</h1>
        </div>
        <p className="muted">{t('owner.subtitle')}</p>
      </section>
      <div className="section-card">
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'bookings' && pendingCount > 0 && (
                <span className="tab-badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'clubs' && <Clubs />}
      {activeTab === 'bookings' && <BookingsDashboard />}
    </div>
  );
}
