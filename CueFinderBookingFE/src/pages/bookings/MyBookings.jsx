import { useEffect, useMemo, useState } from 'react';
import { getMyBookings, updateMyBooking } from '../../api/bookingService';
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

  const handleEditStart = (booking) => {
    setEditingId(booking.id);
    setEdits((prev) => ({
      ...prev,
      [booking.id]: {
        startTime: toInputValue(booking.startTime),
        endTime: toInputValue(booking.endTime),
        notes: booking.notes || ''
      }
    }));
  };

  const handleEditCancel = () => {
    setEditingId('');
  };

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

  return (
    <section className="card">
      <div className="section-header">
        <h1 className="section-title">{t('myBookings.title')}</h1>
        <span className="muted">{formatted.length}</span>
      </div>
      <p className="muted">{t('myBookings.subtitle')}</p>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">{t('common.loading')}</p>}

      <div className="section-card">
        <div className="list">
          {formatted.length === 0 && !loading && <p className="muted">{t('myBookings.noBookings')}</p>}
          {formatted.map((booking) => (
            <div key={booking.id} className="list-item">
              <div className="list-meta">
                <strong>{booking.locationName || t('bookings.locationFallback')} · {booking.tableName || t('bookings.tableFallback')}</strong>
                <div className="muted">{booking.startLabel} → {booking.endLabel}</div>
                <div className="status-row">
                  <span className="muted">{t('bookings.statusLabel')}:</span>
                  <span className={`status-pill status-${(booking.status || 'pending').toLowerCase()}`}
                    title={t(`status.${booking.status}`, { defaultValue: booking.status })}
                  >
                    {t(`status.${booking.status}`, { defaultValue: booking.status })}
                  </span>
                </div>
                {editingId === booking.id && (
                  <p className="muted edit-note">{t('myBookings.editNote')}</p>
                )}
              </div>
              <div className="list-actions">
                {(() => {
                  const status = (booking.status || '').toLowerCase();
                  const canEdit = status !== 'completed' && status !== 'cancelled';
                  if (!canEdit) {
                    return <span className="muted">{t('myBookings.editDisabled')}</span>;
                  }

                  if (editingId === booking.id) {
                    const edit = edits[booking.id] || {};
                    return (
                      <div className="edit-grid">
                        <input
                          type="datetime-local"
                          value={edit.startTime || ''}
                          onChange={(event) => handleEditChange(booking.id, 'startTime', event.target.value)}
                        />
                        <input
                          type="datetime-local"
                          value={edit.endTime || ''}
                          onChange={(event) => handleEditChange(booking.id, 'endTime', event.target.value)}
                        />
                        <input
                          placeholder={t('book.notes')}
                          value={edit.notes || ''}
                          onChange={(event) => handleEditChange(booking.id, 'notes', event.target.value)}
                        />
                        <button className="secondary" disabled={loading} onClick={() => handleUpdate(booking.id)}>
                          {t('common.update')}
                        </button>
                        <button className="danger" disabled={loading} onClick={handleEditCancel}>
                          {t('common.cancel')}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button className="secondary" disabled={loading} onClick={() => handleEditStart(booking)}>
                      {t('common.edit')}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
