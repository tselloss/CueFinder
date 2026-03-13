import { useEffect, useMemo, useState } from 'react';
import { createBooking, deleteBooking, getBookings, updateBooking } from '../../api/bookingService';
import { getClubRecords } from '../../api/clubService.js';
import { useTranslation } from 'react-i18next';

const toIso = (value) => (value ? new Date(value).toISOString() : null);

function BookingCard({ booking, statusOptions, onStatusChange, onDelete, loading, t }) {
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(booking.status);
  const [editNotes, setEditNotes] = useState(booking.notes || '');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const status = (booking.status || '').toLowerCase();

  const handleSave = () => {
    onStatusChange(booking.id, { status: editStatus, notes: editNotes });
    setEditing(false);
  };

  const handleQuickStatus = (newStatus) => {
    onStatusChange(booking.id, { status: newStatus, notes: booking.notes || '' });
  };

  return (
    <div className="list-item">
      <div className="list-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong style={{ color: '#f1f5f9' }}>{booking.locationName || t('bookings.locationFallback')} · {booking.tableName || t('bookings.tableFallback')}</strong>
          <span className={`status-pill status-${status}`}>
            {t(`status.${booking.status}`, { defaultValue: booking.status })}
          </span>
        </div>
        <div className="booking-time-range">{booking.startLabel} → {booking.endLabel}</div>
        <div className="booking-who">
          {t('bookings.customerLabel')}: <strong style={{ color: '#cbd5e1' }}>{booking.customerName || 'N/A'}</strong>
          {booking.customerEmail && <span> · {booking.customerEmail}</span>}
          {booking.customerPhone && <span> · {booking.customerPhone}</span>}
        </div>
        {booking.notes && <div className="muted" style={{ fontSize: '0.82rem', fontStyle: 'italic', borderLeft: '2px solid #1f2937', paddingLeft: '8px' }}>{booking.notes}</div>}
      </div>

      <div className="list-actions">
        {!editing && !deleteConfirm && (
          <>
            <div className="btn-row">
              {status === 'pending' && (
                <button className="quick-confirm" disabled={loading} onClick={() => handleQuickStatus('confirmed')}>
                  {t('bookings.confirmAction')}
                </button>
              )}
              {status === 'confirmed' && (
                <button className="quick-complete" disabled={loading} onClick={() => handleQuickStatus('completed')}>
                  {t('bookings.completeAction')}
                </button>
              )}
              {(status === 'pending' || status === 'confirmed') && (
                <button className="quick-reject" disabled={loading} onClick={() => handleQuickStatus('cancelled')}>
                  {t('bookings.rejectAction')}
                </button>
              )}
            </div>
            <div className="btn-row" style={{ marginTop: '4px' }}>
              <button className="secondary" disabled={loading} onClick={() => setEditing(true)}>
                {t('common.edit')}
              </button>
              <button className="danger" disabled={loading} onClick={() => setDeleteConfirm(true)}>
                {t('common.delete')}
              </button>
            </div>
          </>
        )}

        {deleteConfirm && (
          <div className="confirm-inline">
            <span className="muted" style={{ fontSize: '0.9rem' }}>{t('bookings.deleteConfirm')}</span>
            <button className="danger" disabled={loading} onClick={() => onDelete(booking.id)}>
              {t('bookings.deleteConfirmYes')}
            </button>
            <button className="secondary" disabled={loading} onClick={() => setDeleteConfirm(false)}>
              {t('common.cancel')}
            </button>
          </div>
        )}

        {editing && (
          <div className="edit-grid">
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              placeholder={t('book.notes')}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
            <div className="btn-row">
              <button className="secondary" disabled={loading} onClick={handleSave}>
                {t('common.update')}
              </button>
              <button className="danger" disabled={loading} onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsDashboard() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    tableId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startTime: '',
    endTime: '',
    status: 'pending',
    notes: ''
  });
  const [tableOptions, setTableOptions] = useState([]);

  const statusOptions = useMemo(() => [
    { value: 'pending', label: t('status.pending') },
    { value: 'confirmed', label: t('status.confirmed') },
    { value: 'cancelled', label: t('status.cancelled') },
    { value: 'completed', label: t('status.completed') }
  ], [t]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getBookings();
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

  useEffect(() => {
    getClubRecords()
      .then((data) => {
        const records = Array.isArray(data) ? data : [];
        const options = records.flatMap((record) =>
          (record.locations || []).flatMap((location) =>
            (location.tables || []).map((table) => ({
              id: table.id,
              label: `${location.name || t('bookings.locationFallback')} · ${table.name || t('bookings.tableFallback')}`
            }))
          )
        );
        setTableOptions(options);
      })
      .catch(() => setTableOptions([]));
  }, [t]);

  const handleCreate = async () => {
    if (!form.tableId || !form.startTime || !form.endTime) {
      setError(t('bookings.requiredFields'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      await createBooking({
        tableId: form.tableId,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        startTime: toIso(form.startTime),
        endTime: toIso(form.endTime),
        status: form.status,
        notes: form.notes
      });
      setForm({ tableId: '', customerName: '', customerEmail: '', customerPhone: '', startTime: '', endTime: '', status: 'pending', notes: '' });
      setShowAddForm(false);
      await loadBookings();
    } catch (err) {
      setError(err?.message || t('bookings.error.create'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, payload) => {
    try {
      setLoading(true);
      setError('');
      await updateBooking(id, payload);
      await loadBookings();
    } catch (err) {
      setError(err?.message || t('bookings.error.update'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError('');
      await deleteBooking(id);
      await loadBookings();
    } catch (err) {
      setError(err?.message || t('bookings.error.delete'));
    } finally {
      setLoading(false);
    }
  };

  const formatted = useMemo(() => bookings.map((booking) => ({
    ...booking,
    startLabel: new Date(booking.startTime).toLocaleString(),
    endLabel: new Date(booking.endTime).toLocaleString()
  })), [bookings]);

  const pendingBookings = useMemo(
    () => formatted
      .filter((b) => (b.status || '').toLowerCase() === 'pending')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [formatted]
  );
  const upcomingBookings = useMemo(
    () => {
      const now = new Date();
      return formatted
        .filter((b) => {
          const s = (b.status || '').toLowerCase();
          return s === 'confirmed' && new Date(b.startTime) >= now;
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    },
    [formatted]
  );
  const completedBookings = useMemo(
    () => {
      const now = new Date();
      return formatted
        .filter((b) => {
          const s = (b.status || '').toLowerCase();
          return s === 'completed' || s === 'cancelled' || (s === 'confirmed' && new Date(b.endTime) < now);
        })
        .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    },
    [formatted]
  );

  const cardProps = { statusOptions, onStatusChange: handleStatusChange, onDelete: handleDelete, loading, t };

  return (
    <section className="card">
      <div className="section-header">
        <h1 className="section-title">{t('bookings.title')}</h1>
      </div>
      <p className="muted">{t('bookings.subtitle')}</p>

      {error && <p className="error">{error}</p>}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">{t('bookings.totalLabel')}</span>
          <strong>{formatted.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('bookings.pendingLabel')}</span>
          <strong style={{ color: pendingBookings.length > 0 ? '#facc15' : undefined }}>{pendingBookings.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('bookings.upcomingLabel')}</span>
          <strong>{upcomingBookings.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('bookings.completedLabel')}</span>
          <strong>{completedBookings.length}</strong>
        </div>
      </div>

      {/* Add booking (collapsible) */}
      <div className="section-card">
        <div className="add-form-toggle" onClick={() => setShowAddForm((v) => !v)}>
          <h2 className="section-title">{t('bookings.addBookingToggle')}</h2>
          <svg
            className={`toggle-icon ${showAddForm ? 'open' : ''}`}
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {showAddForm && (
          <div className="form-grid">
            {tableOptions.length > 0 ? (
              <select
                value={form.tableId}
                onChange={(e) => setForm((prev) => ({ ...prev, tableId: e.target.value }))}
              >
                <option value="">{t('book.selectTable')}</option>
                {tableOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder={t('book.tableId')}
                value={form.tableId}
                onChange={(e) => setForm((prev) => ({ ...prev, tableId: e.target.value }))}
              />
            )}
            <input
              placeholder={t('book.customerName')}
              value={form.customerName}
              onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
            />
            <input
              placeholder={t('book.customerEmail')}
              value={form.customerEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
            />
            <input
              placeholder={t('book.customerPhone')}
              value={form.customerPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
            />
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            />
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
            />
            <input
              placeholder={t('book.notes')}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <button className="primary" disabled={loading} onClick={handleCreate}>
              {t('bookings.addBooking')}
            </button>
          </div>
        )}
      </div>

      {/* Pending */}
      <div className={`section-card${pendingBookings.length > 0 ? ' section-pending' : ''}`}>
        <div className="section-header">
          <h2 className="section-title">{t('bookings.pendingTitle')}</h2>
          {pendingBookings.length > 0 && <span className="tab-badge">{pendingBookings.length}</span>}
        </div>
        <div className="list">
          {pendingBookings.length === 0 && !loading && <p className="muted">{t('bookings.noBookings')}</p>}
          {pendingBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} {...cardProps} />
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.upcomingTitle')}</h2>
          <span className="muted">{upcomingBookings.length}</span>
        </div>
        <div className="list">
          {upcomingBookings.length === 0 && !loading && <p className="muted">{t('bookings.noBookings')}</p>}
          {upcomingBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} {...cardProps} />
          ))}
        </div>
      </div>

      {/* Completed / Cancelled */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.completedTitle')}</h2>
          <span className="muted">{completedBookings.length}</span>
        </div>
        <div className="list">
          {completedBookings.length === 0 && !loading && <p className="muted">{t('bookings.noBookings')}</p>}
          {completedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} {...cardProps} />
          ))}
        </div>
      </div>
    </section>
  );
}
