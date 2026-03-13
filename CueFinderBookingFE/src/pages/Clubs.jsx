import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext.jsx';
import * as clubService from '../api/clubService.js';
import * as buddyService from '../api/buddyService.js';

const OWNER_ROLES = ['club_owner', 'clubowner', 'club owner', 'owner'];

const createEmptyRecord = (user) => ({
  id: '',
  ownerName: user?.name || user?.username || '',
  ownerEmail: user?.email || '',
  ownerPhone: user?.phone || '',
  website: '',
  logoUrl: '',
  description: '',
  defaultHourlyRate: '',
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
      tables: [{ id: '', name: '', notes: '', hourlyRate: '' }]
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
  defaultHourlyRate: record.defaultHourlyRate != null ? String(record.defaultHourlyRate) : '',
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
      notes: table.notes || '',
      hourlyRate: table.hourlyRate != null ? String(table.hourlyRate) : ''
    }))
  }))
});

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

function ClubBuddySection({ locationName, user, t }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ playDate: '', startTime: '', skillLevel: 'beginner', notes: '' });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    setLoading(true);
    buddyService.getPosts(null, locationName)
      .then((data) => { if (!cancelled) setPosts(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setPosts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [expanded, locationName]);

  const handlePost = async () => {
    if (!form.playDate || !form.startTime || !form.skillLevel) {
      setError(t('buddy.requiredFields'));
      return;
    }
    try {
      setPosting(true);
      setError('');
      await buddyService.createPost({ ...form, locationName });
      setSuccess(t('clubs.postCreated'));
      setShowForm(false);
      setForm({ playDate: '', startTime: '', skillLevel: 'beginner', notes: '' });
      const data = await buddyService.getPosts(null, locationName);
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || t('buddy.error.create'));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="club-buddy-section">
      <button
        type="button"
        className="club-buddy-toggle"
        onClick={() => { setExpanded((v) => !v); setSuccess(''); }}
      >
        <span>{t('clubs.playersLooking')}</span>
        {!expanded && posts.length === 0 && <span className="club-buddy-chevron">›</span>}
        {expanded && <span className="club-buddy-chevron open">›</span>}
        {posts.length > 0 && (
          <span className="club-buddy-count">{posts.length}</span>
        )}
      </button>

      {expanded && (
        <div className="club-buddy-body">
          {loading && <p className="muted" style={{ fontSize: '0.8rem', margin: '4px 0' }}>{t('common.loading')}</p>}

          {!loading && posts.length === 0 && (
            <p className="muted" style={{ fontSize: '0.82rem', margin: '6px 0' }}>{t('clubs.noOneLooking')}</p>
          )}

          {posts.map((post) => (
            <div key={post.id} className="club-buddy-post">
              <strong style={{ color: '#f1f5f9' }}>{post.userName}</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                {new Date(post.playDate).toLocaleDateString()} · {post.startTime}
              </span>
              <span className={`status-pill status-${post.skillLevel}`} style={{ fontSize: '0.72rem' }}>
                {t(`buddy.levels.${post.skillLevel}`, { defaultValue: post.skillLevel })}
              </span>
              {post.notes && (
                <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>{post.notes}</span>
              )}
            </div>
          ))}

          {success && <p style={{ color: '#4ade80', fontSize: '0.82rem', margin: '4px 0' }}>{success}</p>}

          {!showForm && !success && (
            user ? (
              <button
                type="button"
                className="secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', marginTop: '6px' }}
                onClick={() => { setShowForm(true); setError(''); }}
              >
                {t('clubs.wantToPlayHere')}
              </button>
            ) : (
              <p className="muted" style={{ fontSize: '0.78rem', margin: '6px 0' }}>{t('clubs.loginToPlayHere')}</p>
            )
          )}

          {showForm && (
            <div className="form-grid" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">{t('buddy.playDate')}</label>
                <input
                  type="date"
                  value={form.playDate}
                  onChange={(e) => setForm((p) => ({ ...p, playDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('buddy.startTime')}</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('buddy.level')}</label>
                <select
                  value={form.skillLevel}
                  onChange={(e) => setForm((p) => ({ ...p, skillLevel: e.target.value }))}
                >
                  {SKILL_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{t(`buddy.levels.${lvl}`)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">{t('buddy.notes')}</label>
                <input
                  placeholder={t('buddy.notes')}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
              {error && <p className="error" style={{ gridColumn: '1 / -1', margin: 0 }}>{error}</p>}
              <div className="btn-row" style={{ gridColumn: '1 / -1' }}>
                <button className="primary" style={{ marginTop: 0 }} disabled={posting} onClick={handlePost}>
                  {t('buddy.createPost')}
                </button>
                <button
                  className="secondary"
                  disabled={posting}
                  onClick={() => { setShowForm(false); setError(''); }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [expandedMaps, setExpandedMaps] = useState({});

  const toggleMap = (key) => setExpandedMaps((prev) => ({ ...prev, [key]: !prev[key] }));

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
          tables: [{ id: '', name: '', notes: '', hourlyRate: '' }]
        }
      ]
    }));
  };

  const addTable = (locationIndex) => {
    setForm((prev) => {
      const updated = [...prev.locations];
      updated[locationIndex] = {
        ...updated[locationIndex],
        tables: [...updated[locationIndex].tables, { id: '', name: '', notes: '', hourlyRate: prev.defaultHourlyRate || '' }]
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
        defaultHourlyRate: form.defaultHourlyRate ? parseFloat(form.defaultHourlyRate) : null,
        locations: form.locations.map((loc) => ({
          id: isGuid(loc.id) ? loc.id : null,
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
            id: isGuid(table.id) ? table.id : null,
            name: table.name,
            notes: table.notes,
            hourlyRate: table.hourlyRate ? parseFloat(table.hourlyRate) : null
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

      <input
        className="clubs-search"
        placeholder={t('clubs.searchPlaceholder')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {loading && <p className="muted">{t('clubs.loading')}</p>}
      {filteredRecords.length === 0 && !loading && <p className="muted" style={{ marginTop: '12px' }}>{t('clubs.noClubs')}</p>}

      <div className="clubs-list">
        {filteredRecords.map((record) => (
          <div key={record.id} className="club-record">
            <div className="club-record-header">
              {record.logoUrl && (
                <img className="club-logo" src={record.logoUrl} alt={record.ownerName} />
              )}
              <div className="club-record-info">
                <strong>{record.ownerName}</strong>
                <div className="club-record-meta">
                  {record.website && (
                    <a
                      className="club-website-link"
                      href={record.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {record.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                  {record.ownerPhone && (
                    <span className="muted" style={{ fontSize: '0.78rem' }}>{record.ownerPhone}</span>
                  )}
                  <span className="muted" style={{ fontSize: '0.75rem' }}>
                    {t('clubs.updated', { date: new Date(record.updatedAt).toLocaleDateString() })}
                  </span>
                </div>
              </div>
            </div>

            {record.description && (
              <p className="club-record-desc">{record.description}</p>
            )}

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
                <div key={club.id} className="club-location">
                  <div className="club-location-name">{club.name || t('clubs.locationFallback')}</div>
                  <div className="club-location-meta">
                    {addressText && (
                      <span>
                        {addressText}
                        {mapUrl && (
                          <> · <a href={mapUrl} target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>{t('clubs.viewMap')}</a></>
                        )}
                      </span>
                    )}
                    <span>{t('clubs.openingLabel')}: {club.openingHours || '12:00-23:00'}</span>
                  </div>

                  {mapEmbed && (
                    <div>
                      <button
                        type="button"
                        className="secondary"
                        style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                        onClick={() => toggleMap(`${record.id}-${club.id}`)}
                      >
                        {expandedMaps[`${record.id}-${club.id}`] ? t('clubs.hideMap') : t('clubs.showMap')}
                      </button>
                      {expandedMaps[`${record.id}-${club.id}`] && (
                        <div className="map-embed" style={{ marginTop: '8px' }}>
                          <iframe
                            title={`${club.name || t('clubs.locationFallback')} map`}
                            src={mapEmbed}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(club.tables || []).length > 0 && (
                    <div className="club-table-list">
                      {(club.tables || []).map((table) => {
                        const displayRate = table.hourlyRate ?? record.defaultHourlyRate;
                        return (
                          <div key={table.id} className="club-table-row">
                            <span className="club-table-name">{table.name || t('bookings.tableFallback')}</span>
                            {displayRate != null && (
                              <span className="club-table-rate">€{Number(displayRate).toFixed(2)}/h</span>
                            )}
                            <button
                              className="primary"
                              style={{ marginTop: 0, padding: '7px 14px', fontSize: '0.875rem' }}
                              onClick={() => navigate(`/book?tableId=${table.id}&openingHours=${encodeURIComponent(club.openingHours || '12:00-23:00')}&locationName=${encodeURIComponent(club.name || '')}&address=${encodeURIComponent(addressText)}`)}
                            >
                              {t('clubs.bookNow')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <ClubBuddySection locationName={club.name || ''} user={user} t={t} />
                </div>
              );
            })}
          </div>
        ))}
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

          <div className="pricing-default-section">
            <div className="pricing-default-header">
              <strong>{t('clubs.defaultHourlyRate')}</strong>
              <span className="muted" style={{ fontSize: '0.82rem' }}>{t('clubs.defaultHourlyRateHint')}</span>
            </div>
            <div className="pricing-default-input">
              <span className="pricing-currency">€</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={form.defaultHourlyRate}
                onChange={(event) => setForm((prev) => ({ ...prev, defaultHourlyRate: event.target.value }))}
                style={{ width: '110px' }}
              />
              <span className="muted" style={{ fontSize: '0.9rem' }}>/h</span>
            </div>
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
                  <div key={tableIndex} className="table-form-row">
                    <div className="form-grid" style={{ flex: 1 }}>
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
                    <div className="table-rate-field">
                      <div className="pricing-default-input">
                        <span className="pricing-currency">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder={form.defaultHourlyRate || '0.00'}
                          value={table.hourlyRate}
                          onChange={(event) => handleTableChange(locationIndex, tableIndex, 'hourlyRate', event.target.value)}
                          style={{ width: '90px' }}
                        />
                        <span className="muted" style={{ fontSize: '0.85rem' }}>/h</span>
                      </div>
                      {!table.hourlyRate && form.defaultHourlyRate && (
                        <span className="table-uses-default">
                          {t('clubs.tableUsesDefault', { rate: form.defaultHourlyRate })}
                        </span>
                      )}
                    </div>
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
