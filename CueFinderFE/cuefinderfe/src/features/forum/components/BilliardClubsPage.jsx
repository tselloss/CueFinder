import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Label } from '../../../components/ui/label.jsx';
import { Textarea } from '../../../components/ui/textarea.jsx';
import PageHeader from '../../../shared/components/PageHeader';
import { CalendarCheck, MapPin, Plus, Trash2 } from 'lucide-react';
import * as forumService from '../../../api/forumService';
import { useToast } from '../../../contexts/ToastContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs.jsx';
import { BOOKING_SITE_URL } from '../../../config/apiConfig';

const OWNER_ROLES = ['club_owner', 'clubowner', 'club owner', 'owner'];

const createEmptyClub = () => ({
  id: `club-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  address: '',
  tables: [{ id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', notes: '' }],
  openingHours: '',
  website: '',
  specialNotes: '',
  latitude: '',
  longitude: '',
});

const createEmptyRecord = (user) => ({
  id: `record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  ownerId: user?.id ?? null,
  ownerName: user?.name || user?.username || '',
  ownerEmail: user?.email || '',
  ownerPhone: user?.phone || '',
  website: '',
  socialLink: '',
  description: '',
  coOwners: [],
  clubs: [createEmptyClub()],
  updatedAt: new Date().toISOString(),
});

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');

const getMapQuery = (club) => {
  if (club.latitude && club.longitude) {
    return `${club.latitude},${club.longitude}`;
  }
  if (club.address) {
    return club.address;
  }
  const parts = [club.address, club.city, club.region, club.country].filter(Boolean);
  return parts.join(', ');
};

const openingHourPresets = [
  {
    label: 'Weekdays + Weekend',
    value: 'Mon-Fri 12:00-23:00\nSat-Sun 10:00-01:00',
  },
  {
    label: 'Daily 12-24',
    value: 'Mon-Sun 12:00-00:00',
  },
  {
    label: 'Evenings',
    value: 'Mon-Thu 17:00-23:00\nFri-Sat 17:00-01:00\nSun 17:00-22:00',
  },
];

const mapRecordToForm = (record, user) => {
  const clubs = (record.locations || []).map((loc) => ({
    id: loc.id || `club-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: loc.name || '',
    address: [loc.address, loc.city, loc.region, loc.country].filter(Boolean).join(', '),
    tables: (loc.tables || []).map((table) => ({
      id: table.id || `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: table.name || '',
      notes: table.notes || '',
    })),
    openingHours: loc.openingHours || '',
    website: record.website || '',
    specialNotes: loc.specialNotes || '',
    latitude: loc.latitude || '',
    longitude: loc.longitude || '',
  }));

  return {
    id: record.id,
    ownerId: record.ownerUserId ?? user?.id ?? null,
    ownerName: record.ownerName || user?.name || user?.username || user?.email || '',
    ownerEmail: record.ownerEmail || user?.email || '',
    ownerPhone: record.ownerPhone || user?.phone || '',
    website: record.website || '',
    socialLink: record.socialLink || '',
    description: record.description || '',
    coOwners: record.coOwners || [],
    clubs: clubs.length > 0 ? clubs : [createEmptyClub()],
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
};

const parseOpeningHours = (text) => {
  const match = (text || '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) {
    return { open: '12:00', close: '23:00' };
  }
  return { open: match[1], close: match[2] };
};

const toMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(':').map((part) => Number(part));
  return (h || 0) * 60 + (m || 0);
};

