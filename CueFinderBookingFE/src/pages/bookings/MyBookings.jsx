import { useEffect, useMemo, useState } from 'react';
import { cancelMyBooking, getMyBookings, updateMyBooking } from '../../api/bookingService';
import { useTranslation } from 'react-i18next';

const toIso = (value) => (value ? new Date(value).toISOString() : null);
const toInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function MyBookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState({});
  const [editingId, setEditingId] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState('');

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || t('bookings.error.load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const formatted = useMemo(() => bookings.map((booking) => ({
    ...booking,
    startLabel: new Date(booking.startTime).toLocaleString(),
    endLabel: new Date(booking.endTime).toLocaleString()
  })), [bookings]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return formatted
      .filter((b) => {
        const s = (b.status || '').toLowerCase();
        return s !== 'completed' && s !== 'cancelled' && new Date(b.endTime) >= now;
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [formatted]);

  const pastBookings = useMemo(() => {
    const now = new Date();
    return formatted
      .filter((b) => {
        const s = (b.status || '').toLowerCase();
        return s === 'completed' || s === 'cancelled' || new Date(b.endTime) < now;
      })
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [formatted]);

  const handleEditStart = (booking) => {
    setEditingId(booking.id);
    setCancelConfirmId('');
    setEdits((prev) => ({
      ...prev,
      [booking.id]: {
        startTime: toInputValue(booking.startTime),
        endTime: toInputValue(booking.endTime),
        notes: booking.notes || ''
      }
    }));
  };

  const handleEditCancel = () => setEditingId('');

  const handleEditChange = (bookingId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], [field]: value }
    }));
  };

  const handleUpdate = async (bookingId) => {
    const edit = edits[bookingId];
    if (!edit) return;
    try {
      setLoading(true);
      setError('');
      await updateMyBooking(bookingId, {
        startTime: toIso(edit.startTime),
        endTime: toIso(edit.endTime),
        notes: edit.notes
      });
      setEditingId('');
      await loadBookings();
    } catch (err) {
      setError(err?.message || t('bookings.error.update'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      setLoading(true);
      setError('');
      await cancelMyBooking(bookingId);
      setCancelConfirmId('');
      await loadBookings();
    } catch (err) {
      setError(err?.message || t('myBookings.cancelError'));
    } finally {
      setLoading(false);
    }
  };

  const renderBooking = (booking) => {
    const status = (booking.status || '').toLowerCase();
    const canEdit = status !== 'completed' && status !== 'cancelled';
    const canCancel = status === 'pending' || status === 'confirmed';

    return (
      <div key={booking.id} className="list-item">
        <div className="list-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong style={{ color: '#f1f5f9' }}>{booking.locationName || t('bookings.locationFallback')} · {booking.tableName || t('bookings.tableFallback')}</strong>
            <span className={`status-pill status-${status}`}>
              {t(`status.${booking.status}`, { defaultValue: booking.status })}
            </span>
          </div>
          <div className="booking-time-range">{booking.startLabel} → {booking.endLabel}</div>
          {editingId === booking.id && (
            <p className="muted edit-note">{t('myBookings.editNote')}</p>
          )}
        </div>

        <div className="list-actions">
          {!canEdit && (
            <span className="muted">{t('myBookings.editDisabled')}</span>
          )}

          {canEdit && editingId !== booking.id && cancelConfirmId !== booking.id && (
            <div className="btn-row">
              <button className="secondary" disabled={loading} onClick={() => handleEditStart(booking)}>
                {t('common.edit')}
              </button>
              {canCancel && (
                <button className="quick-reject" disabled={loading} onClick={() => setCancelConfirmId(booking.id)}>
                  {t('myBookings.cancelBooking')}
                </button>
              )}
            </div>
          )}

          {cancelConfirmId === booking.id && (
            <div className="confirm-inline">
              <span className="muted" style={{ fontSize: '0.9rem' }}>{t('myBookings.cancelConfirm')}</span>
              <button className="danger" disabled={loading} onClick={() => handleCancel(booking.id)}>
                {t('myBookings.cancelConfirmYes')}
              </button>
              <button className="secondary" disabled={loading} onClick={() => setCancelConfirmId('')}>
                {t('common.cancel')}
              </button>
            </div>
          )}

          {editingId === booking.id && (
            <div className="edit-grid">
              <input
                type="datetime-local"
                value={edits[booking.id]?.startTime || ''}
                onChange={(event) => handleEditChange(booking.id, 'startTime', event.target.value)}
              />
              <input
                type="datetime-local"
                value={edits[booking.id]?.endTime || ''}
                onChange={(event) => handleEditChange(booking.id, 'endTime', event.target.value)}
              />
              <input
                placeholder={t('book.notes')}
                value={edits[booking.id]?.notes || ''}
                onChange={(event) => handleEditChange(booking.id, 'notes', event.target.value)}
              />
              <div className="btn-row">
                <button className="secondary" disabled={loading} onClick={() => handleUpdate(booking.id)}>
                  {t('common.update')}
                </button>
                <button className="danger" disabled={loading} onClick={handleEditCancel}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="card">
      <div className="section-header">
        <h1 className="section-title">{t('myBookings.title')}</h1>
        <span className="muted">{formatted.length}</span>
      </div>
      <p className="muted">{t('myBookings.subtitle')}</p>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">{t('common.loading')}</p>}

      {formatted.length === 0 && !loading && (
        <div className="section-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="muted" style={{ margin: 0 }}>{t('myBookings.noBookings')}</p>
        </div>
      )}

      {upcomingBookings.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">{t('myBookings.upcomingTitle')}</h2>
            <span className="muted">{upcomingBookings.length}</span>
          </div>
          <div className="list">
            {upcomingBookings.map(renderBooking)}
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">{t('myBookings.pastTitle')}</h2>
            <span className="muted">{pastBookings.length}</span>
          </div>
          <div className="list">
            {pastBookings.map(renderBooking)}
          </div>
        </div>
      )}
    </section>
  );
}
