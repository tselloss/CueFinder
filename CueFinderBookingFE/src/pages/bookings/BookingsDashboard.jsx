import { useEffect, useMemo, useState } from 'react';
import { createBooking, deleteBooking, getBookings, updateBooking } from '../../api/bookingService';

const statusOptions = ['pending', 'confirmed', 'cancelled', 'completed'];

const toIso = (value) => (value ? new Date(value).toISOString() : null);

export default function BookingsDashboard() {
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

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCreate = async () => {
    if (!form.tableId || !form.startTime || !form.endTime) {
      setError('Table ID, start time and end time are required.');
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
      setError(err.message || 'Failed to create booking');
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
      setError(err.message || 'Failed to update booking');
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
      setError(err.message || 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const formatted = useMemo(() => bookings.map((booking) => ({
    ...booking,
    startLabel: new Date(booking.startTime).toLocaleString(),
    endLabel: new Date(booking.endTime).toLocaleString()
  })), [bookings]);

  return (
    <section className="card">
      <h1>Club Bookings Dashboard</h1>
      <p className="muted">Manage bookings in the booking service.</p>

      {error && <p className="error">{error}</p>}

      <div className="form-grid">
        <input
          placeholder="Table ID"
          value={form.tableId}
          onChange={(event) => setForm((prev) => ({ ...prev, tableId: event.target.value }))}
        />
        <input
          placeholder="Customer name"
          value={form.customerName}
          onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
        />
        <input
          placeholder="Customer email"
          value={form.customerEmail}
          onChange={(event) => setForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
        />
        <input
          placeholder="Customer phone"
          value={form.customerPhone}
          onChange={(event) => setForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
        />
        <select
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
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
          placeholder="Notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
        <button className="primary" disabled={loading} onClick={handleCreate}>
          Add booking
        </button>
      </div>

      <div className="list">
        {formatted.length === 0 && !loading && <p className="muted">No bookings yet.</p>}
        {formatted.map((booking) => {
          const edit = edits[booking.id] || { status: booking.status, notes: booking.notes };
          return (
            <div key={booking.id} className="list-item">
              <div>
                <strong>{booking.locationName || 'Location'} · {booking.tableName || 'Table'}</strong>
                <div className="muted">{booking.startLabel} → {booking.endLabel}</div>
                <div className="muted">Customer: {booking.customerName || 'N/A'}</div>
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
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <input
                  placeholder="Notes"
                  value={edit.notes || ''}
                  onChange={(event) => setEdits((prev) => ({
                    ...prev,
                    [booking.id]: { ...edit, notes: event.target.value }
                  }))}
                />
                <button className="secondary" disabled={loading} onClick={() => handleUpdate(booking.id)}>
                  Update
                </button>
                <button className="danger" disabled={loading} onClick={() => handleDelete(booking.id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
