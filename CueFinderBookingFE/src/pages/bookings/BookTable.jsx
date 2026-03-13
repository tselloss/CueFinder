import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createBooking, getAvailability } from '../../api/bookingService';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTranslation } from 'react-i18next';

const toIso = (value) => (value ? value.toISOString() : null);
const parseOpeningHours = (value) => {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return null;
  return { start, end };
};

const EMPTY_FORM = {
  tableId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  date: '',
  startTime: '',
  duration: 1,
  notes: ''
};

export default function BookTable() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [openingHours, setOpeningHours] = useState('12:00-23:00');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [confirmed, setConfirmed] = useState(null); // { locationName, date, startTime, duration }

  useEffect(() => {
    const tableId = searchParams.get('tableId');
    const hours = searchParams.get('openingHours');
    const name = searchParams.get('locationName');
    const addressValue = searchParams.get('address');
    if (tableId) setForm((prev) => ({ ...prev, tableId }));
    if (hours) setOpeningHours(hours);
    if (name) setLocationName(name);
    if (addressValue) setAddress(addressValue);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.name || user.username || '',
      customerEmail: prev.customerEmail || user.email || '',
      customerPhone: prev.customerPhone || user.phone || ''
    }));
  }, [user]);

  useEffect(() => {
    if (!form.tableId || !form.date) return;
    const from = new Date(`${form.date}T00:00:00`);
    const to = new Date(`${form.date}T23:59:59`);
    getAvailability({
      tableId: form.tableId,
      from: from.toISOString(),
      to: to.toISOString()
    })
      .then((data) => setAvailability(Array.isArray(data) ? data : []))
      .catch(() => setAvailability([]));
  }, [form.tableId, form.date]);

  const timeOptions = useMemo(() => {
    if (!form.date) return [];
    const parsed = parseOpeningHours(openingHours);
    const open = parsed?.start ?? 12 * 60;
    const close = parsed?.end ?? 23 * 60;
    const options = [];
    for (let start = open; start + form.duration * 60 <= close; start += 60) {
      const hours = String(Math.floor(start / 60)).padStart(2, '0');
      const minutes = String(start % 60).padStart(2, '0');
      const value = `${hours}:${minutes}`;
      const startDate = new Date(`${form.date}T${value}:00`);
      const endDate = new Date(startDate.getTime() + form.duration * 60 * 60 * 1000);
      const disabled = availability.some((slot) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        return slotStart < endDate && slotEnd > startDate;
      });
      options.push({ value, disabled });
    }
    return options;
  }, [availability, form.date, form.duration]);

  const availableSlots = useMemo(() => timeOptions.filter((slot) => !slot.disabled), [timeOptions]);

  const handleSubmit = async () => {
    if (!form.tableId || !form.date || !form.startTime) {
      setError(t('book.requiredFields'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      const start = new Date(`${form.date}T${form.startTime}:00`);
      const end = new Date(start.getTime() + form.duration * 60 * 60 * 1000);
      await createBooking({
        tableId: form.tableId,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        startTime: toIso(start),
        endTime: toIso(end),
        notes: form.notes
      });
      setConfirmed({
        locationName: locationName || '',
        address: address || '',
        date: form.date,
        startTime: form.startTime,
        duration: form.duration
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err?.message || t('book.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <section className="card">
        <div className="booking-success">
          <div className="booking-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>{t('book.successTitle')}</h2>
          <p className="muted">{t('book.successSubtitle')}</p>

          <div className="booking-success-details">
            {confirmed.locationName && (
              <div className="detail-row">
                <span className="muted">{t('book.successLocation')}</span>
                <strong>{confirmed.locationName}{confirmed.address ? ` · ${confirmed.address}` : ''}</strong>
              </div>
            )}
            <div className="detail-row">
              <span className="muted">{t('book.successDate')}</span>
              <strong>{new Date(confirmed.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
            </div>
            <div className="detail-row">
              <span className="muted">{t('book.successTime')}</span>
              <strong>{confirmed.startTime}</strong>
            </div>
            <div className="detail-row">
              <span className="muted">{t('book.successDuration')}</span>
              <strong>{t('book.durationOption', { count: confirmed.duration })}</strong>
            </div>
            <div className="detail-row">
              <span className="muted">{t('bookings.statusLabel')}</span>
              <span className="status-pill status-pending">{t('status.pending')}</span>
            </div>
          </div>

          <div className="booking-success-actions">
            <Link to="/my-bookings">
              <button className="primary" style={{ marginTop: 0 }}>{t('book.viewMyBookings')}</button>
            </Link>
            <button className="secondary" onClick={() => setConfirmed(null)}>{t('book.bookAnother')}</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>{t('book.title')}</h1>
      <p className="muted">{t('book.subtitle')}</p>

      <div className="info-banner">
        <span className="info-banner-name">
          {locationName || t('clubs.locationFallback')}
        </span>
        <div className="info-banner-meta">
          {address && (
            <>
              <span>{address}</span>
              <span className="info-banner-sep">·</span>
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
              >
                {t('clubs.viewMap')}
              </a>
              <span className="info-banner-sep">·</span>
            </>
          )}
          <span>{t('clubs.openingLabel')}: {openingHours || '12:00-23:00'}</span>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-grid">
        <div className="form-section-label">Your details</div>
        <div className="form-group">
          <label className="form-label">{t('book.customerName')}</label>
          <input
            value={form.customerName}
            onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('book.customerEmail')}</label>
          <input
            type="email"
            value={form.customerEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('book.customerPhone')}</label>
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(event) => setForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
          />
        </div>
        <div className="form-section-label">When</div>
        <div className="form-group">
          <label className="form-label">{t('book.date')}</label>
          <input
            type="date"
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          />
        </div>
        <div className="slot-section">
          <div className="slot-header">
            <span className="muted">{t('book.duration')}</span>
            <div className="duration-toggle">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`secondary ${form.duration === value ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, duration: value }))}
                >
                  {t('book.durationOption', { count: value })}
                </button>
              ))}
            </div>
          </div>
          <div className="slot-header">
            <span className="muted">{t('book.availableTimes')}</span>
            <span className="muted">{availableSlots.length} {t('book.slots')}</span>
          </div>
          <div className="time-slots">
            {timeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                className={`time-slot ${option.disabled ? 'is-disabled' : 'is-available'} ${form.startTime === option.value ? 'is-selected' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, startTime: option.value }))}
              >
                <span className="slot-dot" />
                {option.value}
              </button>
            ))}
          </div>
          {form.date && timeOptions.length === 0 && (
            <p className="muted">{t('book.noSlots')}</p>
          )}
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">{t('book.notes')}</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </div>
        <button className="primary" style={{ gridColumn: '1 / -1', marginTop: 0 }} disabled={loading} onClick={handleSubmit}>
          {loading ? t('common.loading') : t('book.requestBooking')}
        </button>
      </div>
    </section>
  );
}
