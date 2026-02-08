import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export default function BookTable() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState({
    tableId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: '',
    startTime: '',
    duration: 1,
    notes: ''
  });
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [openingHours, setOpeningHours] = useState('12:00-23:00');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const tableId = searchParams.get('tableId');
    const hours = searchParams.get('openingHours');
    const name = searchParams.get('locationName');
    const addressValue = searchParams.get('address');
    if (tableId) {
      setForm((prev) => ({ ...prev, tableId }));
    }
    if (hours) {
      setOpeningHours(hours);
    }
    if (name) {
      setLocationName(name);
    }
    if (addressValue) {
      setAddress(addressValue);
    }
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
      setStatus({ message: t('book.requiredFields'), type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ message: '', type: '' });
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
      setStatus({ message: t('book.requestSent'), type: 'success' });
      setForm({
        tableId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        date: '',
        startTime: '',
        duration: 1,
        notes: ''
      });
    } catch (err) {
      setStatus({ message: err?.message || t('book.requestFailed'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h1>{t('book.title')}</h1>
      <p className="muted">{t('book.subtitle')}</p>

      {(locationName || address) && (
        <div className="muted" style={{ marginBottom: '12px' }}>
          <strong>{locationName || t('clubs.locationFallback')}</strong>
          {address ? ` · ${address}` : ''}
          {address && (
            <span className="muted"> · <a href={`https://www.google.com/maps?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">{t('clubs.viewMap')}</a></span>
          )}
        </div>
      )}

      <div className="muted" style={{ marginBottom: '12px' }}>
        {t('clubs.openingLabel')}: {openingHours || '12:00-23:00'}
      </div>

      {status.message && <p className={status.type === 'error' ? 'error' : 'muted'}>{status.message}</p>}

      <div className="form-grid">
        <input
          placeholder={t('book.tableId')}
          value={form.tableId}
          onChange={(event) => setForm((prev) => ({ ...prev, tableId: event.target.value }))}
          disabled
        />
        <input
          placeholder={t('book.customerName')}
          value={form.customerName}
          onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
        />
        <input
          placeholder={t('book.customerEmail')}
          value={form.customerEmail}
          onChange={(event) => setForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
        />
        <input
          placeholder={t('book.customerPhone')}
          value={form.customerPhone}
          onChange={(event) => setForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
        />
        <input
          type="date"
          value={form.date}
          onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
        />
        <div className="slot-section">
          <div className="slot-header">
            <span className="muted">{t('book.duration')}</span>
            <div className="duration-toggle">
              {[1, 2].map((value) => (
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
        <input
          placeholder={t('book.notes')}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
        <button className="primary" disabled={loading} onClick={handleSubmit}>
          {t('book.requestBooking')}
        </button>
      </div>
    </section>
  );
}
