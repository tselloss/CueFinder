import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Label } from '../../../components/ui/label.jsx';
import { Textarea } from '../../../components/ui/textarea.jsx';
import PageHeader from '../../../shared/components/PageHeader';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import * as forumService from '../../../api/forumService';
import { useToast } from '../../../contexts/ToastContext';

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
  ownerName: user?.name || '',
  ownerEmail: user?.email || '',
  ownerPhone: user?.phone || '',
  website: '',
  socialLink: '',
  description: '',
  coOwners: [],
  pendingCoOwners: [],
  clubs: [createEmptyClub()],
  updatedAt: new Date().toISOString(),
});

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

const mapRecordToForm = (record, user) => ({
  ...record,
  ownerName: record.ownerName || user?.name || user?.username || user?.email || '',
  ownerEmail: record.ownerEmail || user?.email || '',
  ownerPhone: record.ownerPhone || user?.phone || '',
  coOwners: record.coOwners || [],
  clubs: (record.locations || []).map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: [loc.address, loc.city, loc.region, loc.country].filter(Boolean).join(', '),
    tables: (loc.tables || []).map((t) => ({ id: t.id, name: t.name, notes: t.notes })),
    openingHours: loc.openingHours,
    website: record.website,
    specialNotes: loc.specialNotes,
    latitude: loc.latitude,
    longitude: loc.longitude,
  })),
});

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');

