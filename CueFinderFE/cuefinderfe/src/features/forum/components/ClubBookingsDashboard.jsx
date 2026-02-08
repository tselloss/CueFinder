import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Label } from '../../../components/ui/label.jsx';
import { Textarea } from '../../../components/ui/textarea.jsx';
import PageHeader from '../../../shared/components/PageHeader';
import { CalendarCheck, Trash2 } from 'lucide-react';
import * as forumService from '../../../api/forumService';
import { useToast } from '../../../contexts/ToastContext';
import { BOOKING_SITE_URL } from '../../../config/apiConfig';

const statusOptions = ['pending', 'confirmed', 'cancelled', 'completed'];

const toIso = (value) => (value ? new Date(value).toISOString() : null);

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function ClubBookingsDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [records, setRecords] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tableId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startTime: '',
    endTime: '',
    status: 'pending',
    notes: '',
  });
  const [edits, setEdits] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordsData, bookingsData] = await Promise.all([
        forumService.getClubRecords(),
        forumService.getClubBookings(),
      ]);
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.error('Failed to load club bookings data', err);
      showError('Failed to load bookings data.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canManage = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    if (['admin', 'club_owner', 'clubowner', 'club owner', 'owner'].includes(role)) return true;
    const email = (user.email || '').toLowerCase();
    const username = (user.username || user.name || '').toLowerCase();
    return records.some((record) => (record.coOwners || []).some((c) =>
      (c.status || '').toLowerCase() === 'approved' &&
      (((c.email || '').toLowerCase() === email) || ((c.username || '').toLowerCase() === username))
    ));
  }, [records, user]);

  const tableOptions = useMemo(() => {
    return records.flatMap((record) =>
      (record.locations || []).flatMap((location) =>
        (location.tables || []).map((table) => ({
          id: table.id,
          label: `${location.name || 'Location'} - ${table.name || 'Table'}`,
        }))
      )
    );
  }, [records]);

  const handleCreateBooking = async () => {
    if (!form.tableId || !form.startTime || !form.endTime) {
      showError('Select a table and time range.');
      return;
    }

    try {
      setLoading(true);
      await forumService.createClubBooking({
        tableId: form.tableId,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        startTime: toIso(form.startTime),
        endTime: toIso(form.endTime),
        status: form.status,
        notes: form.notes,
      });
      showSuccess('Booking created.');
      setForm({
        tableId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        startTime: '',
        endTime: '',
        status: 'pending',
        notes: '',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create booking', err);
      showError('Could not create booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async (bookingId) => {
    const edit = edits[bookingId];
    if (!edit) return;

    try {
      setLoading(true);
      await forumService.updateClubBooking(bookingId, {
        status: edit.status,
        notes: edit.notes,
      });
      showSuccess('Booking updated.');
      await loadData();
    } catch (err) {
      console.error('Failed to update booking', err);
      showError('Could not update booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      setLoading(true);
      await forumService.deleteClubBooking(bookingId);
      showSuccess('Booking deleted.');
      await loadData();
    } catch (err) {
      console.error('Failed to delete booking', err);
      showError('Could not delete booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (bookingId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], [field]: value },
    }));
  };

  if (BOOKING_SITE_URL) {
    return (
      <div className="space-y-6 pt-4 sm:pt-6">
        <PageHeader
          title="Club Bookings Dashboard"
          subtitle="Bookings are now managed in BookBilliard."
          icon={<CalendarCheck className="text-blue-400" size={28} />}
        />
        <Card className="border border-blue-500/20 bg-slate-900/60">
          <CardContent className="py-6 text-sm text-slate-300 space-y-3">
            <p>Open the booking dashboard to manage tables, requests, and availability.</p>
            <Button
              onClick={() => window.open(`${BOOKING_SITE_URL.replace(/\/+$/, '')}/dashboard`, '_blank', 'noopener')}
              className="w-full sm:w-auto"
            >
              Go to BookBilliard Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 sm:pt-6">
      <PageHeader
        title="Club Bookings Dashboard"
        subtitle="Manage bookings for your own billiard club tables only."
        icon={<CalendarCheck className="text-blue-400" size={28} />}
      />

      {!user ? (
        <Card className="border border-blue-500/20 bg-slate-900/60">
          <CardContent className="py-6 text-sm text-slate-400">Sign in to access bookings.</CardContent>
        </Card>
      ) : !canManage ? (
        <Card className="border border-blue-500/20 bg-slate-900/60">
          <CardContent className="py-6 text-sm text-slate-400">
            Only approved club owners and admins can manage bookings.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border border-blue-500/20 bg-slate-900/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg text-slate-100">Add Booking</CardTitle>
              <p className="text-sm text-slate-400">Create or log bookings for your tables.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Table</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                    value={form.tableId}
                    onChange={(e) => setForm((prev) => ({ ...prev, tableId: e.target.value }))}
                  >
                    <option value="">Select a table...</option>
                    {tableOptions.map((table) => (
                      <option key={table.id} value={table.id}>{table.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <Input
                    value={form.customerEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Customer Phone</Label>
                  <Input
                    value={form.customerPhone}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateBooking} disabled={loading} className="w-full sm:w-auto">
                Add Booking
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-blue-500/20 bg-slate-900/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg text-slate-100">Bookings</CardTitle>
              <p className="text-sm text-slate-400">Only your club bookings are shown here.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-sm text-slate-400">No bookings yet.</p>
              ) : (
                bookings.map((booking) => {
                  const edit = edits[booking.id] || { status: booking.status, notes: booking.notes };
                  return (
                    <div
                      key={booking.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{booking.locationName || 'Location'} · {booking.tableName || 'Table'}</p>
                          <p className="text-xs text-slate-400">{formatDateTime(booking.startTime)} → {formatDateTime(booking.endTime)}</p>
                        </div>
                        <div className="text-xs text-slate-400">Status: {booking.status}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
                        <div>Customer: {booking.customerName || '—'}</div>
                        <div>Email: {booking.customerEmail || '—'}</div>
                        <div>Phone: {booking.customerPhone || '—'}</div>
                        <div>Notes: {booking.notes || '—'}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label>Status</Label>
                          <select
                            className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                            value={edit.status}
                            onChange={(e) => handleEditChange(booking.id, 'status', e.target.value)}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={edit.notes || ''}
                            onChange={(e) => handleEditChange(booking.id, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleUpdateBooking(booking.id)} disabled={loading}>
                          Update
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteBooking(booking.id)}
                          disabled={loading}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
