import { useEffect, useMemo, useState } from 'react';
import { createBooking, deleteBooking, getBookings, updateBooking } from '../../api/bookingService';
import { getClubRecords } from '../../api/clubService.js';
import { useTranslation } from 'react-i18next';

const toIso = (value) => (value ? new Date(value).toISOString() : null);

export default function BookingsDashboard() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
  const [edits, setEdits] = useState({});
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
      setForm({
        tableId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        startTime: '',
        endTime: '',
        status: 'pending',
        notes: ''
      });
      await loadBookings();
    } catch (err) {
      setError(err?.message || t('bookings.error.create'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    const edit = edits[id];
    if (!edit) return;

    try {
      setLoading(true);
      setError('');
      await updateBooking(id, {
        status: edit.status,
        notes: edit.notes
      });
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

  const now = useMemo(() => new Date(), [bookings]);
  const pendingBookings = useMemo(
    () => formatted
      .filter((booking) => (booking.status || '').toLowerCase() === 'pending')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [formatted]
  );
  const upcomingBookings = useMemo(
    () => formatted
      .filter((booking) => {
        const status = (booking.status || '').toLowerCase();
        return status === 'confirmed' && new Date(booking.startTime) >= now;
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [formatted, now]
  );
  const completedBookings = useMemo(
    () => formatted
      .filter((booking) => {
        const status = (booking.status || '').toLowerCase();
        return status === 'completed' || status === 'cancelled' || new Date(booking.endTime) < now;
      })
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime)),
    [formatted, now]
  );

  return (
    <section className="card">
      <div className="section-header">
        <h1 className="section-title">{t('bookings.title')}</h1>
      </div>
      <p className="muted">{t('bookings.subtitle')}</p>

      {error && <p className="error">{error}</p>}

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.addBooking')}</h2>
        </div>
        <div className="form-grid">
        {tableOptions.length > 0 ? (
          <select
            value={form.tableId}
            onChange={(event) => setForm((prev) => ({ ...prev, tableId: event.target.value }))}
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
            onChange={(event) => setForm((prev) => ({ ...prev, tableId: event.target.value }))}
          />
        )}
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
        <select
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.startTime}
          onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
        />
        <input
          type="datetime-local"
          value={form.endTime}
          onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
        />
        <input
          placeholder={t('book.notes')}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
        <button className="primary" disabled={loading} onClick={handleCreate}>
          {t('bookings.addBooking')}
        </button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.statsTitle')}</h2>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="muted">{t('bookings.totalLabel')}</span>
            <strong>{formatted.length}</strong>
          </div>
          <div className="stat-card">
            <span className="muted">{t('bookings.pendingLabel')}</span>
            <strong>{pendingBookings.length}</strong>
          </div>
          <div className="stat-card">
            <span className="muted">{t('bookings.upcomingLabel')}</span>
            <strong>{upcomingBookings.length}</strong>
          </div>
          <div className="stat-card">
            <span className="muted">{t('bookings.completedLabel')}</span>
            <strong>{completedBookings.length}</strong>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.pendingTitle')}</h2>
          <span className="muted">{pendingBookings.length}</span>
        </div>
        <div className="list">
          {pendingBookings.length === 0 && !loading && <p className="muted">{t('bookings.noBookings')}</p>}
          {pendingBookings.map((booking) => {
            const edit = edits[booking.id] || { status: booking.status, notes: booking.notes };
            return (
              <div key={booking.id} className="list-item">
                <div className="list-meta">
                  <strong>{booking.locationName || t('bookings.locationFallback')} · {booking.tableName || t('bookings.tableFallback')}</strong>
                  <div className="muted">{booking.startLabel} → {booking.endLabel}</div>
                  <div className="muted">{t('bookings.customerLabel')}: {booking.customerName || 'N/A'}</div>
                  <div className="status-row">
                    <span className="muted">{t('bookings.statusLabel')}:</span>
                    <span className={`status-pill status-${(booking.status || 'pending').toLowerCase()}`}>
                      {t(`status.${booking.status}`, { defaultValue: booking.status })}
                    </span>
                  </div>
                </div>
                <div className="list-actions">
                  <select
                    value={edit.status}
                    onChange={(event) => setEdits((prev) => ({
                      ...prev,
                      [booking.id]: { ...edit, status: event.target.value }
                    }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <input
                    placeholder={t('book.notes')}
                    value={edit.notes || ''}
                    onChange={(event) => setEdits((prev) => ({
                      ...prev,
                      [booking.id]: { ...edit, notes: event.target.value }
                    }))}
                  />
                  <button className="secondary" disabled={loading} onClick={() => handleUpdate(booking.id)}>
                    {t('common.update')}
                  </button>
                  <button className="danger" disabled={loading} onClick={() => handleDelete(booking.id)}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.upcomingTitle')}</h2>
          <span className="muted">{upcomingBookings.length}</span>
        </div>
        <div className="list">
          {upcomingBookings.length === 0 && !loading && <p className="muted">{t('bookings.noBookings')}</p>}
          {upcomingBookings.map((booking) => {
            const edit = edits[booking.id] || { status: booking.status, notes: booking.notes };
            return (
              <div key={booking.id} className="list-item">
                <div className="list-meta">
                  <strong>{booking.locationName || t('bookings.locationFallback')} · {booking.tableName || t('bookings.tableFallback')}</strong>
                  <div className="muted">{booking.startLabel} → {booking.endLabel}</div>
                  <div className="muted">{t('bookings.customerLabel')}: {booking.customerName || 'N/A'}</div>
                  <div className="status-row">
                    <span className="muted">{t('bookings.statusLabel')}:</span>
                    <span className={`status-pill status-${(booking.status || 'pending').toLowerCase()}`}>
                      {t(`status.${booking.status}`, { defaultValue: booking.status })}
                    </span>
                  </div>
                </div>
                <div className="list-actions">
                  <select
                    value={edit.status}
                    onChange={(event) => setEdits((prev) => ({
                      ...prev,
                      [booking.id]: { ...edit, status: event.target.value }
                    }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <input
                    placeholder={t('book.notes')}
                    value={edit.notes || ''}
                    onChange={(event) => setEdits((prev) => ({
                      ...prev,
                      [booking.id]: { ...edit, notes: event.target.value }
                    }))}
                  />
                  <button className="secondary" disabled={loading} onClick={() => handleUpdate(booking.id)}>
                    {t('common.update')}
                  </button>
                  <button className="danger" disabled={loading} onClick={() => handleDelete(booking.id)}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('bookings.completedTitle')}</h2>
          <span className="muted">{completedBookings.length}</span>
        </div>
        <div className="list">
          {completedBookings.length === 0 && !loading && <p className="muted">{t('bookings.noBookings')}</p>}
          {completedBookings.map((booking) => {
            const edit = edits[booking.id] || { status: booking.status, notes: booking.notes };
            return (
              <div key={booking.id} className="list-item">
                <div className="list-meta">
                  <strong>{booking.locationName || t('bookings.locationFallback')} · {booking.tableName || t('bookings.tableFallback')}</strong>
                  <div className="muted">{booking.startLabel} → {booking.endLabel}</div>
                  <div className="muted">{t('bookings.customerLabel')}: {booking.customerName || 'N/A'}</div>
                  <div className="status-row">
                    <span className="muted">{t('bookings.statusLabel')}:</span>
                    <span className={`status-pill status-${(booking.status || 'pending').toLowerCase()}`}>
                      {t(`status.${booking.status}`, { defaultValue: booking.status })}
                    </span>
                  </div>
                </div>
                <div className="list-actions">
                  <select
                    value={edit.status}
                    onChange={(event) => setEdits((prev) => ({
                      ...prev,
                      [booking.id]: { ...edit, status: event.target.value }
                    }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <input
                    placeholder={t('book.notes')}
                    value={edit.notes || ''}
                    onChange={(event) => setEdits((prev) => ({
                      ...prev,
                      [booking.id]: { ...edit, notes: event.target.value }
                    }))}
                  />
                  <button className="secondary" disabled={loading} onClick={() => handleUpdate(booking.id)}>
                    {t('common.update')}
                  </button>
                  <button className="danger" disabled={loading} onClick={() => handleDelete(booking.id)}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
