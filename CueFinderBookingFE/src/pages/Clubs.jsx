import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext.jsx';
import * as clubService from '../api/clubService.js';

const OWNER_ROLES = ['club_owner', 'clubowner', 'club owner', 'owner'];

const createEmptyRecord = (user) => ({
  id: '',
  ownerName: user?.name || user?.username || '',
  ownerEmail: user?.email || '',
  ownerPhone: user?.phone || '',
  website: '',
  logoUrl: '',
  description: '',
  coOwners: [],
  locations: [
    {
      id: '',
      name: '',
      address: '',
      city: '',
      region: '',
      country: '',
      openingHours: '12:00-23:00',
      specialNotes: '',
      latitude: '',
      longitude: '',
      tables: [{ id: '', name: '', notes: '' }]
    }
  ]
});

const mapRecordToForm = (record, user) => ({
  id: record.id,
  ownerName: record.ownerName || user?.name || user?.username || '',
  ownerEmail: record.ownerEmail || user?.email || '',
  ownerPhone: record.ownerPhone || user?.phone || '',
  website: record.website || '',
  logoUrl: record.logoUrl || record.socialLink || '',
  description: record.description || '',
  coOwners: record.coOwners || [],
  locations: (record.locations || []).map((loc) => ({
    id: loc.id,
    name: loc.name || '',
    address: loc.address || '',
    city: loc.city || '',
    region: loc.region || '',
    country: loc.country || '',
    openingHours: loc.openingHours || '',
    specialNotes: loc.specialNotes || '',
    latitude: loc.latitude || '',
    longitude: loc.longitude || '',
    tables: (loc.tables || []).map((table) => ({
      id: table.id,
      name: table.name || '',
      notes: table.notes || ''
    }))
  }))
});

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');

