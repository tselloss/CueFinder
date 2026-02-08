import { useEffect, useMemo, useState } from 'react';
import { getMyBookings } from '../../api/bookingService';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyBookings();
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

  const formatted = useMemo(() => bookings.map((booking) => ({
    ...booking,
    startLabel: new Date(booking.startTime).toLocaleString(),
    endLabel: new Date(booking.endTime).toLocaleString()
  })), [bookings]);

  return (
    <section className="card">
      <h1>My Bookings</h1>
      <p className="muted">Bookings created by your account.</p>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}

      <div className="list">
        {formatted.length === 0 && !loading && <p className="muted">No bookings yet.</p>}
        {formatted.map((booking) => (
          <div key={booking.id} className="list-item">
            <div>
              <strong>{booking.locationName || 'Location'} · {booking.tableName || 'Table'}</strong>
              <div className="muted">{booking.startLabel} → {booking.endLabel}</div>
              <div className="muted">Status: {booking.status}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