const toTimeString = (minutes) => {
  const total = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const buildTimeOptions = (date, open, close, duration, availability) => {
  if (!date) return [];
  const openMinutes = toMinutes(open);
  let closeMinutes = toMinutes(close);
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
  }
  const options = [];
  const step = 60;
  for (let start = openMinutes; start + duration * 60 <= closeMinutes; start += step) {
    const value = toTimeString(start);
    const startDate = new Date(`${date}T${value}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
    const disabled = (availability || []).some((slot) => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      return slotStart < endDate && slotEnd > startDate;
    });
    options.push({ value, disabled });
  }
  return options;
};

export default function BilliardClubsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(() => createEmptyRecord(user));
  const [search, setSearch] = useState('');
  const [pendingCoOwnerEmail, setPendingCoOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState({});
  const [openingDrafts, setOpeningDrafts] = useState({});
  const addressTimers = useRef({});

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingContext, setBookingContext] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState(1);
  const [bookingCustomerName, setBookingCustomerName] = useState('');
  const [bookingCustomerEmail, setBookingCustomerEmail] = useState('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingAvailability, setBookingAvailability] = useState([]);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingOpenClose, setBookingOpenClose] = useState({ open: '12:00', close: '23:00' });

  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('clubs');

  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isOwnerRole = OWNER_ROLES.includes(role);
  const isClubOwnerPending = role === 'club_owner_pending';
  const ownerViewOnly = isOwnerRole && !isAdmin;

  useEffect(() => {
    if (ownerViewOnly) {
      setActiveTab('my-club');
    }
  }, [ownerViewOnly]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await forumService.getClubRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load club records', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!user) {
      setForm(createEmptyRecord(null));
      return;
    }
    const email = (user.email || '').toLowerCase();
    const username = (user.username || user.name || '').toLowerCase();
    const existing = records.find((record) =>
      (record.ownerEmail || '').toLowerCase() === email ||
      (record.coOwners || []).some((c) =>
        (c.status || '').toLowerCase() === 'approved'
        && (((c.email || '').toLowerCase() === email) || ((c.username || '').toLowerCase() === username))
      )
    );
    if (existing) {
      setForm(mapRecordToForm(existing, user));
    } else {
      setForm(createEmptyRecord(user));
    }
  }, [records, user]);

  const canEdit = useMemo(() => {
    if (!user) return false;
    if (isAdmin || isOwnerRole) return true;
    const email = (user.email || '').toLowerCase();
    const username = (user.username || user.name || '').toLowerCase();
    return (form.coOwners || []).some((c) => (c.status || '').toLowerCase() === 'approved'
      && (((c.email || '').toLowerCase() === email) || ((c.username || '').toLowerCase() === username))
    );
  }, [form.coOwners, isAdmin, isOwnerRole, user]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => {
      const matchesOwner = (record.ownerName || '').toLowerCase().includes(term);
      const matchesClub = (record.locations || []).some((club) =>
        [club.name, club.address, club.city, club.region, club.country].some((value) =>
          (value || '').toLowerCase().includes(term)
        )
      );
      return matchesOwner || matchesClub;
    });
  }, [records, search]);

  const myRecord = useMemo(() => {
    if (!user) return null;
    const email = (user.email || '').toLowerCase();
    const username = (user.username || user.name || '').toLowerCase();
    return records.find((record) =>
      (record.ownerEmail || '').toLowerCase() === email ||
      (record.coOwners || []).some((c) =>
        (c.status || '').toLowerCase() === 'approved'
        && (((c.email || '').toLowerCase() === email) || ((c.username || '').toLowerCase() === username))
      )
    ) || null;
  }, [records, user]);

  const handleRecordChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClubChange = (clubId, field, value) => {
    setForm((prev) => ({
      ...prev,
      clubs: prev.clubs.map((club) =>
        club.id === clubId ? { ...club, [field]: value } : club
      ),
    }));
  };

  const handleTableChange = (clubId, tableId, field, value) => {
    setForm((prev) => ({
      ...prev,
      clubs: prev.clubs.map((club) => {
        if (club.id !== clubId) return club;
        return {
          ...club,
          tables: (club.tables || []).map((table) =>
            table.id === tableId ? { ...table, [field]: value } : table
          ),
        };
      }),
    }));
  };

  const handleAddClub = () => {
    if (!canEdit) return;
    setForm((prev) => ({
      ...prev,
      clubs: [...prev.clubs, createEmptyClub()],
    }));
  };

  const handleRemoveClub = (clubId) => {
    if (!canEdit) return;
    setForm((prev) => ({
      ...prev,
      clubs: prev.clubs.filter((club) => club.id !== clubId),
    }));
  };

  const handleAddTable = (clubId) => {
    setForm((prev) => ({
      ...prev,
      clubs: prev.clubs.map((club) => {
        if (club.id !== clubId) return club;
        return {
          ...club,
          tables: [
            ...(club.tables || []),
            { id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', notes: '' },
          ],
        };
      }),
    }));
  };

  const handleRemoveTable = (clubId, tableId) => {
    setForm((prev) => ({
      ...prev,
      clubs: prev.clubs.map((club) => {
        if (club.id !== clubId) return club;
        return {
          ...club,
          tables: (club.tables || []).filter((table) => table.id !== tableId),
        };
      }),
    }));
  };

  const getOpeningDraft = (clubId) => (
    openingDrafts[clubId] || { range: 'Mon-Fri', open: '12:00', close: '23:00' }
  );

  const updateOpeningDraft = (clubId, field, value) => {
    setOpeningDrafts((prev) => ({
      ...prev,
      [clubId]: { ...getOpeningDraft(clubId), [field]: value },
    }));
  };

  const handleAddOpeningLine = (clubId) => {
    const draft = getOpeningDraft(clubId);
    if (!draft.range || !draft.open || !draft.close) return;
    const line = `${draft.range} ${draft.open}-${draft.close}`;
    setForm((prev) => ({
      ...prev,
      clubs: prev.clubs.map((club) =>
        club.id === clubId
          ? {
            ...club,
            openingHours: club.openingHours
              ? `${club.openingHours.trim()}\n${line}`
              : line,
          }
          : club
      ),
    }));
  };

  const handleClearOpeningHours = (clubId) => {
    handleClubChange(clubId, 'openingHours', '');
  };

  const handleAddressChange = (clubId, value) => {
    handleClubChange(clubId, 'address', value);

    if (addressTimers.current[clubId]) {
      clearTimeout(addressTimers.current[clubId]);
    }

    if (!value || value.trim().length < 3) {
      setAddressSuggestions((prev) => ({ ...prev, [clubId]: [] }));
      return;
    }

    addressTimers.current[clubId] = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=gr&accept-language=el,en&q=${encodeURIComponent(value.trim())}`
        );
        const results = await response.json();
        const suggestions = Array.isArray(results)
          ? results.map((item) => item.display_name).filter(Boolean)
          : [];
        setAddressSuggestions((prev) => ({ ...prev, [clubId]: suggestions }));
      } catch (err) {
        console.error('Failed to fetch address suggestions', err);
      }
    }, 450);
  };

  const handlePickAddress = (clubId, address) => {
    handleClubChange(clubId, 'address', address);
    setAddressSuggestions((prev) => ({ ...prev, [clubId]: [] }));
  };

  const handleRequestCoOwner = async () => {
    if (!pendingCoOwnerEmail.trim()) {
      showError('Provide an email or username.');
      return;
    }
    if (!isGuid(form.id)) {
      showError('Save the club record before adding co-owners.');
      return;
    }
    try {
      await forumService.requestClubCoOwner(form.id, pendingCoOwnerEmail.trim());
      showSuccess('Co-owner request sent.');
      setPendingCoOwnerEmail('');
      await loadRecords();
    } catch (err) {
      console.error('Failed to request co-owner', err);
      showError('Failed to send co-owner request.');
    }
  };

  const handleApproveCoOwner = async (recordId, coOwnerId) => {
    try {
      await forumService.approveClubCoOwner(recordId, coOwnerId);
      showSuccess('Co-owner approved.');
      await loadRecords();
    } catch (err) {
      console.error('Failed to approve co-owner', err);
      showError('Failed to approve co-owner.');
    }
  };

  const handleSave = async () => {
    if (!user || !canEdit) {
      showError('Please sign in as a club owner to save.');
      return;
    }
    const fallbackOwnerName = form.ownerName.trim()
      || user?.name
      || user?.username
      || user?.email
      || '';
    if (!fallbackOwnerName.trim()) {
      showError('Owner name is required.');
      return;
    }

    const payload = {
      ownerName: fallbackOwnerName,
      ownerEmail: form.ownerEmail || user?.email || '',
      ownerPhone: form.ownerPhone,
      website: form.website,
      socialLink: form.socialLink,
      description: form.description,
      locations: (form.clubs || []).map((club) => ({
        name: club.name,
        address: club.address,
        city: '',
        region: '',
        country: '',
        openingHours: club.openingHours,
        specialNotes: club.specialNotes,
        latitude: club.latitude,
        longitude: club.longitude,
        tables: (club.tables || []).map((table) => ({
          name: table.name,
          notes: table.notes,
        })),
      })),
    };

    try {
      setLoading(true);
      let saved;
      if (form.id && isGuid(form.id)) {
        saved = await forumService.updateClubRecord(form.id, payload);
      } else {
        saved = await forumService.createClubRecord(payload);
      }
      await loadRecords();
      if (saved?.id) {
        setForm(mapRecordToForm(saved, user));
      }
      showSuccess('Club record saved.');
    } catch (err) {
      console.error('Failed to save club record', err);
      const message = err?.message || 'Failed to save club record.';
      showError(typeof message === 'string' ? message : 'Failed to save club record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await forumService.deleteClubRecord(recordId);
      showSuccess('Club record deleted.');
      await loadRecords();
    } catch (err) {
      console.error('Failed to delete club record', err);
      showError('Failed to delete club record.');
    }
  };

  const loadMyBookings = useCallback(async () => {
    if (!user) return;
    try {
      setMyBookingsLoading(true);
      const data = await forumService.getMyClubBookings();
      setMyBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load my bookings', err);
      setMyBookings([]);
    } finally {
      setMyBookingsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMyBookings();
    }
  }, [loadMyBookings, user]);

  const loadBookingAvailability = async (tableId, date) => {
    try {
      const from = new Date(`${date}T00:00:00`);
      const to = new Date(`${date}T23:59:59`);
      const data = await forumService.getClubBookingAvailability({
        tableId,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setBookingAvailability(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load availability', err);
      setBookingAvailability([]);
    }
  };

  const handleOpenBooking = (record, club, table) => {
    if (!user) {
      showError('Sign in to send a booking request.');
      return;
    }

    if (BOOKING_SITE_URL) {
      const url = new URL(`${BOOKING_SITE_URL.replace(/\/+$/, '')}/book`);
      if (table?.id) url.searchParams.set('tableId', table.id);
      if (record?.id) url.searchParams.set('recordId', record.id);
      if (club?.id) url.searchParams.set('locationId', club.id);
      window.open(url.toString(), '_blank', 'noopener');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const { open, close } = parseOpeningHours(club.openingHours);
    setBookingContext({ record, club, table });
    setBookingDate(today);
    setBookingStartTime('');
    setBookingDuration(1);
    setBookingOpenClose({ open, close });
    setBookingCustomerName(user?.name || user?.username || '');
    setBookingCustomerEmail(user?.email || '');
    setBookingCustomerPhone(user?.phone || '');
    setBookingNotes('');
    setBookingDialogOpen(true);
    loadBookingAvailability(table.id, today);
  };

  const handleBookingDateChange = (value) => {
    setBookingDate(value);
    if (bookingContext?.table?.id && value) {
      loadBookingAvailability(bookingContext.table.id, value);
    }
  };

  const availableTimeOptions = useMemo(() => (
    buildTimeOptions(bookingDate, bookingOpenClose.open, bookingOpenClose.close, bookingDuration, bookingAvailability)
  ), [bookingDate, bookingDuration, bookingAvailability, bookingOpenClose.close, bookingOpenClose.open]);

  const handleSubmitBooking = async () => {
    if (!bookingContext?.table?.id) return;
    if (!bookingDate || !bookingStartTime) {
      showError('Select a start time.');
      return;
    }

    try {
      setBookingSubmitting(true);
      const start = new Date(`${bookingDate}T${bookingStartTime}:00`);
      const end = new Date(start.getTime() + bookingDuration * 60 * 60 * 1000);
      await forumService.createClubBooking({
        tableId: bookingContext.table.id,
        customerName: bookingCustomerName,
        customerEmail: bookingCustomerEmail,
        customerPhone: bookingCustomerPhone,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: bookingNotes,
      });
      showSuccess('Booking request sent.');
      setBookingDialogOpen(false);
      loadMyBookings();
    } catch (err) {
      console.error('Failed to create booking', err);
      showError('Failed to send booking request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const renderRecordCards = (list, emptyMessage) => {
    if (loading) {
      return (
        <Card className="border border-slate-800 bg-slate-950/40">
          <CardContent className="py-10 text-center text-sm text-slate-400">
            Loading club listings...
          </CardContent>
        </Card>
      );
    }

    if (!list || list.length === 0) {
      return (
        <Card className="border border-slate-800 bg-slate-950/40">
          <CardContent className="py-10 text-center text-sm text-slate-400">
            {emptyMessage || 'No clubs yet.'}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list.map((record) => (
          <Card key={record.id} className="border border-slate-800 bg-slate-950/40">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base text-slate-100">{record.ownerName}</CardTitle>
              <p className="text-xs text-slate-400">Updated {new Date(record.updatedAt).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-300">
                <p>{record.description || 'No description added.'}</p>
                {record.website && (
                  <a
                    href={record.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-blue-400 hover:underline"
                  >
                    Visit Website
                  </a>
                )}
              </div>

              <div className="space-y-3">
                {(record.locations || []).map((club) => {
                  const mapQuery = getMapQuery(club);
                  const mapLink = mapQuery
                    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`
                    : null;
                  const mapSrc = mapQuery
                    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
                    : null;

                  return (
                    <div key={club.id} className="rounded-lg border border-slate-800 p-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-100">{club.name || 'Club Location'}</h4>
                          {mapLink ? (
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              {[club.address, club.city, club.region, club.country].filter(Boolean).join(', ') || 'Open in Maps'}
                            </a>
                          ) : (
                            <p className="text-xs text-slate-400">
                              {[club.address, club.city, club.region, club.country].filter(Boolean).join(', ') || 'No address'}
                            </p>
                          )}
                        </div>
                        {(club.tables || []).length > 0 && (
                          <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full">
                            {club.tables.length} tables
                          </span>
                        )}
                      </div>

                      {club.openingHours && (
                        <p className="text-xs text-slate-300">Hours: {club.openingHours}</p>
                      )}
                      {club.specialNotes && (
                        <p className="text-xs text-slate-400">{club.specialNotes}</p>
                      )}

                      {(club.tables || []).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-300">Tables</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {club.tables.map((table) => (
                              <div key={table.id} className="rounded-md border border-slate-800 bg-slate-900/50 p-2 space-y-1">
                                <div className="text-xs font-semibold text-slate-100">{table.name || 'Table'}</div>
                                {table.notes && <div className="text-[11px] text-slate-400">{table.notes}</div>}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs"
                                  onClick={() => handleOpenBooking(record, club, table)}
                                >
                                  Book Now
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {mapSrc ? (
                        <div className="space-y-2">
                          <div className="aspect-[16/9] overflow-hidden rounded-lg border border-slate-800">
                            <iframe
                              title={`${club.name}-map`}
                              src={mapSrc}
                              className="w-full h-full"
                              loading="lazy"
                            />
                          </div>
                          {mapLink && (
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              Open in Maps
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Add an address or coordinates to show the map.</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {(record.coOwners || []).some((c) => (c.status || '').toLowerCase() === 'pending') && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="text-xs text-yellow-200 font-semibold mb-2">Pending co-owner approvals</p>
                  <div className="flex flex-col gap-2">
                    {record.coOwners.filter((c) => (c.status || '').toLowerCase() === 'pending').map((coOwner) => (
                      <div key={coOwner.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-xs text-yellow-100">{coOwner.email || coOwner.username}</span>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleApproveCoOwner(record.id, coOwner.id)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(isAdmin || (user?.email && (record.ownerEmail || '').toLowerCase() === user.email.toLowerCase())) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 className="w-4 h-4" /> Delete Record
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const editClubContent = (
    <Card className="border border-blue-500/20 bg-slate-900/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg text-slate-100">Your Club Record</CardTitle>
        <p className="text-sm text-slate-400">Add one record and include multiple club locations.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <p className="text-sm text-slate-400">Sign in to add or edit your club listing.</p>
        ) : !canEdit ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Only club owners and admins can add or edit club listings.</p>
            {isClubOwnerPending && (
              <p className="text-sm text-yellow-300">Your club owner request is pending admin approval.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Owner Name</Label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => handleRecordChange('ownerName', e.target.value)}
                  placeholder="Club owner or company name"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  value={form.ownerEmail}
                  onChange={(e) => handleRecordChange('ownerEmail', e.target.value)}
                  placeholder="contact@club.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={form.ownerPhone}
                  onChange={(e) => handleRecordChange('ownerPhone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Website or Booking Link</Label>
                <Input
                  value={form.website}
                  onChange={(e) => handleRecordChange('website', e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Social / Special Link</Label>
                <Input
                  value={form.socialLink}
                  onChange={(e) => handleRecordChange('socialLink', e.target.value)}
                  placeholder="Instagram, Facebook, or event link"
                />
              </div>
              <div className="md:col-span-2">
                <Label>About your clubs</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => handleRecordChange('description', e.target.value)}
                  placeholder="Tell visitors what makes your club special."
                  rows={3}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Co-owners</h3>
                  <p className="text-xs text-slate-400">Admins must approve co-owners before they can edit.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={pendingCoOwnerEmail}
                  onChange={(e) => setPendingCoOwnerEmail(e.target.value)}
                  placeholder="Add co-owner email"
                />
                <Button variant="outline" onClick={handleRequestCoOwner} className="gap-2">
                  <Plus className="w-4 h-4" /> Request
                </Button>
              </div>

              {form.coOwners?.length > 0 && (
                <div className="space-y-2">
                  {form.coOwners.map((coOwner) => (
                    <div key={coOwner.id || coOwner.email} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-200">{coOwner.email || coOwner.username}</p>
                        <p className={`text-[11px] ${coOwner.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {coOwner.status === 'approved' ? 'Approved' : 'Pending approval'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {form.clubs.map((club, index) => (
                <Card key={club.id} className="border border-slate-800 bg-slate-950/40">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-base text-slate-100">Club Location {index + 1}</CardTitle>
                    {form.clubs.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-xs"
                        onClick={() => handleRemoveClub(club.id)}
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Club Name</Label>
                        <Input
                          value={club.name}
                          onChange={(e) => handleClubChange(club.id, 'name', e.target.value)}
                          placeholder="Main branch"
                        />
                      </div>
                      <div>
                        <Label>Full Address</Label>
                        <Input
                          value={club.address}
                          onChange={(e) => handleAddressChange(club.id, e.target.value)}
                          placeholder="Address"
                        />
                        {addressSuggestions[club.id]?.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-auto rounded-md border border-slate-800 bg-slate-950">
                            {addressSuggestions[club.id].map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                                onClick={() => handlePickAddress(club.id, suggestion)}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label>Opening Hours</Label>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            {openingHourPresets.map((preset) => (
                              <Button
                                key={preset.label}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleClubChange(club.id, 'openingHours', preset.value)}
                              >
                                {preset.label}
                              </Button>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleClearOpeningHours(club.id)}
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input
                              value={getOpeningDraft(club.id).range}
                              onChange={(e) => updateOpeningDraft(club.id, 'range', e.target.value)}
                              placeholder="Mon-Fri"
                            />
                            <Input
                              type="time"
                              value={getOpeningDraft(club.id).open}
                              onChange={(e) => updateOpeningDraft(club.id, 'open', e.target.value)}
                            />
                            <Input
                              type="time"
                              value={getOpeningDraft(club.id).close}
                              onChange={(e) => updateOpeningDraft(club.id, 'close', e.target.value)}
                            />
                          </div>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddOpeningLine(club.id)}>
                            Add Line
                          </Button>
                          <Textarea
                            value={club.openingHours}
                            onChange={(e) => handleClubChange(club.id, 'openingHours', e.target.value)}
                            rows={3}
                            placeholder="Mon-Fri 12:00-23:00\nSat-Sun 10:00-01:00"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>Special Notes</Label>
                        <Textarea
                          value={club.specialNotes}
                          onChange={(e) => handleClubChange(club.id, 'specialNotes', e.target.value)}
                          placeholder="Dress code, kitchen, events..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Tables</Label>
                        <Button size="sm" variant="outline" onClick={() => handleAddTable(club.id)}>
                          <Plus className="w-4 h-4" /> Add Table
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(club.tables || []).map((table) => (
                          <div key={table.id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-2">
                            <Input
                              value={table.name}
                              onChange={(e) => handleTableChange(club.id, table.id, 'name', e.target.value)}
                              placeholder="Table name"
                            />
                            <Input
                              value={table.notes}
                              onChange={(e) => handleTableChange(club.id, table.id, 'notes', e.target.value)}
                              placeholder="Notes"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveTable(club.id, table.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Latitude (optional)</Label>
                        <Input
                          value={club.latitude}
                          onChange={(e) => handleClubChange(club.id, 'latitude', e.target.value)}
                          placeholder="37.9838"
                        />
                      </div>
                      <div>
                        <Label>Longitude (optional)</Label>
                        <Input
                          value={club.longitude}
                          onChange={(e) => handleClubChange(club.id, 'longitude', e.target.value)}
                          placeholder="23.7275"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button variant="outline" onClick={handleAddClub} className="gap-2">
                <Plus className="w-4 h-4" /> Add Another Club
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto" disabled={loading}>
                Save Club Record
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const clubsContent = (
    <>
      {editClubContent}
      {renderRecordCards(filteredRecords, 'No clubs yet. Be the first owner to add a club listing.')}
    </>
  );

  return (
    <div className="space-y-6 pt-4 sm:pt-6">
      <PageHeader
        title={ownerViewOnly ? 'My Club' : 'Billiard Clubs Directory'}
        subtitle={ownerViewOnly
          ? 'Manage your club profile and reservations.'
          : 'Club owners can add locations, table counts, opening hours, and maps in one place.'}
        icon={<MapPin className="text-blue-400" size={28} />}
        actions={ownerViewOnly ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate('/clubs/bookings')}
          >
            Reservations
          </Button>
        ) : (
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search clubs or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[220px]"
            />
            {canEdit && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/clubs/bookings')}
              >
                Bookings Dashboard
              </Button>
            )}
          </div>
        )}
      />

      {ownerViewOnly ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900/70 border border-slate-800">
            <TabsTrigger value="my-club">My Club</TabsTrigger>
            <TabsTrigger value="edit-club">Edit Club</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
          </TabsList>
          <TabsContent value="my-club" className="space-y-6">
            {renderRecordCards(myRecord ? [myRecord] : [], 'Your club record has not been created yet.')}
          </TabsContent>
          <TabsContent value="edit-club" className="space-y-6">
            {editClubContent}
          </TabsContent>
          <TabsContent value="reservations" className="space-y-4">
            <Card className="border border-blue-500/20 bg-slate-900/60">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg text-slate-100">Reservations</CardTitle>
                <p className="text-sm text-slate-400">View and manage booking requests for your club.</p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/clubs/bookings')}
                  className="gap-2"
                >
                  <CalendarCheck className="w-4 h-4" /> Open Reservations Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : user ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900/70 border border-slate-800">
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="clubs" className="space-y-6">
            {clubsContent}
          </TabsContent>
          <TabsContent value="my-bookings" className="space-y-4">
            <Card className="border border-slate-800 bg-slate-950/40">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-base text-slate-100">My Bookings</CardTitle>
                <Button size="sm" variant="outline" onClick={loadMyBookings}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {myBookingsLoading ? (
                  <p className="text-sm text-slate-400">Loading bookings...</p>
                ) : myBookings.length === 0 ? (
                  <p className="text-sm text-slate-400">You have no booking requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm text-slate-100">{booking.locationName || 'Club'} · {booking.tableName || 'Table'}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(booking.startTime).toLocaleString()} → {new Date(booking.endTime).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                              : booking.status === 'cancelled' ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                          }`}>
                            {booking.status || 'pending'}
                          </span>
                        </div>
                        {booking.notes && <p className="text-xs text-slate-400 mt-2">{booking.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        clubsContent
      )}

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book a Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs text-slate-400">
              {bookingContext?.club?.name || 'Club'} · {bookingContext?.table?.name || 'Table'}
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <p className="text-xs text-slate-300">
                Opening hours used: {bookingOpenClose.open} - {bookingOpenClose.close}
              </p>
              {bookingContext?.club?.openingHours && (
                <p className="text-[11px] text-slate-500">{bookingContext.club.openingHours}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={bookingDate} onChange={(e) => handleBookingDateChange(e.target.value)} />
              </div>
              <div>
                <Label>Duration (hours)</Label>
                <select
                  className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                  value={bookingDuration}
                  onChange={(e) => setBookingDuration(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((value) => (
                    <option key={value} value={value}>{value} hour{value > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Start Time</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" />Available</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />Unavailable</span>
                  </div>
                  {availableTimeOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">No time slots available for this day.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableTimeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={option.disabled}
                          onClick={() => setBookingStartTime(option.value)}
                          className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition ${
                            option.disabled
                              ? 'border-slate-800 bg-slate-950/40 text-slate-500 cursor-not-allowed'
                              : bookingStartTime === option.value
                                ? 'border-blue-500/60 bg-blue-500/10 text-slate-100'
                                : 'border-slate-800 bg-slate-950/40 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span>{option.value}</span>
                          <span className={`h-2 w-2 rounded-full ${option.disabled ? 'bg-red-400' : 'bg-green-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={bookingCustomerName} onChange={(e) => setBookingCustomerName(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={bookingCustomerPhone} onChange={(e) => setBookingCustomerPhone(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input value={bookingCustomerEmail} onChange={(e) => setBookingCustomerEmail(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special requests?"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBooking} disabled={bookingSubmitting}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