export default function BilliardClubsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(() => createEmptyRecord(user));
  const [search, setSearch] = useState('');
  const [pendingCoOwnerEmail, setPendingCoOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState({});
  const [openingDrafts, setOpeningDrafts] = useState({});
  const addressTimers = useRef({});

  const canEdit = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    if (role === 'admin' || role === 'club_owner' || role === 'clubowner' || role === 'club owner' || role === 'owner') {
      return true;
    }
    const email = (user.email || '').toLowerCase();
    const username = (user.username || user.name || '').toLowerCase();
    return (form.coOwners || []).some((c) => (c.status || '').toLowerCase() === 'approved' &&
      (((c.email || '').toLowerCase() === email) || ((c.username || '').toLowerCase() === username))
    );
  }, [form.coOwners, user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return (user.role || '').toLowerCase() === 'admin';
  }, [user]);

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    const email = (user.email || '').toLowerCase();
    const username = (user.username || user.name || '').toLowerCase();
    const existing = records.find((r) =>
      (r.ownerEmail || '').toLowerCase() === email ||
      (r.coOwners || []).some((c) => (c.status || '').toLowerCase() === 'approved' &&
        ((c.email || '').toLowerCase() === email || (c.username || '').toLowerCase() === username))
    );
    if (existing) {
      setForm(mapRecordToForm(existing, user));
    } else {
      setForm(createEmptyRecord(user));
    }
  }, [records, user]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => {
      const matchesOwner = (record.ownerName || '').toLowerCase().includes(term);
      const matchesClub = (record.locations || []).some((club) => {
        return [club.name, club.address, club.city, club.region, club.country].some((value) =>
          (value || '').toLowerCase().includes(term)
        );
      });
      return matchesOwner || matchesClub;
    });
  }, [records, search]);

  const refreshRecords = async () => {
    try {
      const data = await forumService.getClubRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to refresh club records', err);
    }
  };

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
      await refreshRecords();
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
    if (!canEdit) return;
    try {
      setLoading(true);
      await forumService.deleteClubRecord(recordId);
      await refreshRecords();
    } catch (err) {
      console.error('Failed to delete club record', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCoOwner = async () => {
    if (!pendingCoOwnerEmail.trim() || !canEdit || !form.id) return;
    try {
      setLoading(true);
      await forumService.requestClubCoOwner(form.id, pendingCoOwnerEmail.trim());
      setPendingCoOwnerEmail('');
      await refreshRecords();
    } catch (err) {
      console.error('Failed to request co-owner', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCoOwner = async (recordId, coOwnerId) => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      await forumService.approveClubCoOwner(recordId, coOwnerId);
      await refreshRecords();
    } catch (err) {
      console.error('Failed to approve co-owner', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 sm:pt-6">
      <PageHeader
        title="Billiard Clubs Directory"
        subtitle="Club owners can add locations, table counts, opening hours, and maps in one place."
        icon={<MapPin className="text-blue-400" size={28} />}
        actions={
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search clubs or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[220px]"
            />
          </div>
        }
      />

      <Card className="border border-blue-500/20 bg-slate-900/60">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg text-slate-100">Your Club Record</CardTitle>
          <p className="text-sm text-slate-400">Add one record and include multiple club locations.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <p className="text-sm text-slate-400">Sign in to add or edit your club listing.</p>
          ) : !canEdit ? (
            <p className="text-sm text-slate-400">Only club owners and admins can add or edit club listings.</p>
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
                {(form.coOwners || []).some((c) => (c.status || '').toLowerCase() === 'approved') && (
                  <div className="text-xs text-slate-300">
                    Approved: {(form.coOwners || []).filter((c) => (c.status || '').toLowerCase() === 'approved').map((c) => c.email || c.username).join(', ')}
                  </div>
                )}
                {(form.coOwners || []).some((c) => (c.status || '').toLowerCase() === 'pending') && (
                  <div className="text-xs text-slate-400">
                    Pending approval: {(form.coOwners || []).filter((c) => (c.status || '').toLowerCase() === 'pending').map((c) => c.email || c.username).join(', ')}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {form.clubs.map((club, index) => (
                  <Card key={club.id} className="border border-slate-700 bg-slate-950/40">
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-200">
                          Club Location {index + 1}
                        </h3>
                        {form.clubs.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() => handleRemoveClub(club.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Club Name</Label>
                          <Input
                            value={club.name}
                            onChange={(e) => handleClubChange(club.id, 'name', e.target.value)}
                            placeholder="Billiard Club Name"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Tables</Label>
                          <div className="space-y-2">
                            {(club.tables || []).map((table, tableIndex) => (
                              <div key={table.id} className="flex flex-col sm:flex-row gap-2">
                                <Input
                                  value={table.name}
                                  onChange={(e) => handleTableChange(club.id, table.id, 'name', e.target.value)}
                                  placeholder={`Table ${tableIndex + 1} name`}
                                />
                                <Input
                                  value={table.notes}
                                  onChange={(e) => handleTableChange(club.id, table.id, 'notes', e.target.value)}
                                  placeholder="Notes (size, style, booking, etc.)"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => handleRemoveTable(club.id, table.id)}
                                  disabled={(club.tables || []).length <= 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => handleAddTable(club.id)}>
                              <Plus className="w-4 h-4" /> Add Table
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Input
                            value={club.address}
                            onChange={(e) => handleAddressChange(club.id, e.target.value)}
                            placeholder="Full address (street, city, country)"
                            autoComplete="street-address"
                          />
                          <p className="mt-1 text-xs text-slate-400">Used for map search.</p>
                          {(addressSuggestions[club.id] || []).length > 0 && (
                            <div className="mt-2 rounded-md border border-slate-700 bg-slate-950/90 text-sm">
                              {(addressSuggestions[club.id] || []).map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  className="block w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800"
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
                          <div className="flex flex-wrap gap-2 mb-2">
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
                              variant="outline"
                              onClick={() => handleClearOpeningHours(club.id)}
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                            <select
                              value={getOpeningDraft(club.id).range}
                              onChange={(e) => updateOpeningDraft(club.id, 'range', e.target.value)}
                              className="h-10 rounded-md border border-slate-700 bg-slate-950/40 px-3 text-sm text-slate-100"
                            >
                              <option value="Mon-Fri">Mon-Fri</option>
                              <option value="Mon-Thu">Mon-Thu</option>
                              <option value="Fri-Sat">Fri-Sat</option>
                              <option value="Sat-Sun">Sat-Sun</option>
                              <option value="Mon-Sun">Mon-Sun</option>
                            </select>
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
                            <Button type="button" variant="outline" onClick={() => handleAddOpeningLine(club.id)}>
                              Add Line
                            </Button>
                          </div>
                          <Textarea
                            rows={3}
                            value={club.openingHours}
                            onChange={(e) => handleClubChange(club.id, 'openingHours', e.target.value)}
                            placeholder="Mon-Fri 12:00-23:00\nSat-Sun 10:00-01:00"
                          />
                          <p className="mt-1 text-xs text-slate-400">Use one line per day or range (e.g., Mon-Thu 12:00-23:00).</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Special Notes</Label>
                          <Textarea
                            rows={2}
                            value={club.specialNotes}
                            onChange={(e) => handleClubChange(club.id, 'specialNotes', e.target.value)}
                            placeholder="Tournaments, coaching, food, special tables..."
                          />
                        </div>
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

      {loading ? (
        <Card className="border border-slate-800 bg-slate-950/40">
          <CardContent className="py-10 text-center text-sm text-slate-400">
            Loading club listings...
          </CardContent>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card className="border border-slate-800 bg-slate-950/40">
          <CardContent className="py-10 text-center text-sm text-slate-400">
            No clubs yet. Be the first owner to add a club listing.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecords.map((record) => (
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
                                <Button size="sm" variant="outline" className="w-full text-xs">
                                  Book Me
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
      )}
    </div>
  );
}
