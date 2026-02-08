import { useState } from 'react';
import { createBooking } from '../../api/bookingService';

const toIso = (value) => (value ? new Date(value).toISOString() : null);

export default function BookTable() {
  const [form, setForm] = useState({
    tableId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.tableId || !form.startTime || !form.endTime) {
      setStatus('Table ID, start time and end time are required.');
      return;
    }

    try {
      setLoading(true);
      setStatus('');
      await createBooking({
        tableId: form.tableId,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        startTime: toIso(form.startTime),
        endTime: toIso(form.endTime),
        notes: form.notes
      });
      setStatus('Booking request sent.');
      setForm({
        tableId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        startTime: '',
        endTime: '',
        notes: ''
      });
    } catch (err) {
      setStatus(err.message || 'Failed to send booking request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h1>Book a Table</h1>
      <p className="muted">Use your table ID to request a booking.</p>

      {status && <p className={status.includes('failed') ? 'error' : 'muted'}>{status}</p>}

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
        <button className="primary" disabled={loading} onClick={handleSubmit}>
          Request booking
        </button>
      </div>
    </section>
  );
}