export default function Clubs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => createEmptyRecord(user));
  const [pendingCoOwnerEmail, setPendingCoOwnerEmail] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });

  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isOwnerRole = OWNER_ROLES.includes(role);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clubService.getClubRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus({ message: error?.message || t('clubs.status.failedLoad'), type: 'error' });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        (c.status || '').toLowerCase() === 'approved' &&
        (((c.email || '').toLowerCase() === email) || ((c.username || '').toLowerCase() === username))
      )
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
      const matchesClub = (record.locations || []).some((club) =>
        [club.name, club.address, club.city, club.region, club.country].some((value) =>
          (value || '').toLowerCase().includes(term)
        )
      );
      return matchesOwner || matchesClub;
    });
  }, [records, search]);

  const handleLocationChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.locations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, locations: updated };
    });
  };

  const autoFillAddress = async (locationIndex) => {
    const location = form.locations[locationIndex];
    const queryParts = [location.address, location.city, location.region, location.country]
      .filter((value) => (value || '').trim().length > 0);

    if (queryParts.length === 0 && location.name) {
      queryParts.push(location.name);
    }

    if (queryParts.length === 0) {
      setStatus({ message: t('clubs.status.addressRequired'), type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ message: '', type: '' });
      const query = queryParts.join(', ');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=gr&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(t('clubs.status.addressLookupFailed'));
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        setStatus({ message: t('clubs.status.addressNotFound'), type: 'error' });
        return;
      }

      const match = results[0] || {};
      const matchAddress = match.address || {};
      const street = [matchAddress.road, matchAddress.house_number].filter(Boolean).join(' ').trim();

      setForm((prev) => {
        const updated = [...prev.locations];
        updated[locationIndex] = {
          ...updated[locationIndex],
          address: updated[locationIndex].address || street || (match.display_name || '').split(',')[0] || '',
          city: updated[locationIndex].city || matchAddress.city || matchAddress.town || matchAddress.village || matchAddress.county || '',
          region: updated[locationIndex].region || matchAddress.state || matchAddress.region || '',
          country: updated[locationIndex].country || matchAddress.country || 'Greece',
          latitude: updated[locationIndex].latitude || match.lat || '',
          longitude: updated[locationIndex].longitude || match.lon || ''
        };
        return { ...prev, locations: updated };
      });

      setStatus({ message: t('clubs.status.addressFilled'), type: 'success' });
    } catch (error) {
      setStatus({ message: error?.message || t('clubs.status.addressLookupFailed'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (locationIndex, tableIndex, field, value) => {
    setForm((prev) => {
      const updated = [...prev.locations];
      const tables = [...updated[locationIndex].tables];
      tables[tableIndex] = { ...tables[tableIndex], [field]: value };
      updated[locationIndex] = { ...updated[locationIndex], tables };
      return { ...prev, locations: updated };
    });
  };

  const addLocation = () => {
    setForm((prev) => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          id: '',
          name: '',
          address: '',
          city: '',
          region: '',
          country: '',
          openingHours: '12:00-23:00',
          specialNotes: '',
          latitude: '',
          longitude: '',
          tables: [{ id: '', name: '', notes: '' }]
        }
      ]
    }));
  };

  const addTable = (locationIndex) => {
    setForm((prev) => {
      const updated = [...prev.locations];
      updated[locationIndex] = {
        ...updated[locationIndex],
        tables: [...updated[locationIndex].tables, { id: '', name: '', notes: '' }]
      };
      return { ...prev, locations: updated };
    });
  };

  const saveRecord = async () => {
    try {
      setLoading(true);
      setStatus({ message: '', type: '' });
      const payload = {
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        website: form.website,
        logoUrl: form.logoUrl,
        description: form.description,
        locations: form.locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          region: loc.region,
          country: loc.country,
          openingHours: loc.openingHours,
          specialNotes: loc.specialNotes,
          latitude: loc.latitude,
          longitude: loc.longitude,
          tables: loc.tables.map((table) => ({
            id: table.id,
            name: table.name,
            notes: table.notes
          }))
        }))
      };

      let saved;
      if (form.id && isGuid(form.id)) {
        saved = await clubService.updateClubRecord(form.id, payload);
      } else {
        saved = await clubService.createClubRecord(payload);
      }
      await loadRecords();
      if (saved?.id) {
        setForm(mapRecordToForm(saved, user));
      }
      setStatus({ message: t('clubs.status.saved'), type: 'success' });
    } catch (error) {
      setStatus({ message: error?.message || t('clubs.status.failedSave'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await clubService.deleteClubRecord(recordId);
      setStatus({ message: t('clubs.status.deleted'), type: 'success' });
      await loadRecords();
    } catch (error) {
      setStatus({ message: error?.message || t('clubs.status.failedDelete'), type: 'error' });
    }
  };

  const handleRequestCoOwner = async () => {
    if (!pendingCoOwnerEmail || !form.id) return;
    try {
      setLoading(true);
      await clubService.requestClubCoOwner(form.id, pendingCoOwnerEmail.trim());
      setPendingCoOwnerEmail('');
      await loadRecords();
    } catch (error) {
      setStatus({ message: error?.message || t('clubs.status.failedRequest'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCoOwner = async (recordId, coOwnerId) => {
    try {
      setLoading(true);
      await clubService.approveClubCoOwner(recordId, coOwnerId);
      await loadRecords();
    } catch (error) {
      setStatus({ message: error?.message || t('clubs.status.failedApprove'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="section-header">
        <h1 className="section-title">{t('clubs.title')}</h1>
        <span className="muted">{filteredRecords.length}</span>
      </div>
      <p className="muted">{t('clubs.subtitle')}</p>

      {status.message && <p className={status.type === 'error' ? 'error' : 'muted'}>{status.message}</p>}

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">{t('common.search')}</h2>
        </div>
        <div className="form-grid">
        <input
          placeholder={t('clubs.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        </div>
      </div>

      <div className="section-card">
        <div className="list">
        {loading && <p className="muted">{t('clubs.loading')}</p>}
        {filteredRecords.length === 0 && !loading && <p className="muted">{t('clubs.noClubs')}</p>}
        {filteredRecords.map((record) => (
          <div key={record.id} className="list-item">
            <div>
              <strong>{record.ownerName}</strong>
              <div className="muted">{t('clubs.updated', { date: new Date(record.updatedAt).toLocaleDateString() })}</div>
              <p className="muted">{record.description || t('clubs.noDescription')}</p>
              {(record.locations || []).map((club) => {
                const addressParts = [club.address, club.city, club.region, club.country].filter(Boolean);
                const addressText = addressParts.join(', ');
                const mapQuery = club.latitude && club.longitude
                  ? `${club.latitude},${club.longitude}`
                  : addressText;
                const mapUrl = mapQuery
                  ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`
                  : null;
                const mapEmbed = mapQuery
                  ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
                  : null;
                return (
                  <div key={club.id} style={{ marginTop: '12px' }}>
                    <strong>{club.name || t('clubs.locationFallback')}</strong>
                    <div className="muted">
                      {addressText}
                      {mapUrl && (
                        <span className="muted"> · <a href={mapUrl} target="_blank" rel="noreferrer">{t('clubs.viewMap')}</a></span>
                      )}
                    </div>
                    {mapEmbed && (
                      <div className="map-embed">
                        <iframe
                          title={`${club.name || t('clubs.locationFallback')} map`}
                          src={mapEmbed}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                    )}
                    <div className="muted">{t('clubs.openingLabel')}: {club.openingHours || '12:00-23:00'}</div>
                    <div style={{ marginTop: '8px' }}>
                      {(club.tables || []).map((table) => (
                        <div key={table.id} className="list-actions" style={{ marginBottom: '8px' }}>
                          <span>{table.name || t('bookings.tableFallback')}</span>
                          <button
                            className="primary"
                            onClick={() => navigate(`/book?tableId=${table.id}&openingHours=${encodeURIComponent(club.openingHours || '12:00-23:00')}&locationName=${encodeURIComponent(club.name || '')}&address=${encodeURIComponent(addressText)}`)}
                          >
                            {t('clubs.bookNow')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        </div>
      </div>

      {user && (isAdmin || isOwnerRole) && (
        <div className="section-card" style={{ marginTop: '24px' }}>
          <div className="section-header">
            <h2 className="section-title">{t('clubs.manageTitle')}</h2>
          </div>
          <div className="form-grid">
            <input
              placeholder={t('clubs.ownerName')}
              value={form.ownerName}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
            />
            <input
              placeholder={t('clubs.ownerEmail')}
              value={form.ownerEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerEmail: event.target.value }))}
            />
            <input
              placeholder={t('clubs.ownerPhone')}
              value={form.ownerPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerPhone: event.target.value }))}
            />
            <input
              placeholder={t('clubs.website')}
              value={form.website}
              onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
            />
            <input
              placeholder={t('clubs.logoUrl')}
              value={form.logoUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            />
            <textarea
              placeholder={t('clubs.description')}
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          {form.locations.map((location, locationIndex) => (
            <div key={locationIndex} className="section-card">
              <div className="section-header">
                <h3 className="section-title">{t('clubs.locationLabel', { index: locationIndex + 1 })}</h3>
              </div>
              <div className="form-grid">
                <input
                  placeholder={t('clubs.locationName')}
                  value={location.name}
                  onChange={(event) => handleLocationChange(locationIndex, 'name', event.target.value)}
                />
                <input
                  placeholder={t('clubs.address')}
                  value={location.address}
                  onChange={(event) => handleLocationChange(locationIndex, 'address', event.target.value)}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => autoFillAddress(locationIndex)}
                >
                  {t('clubs.autoFillAddress')}
                </button>
                <input
                  placeholder={t('clubs.openingHours')}
                  value={location.openingHours}
                  onChange={(event) => handleLocationChange(locationIndex, 'openingHours', event.target.value)}
                />
                <input
                  placeholder={t('clubs.specialNotes')}
                  value={location.specialNotes}
                  onChange={(event) => handleLocationChange(locationIndex, 'specialNotes', event.target.value)}
                />
              </div>

              <div className="list">
                {(location.tables || []).map((table, tableIndex) => (
                  <div key={tableIndex} className="form-grid">
                    <input
                      placeholder={t('clubs.tableName')}
                      value={table.name}
                      onChange={(event) => handleTableChange(locationIndex, tableIndex, 'name', event.target.value)}
                    />
                    <input
                      placeholder={t('clubs.tableNotes')}
                      value={table.notes}
                      onChange={(event) => handleTableChange(locationIndex, tableIndex, 'notes', event.target.value)}
                    />
                  </div>
                ))}
                <button className="secondary" onClick={() => addTable(locationIndex)}>
                  {t('clubs.addTable')}
                </button>
              </div>
            </div>
          ))}

          <button className="secondary" onClick={addLocation}>{t('clubs.addLocation')}</button>

          <div className="form-grid">
            <button className="primary" disabled={loading} onClick={saveRecord}>
              {t('clubs.saveClub')}
            </button>
            {form.id && (
              <button className="danger" onClick={() => handleDelete(form.id)}>
                {t('clubs.deleteClub')}
              </button>
            )}
          </div>

          <div className="form-grid">
            <input
              placeholder={t('clubs.coOwnerPlaceholder')}
              value={pendingCoOwnerEmail}
              onChange={(event) => setPendingCoOwnerEmail(event.target.value)}
            />
            <button className="secondary" onClick={handleRequestCoOwner}>
              {t('clubs.requestCoOwner')}
            </button>
          </div>

          {(form.coOwners || []).length > 0 && (
            <div className="list">
              {(form.coOwners || []).map((coOwner) => (
                <div key={coOwner.id} className="list-item">
                  <div>
                    <strong>{coOwner.email}</strong>
                    <div className="muted">{t('clubs.coOwnerStatus')}: {coOwner.status}</div>
                  </div>
                  {isAdmin && coOwner.status !== 'approved' && (
                    <button className="secondary" onClick={() => handleApproveCoOwner(form.id, coOwner.id)}>
                      {t('clubs.approve')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
