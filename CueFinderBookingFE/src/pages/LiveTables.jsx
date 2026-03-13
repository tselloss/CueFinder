import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getLiveStatus, startSession, endSession, getSessionStats, getSessionHistory } from '../api/sessionService.js';
import { getClubRecords, updateClubRecord } from '../api/clubService.js';
import { useAuth } from '../auth/AuthContext.jsx';

const REFRESH_INTERVAL = 15000;

// ASP.NET Core serializes DateTime without 'Z' — force UTC interpretation
function ensureUtc(str) {
  if (!str) return null;
  if (str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str)) return str;
  return str + 'Z';
}

function formatDuration(startedAt) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(ensureUtc(startedAt)).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(ensureUtc(dateStr)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCost(rate, startedAt) {
  if (!rate || !startedAt) return null;
  const minutes = Math.max(0, (Date.now() - new Date(ensureUtc(startedAt)).getTime()) / 60000);
  return (rate * minutes / 60).toFixed(2);
}

const STATUS_CONFIG = {
  free: { label: 'live.statusFree', cls: 'table-status-free' },
  occupied: { label: 'live.statusOccupied', cls: 'table-status-occupied' },
  reserved: { label: 'live.statusReserved', cls: 'table-status-reserved' },
  reserved_soon: { label: 'live.statusReservedSoon', cls: 'table-status-reserved-soon' },
};

function TableCard({ table, onStart, onEnd, t }) {
  const [tick, setTick] = useState(0);
  const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.free;

  useEffect(() => {
    if (table.status !== 'occupied') return;
    const interval = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [table.status]);

  const liveCost = table.status === 'occupied' && table.hourlyRate && table.sessionStart
    ? formatCost(table.hourlyRate, table.sessionStart)
    : null;

  return (
    <div className={`live-table-card ${cfg.cls}`}>
      <div className="live-table-header">
        <span className="live-table-name">{table.tableName}</span>
        <span className={`live-status-pill ${cfg.cls}`}>{t(cfg.label)}</span>
      </div>

      {table.locationName && (
        <div className="live-table-location">{table.locationName}</div>
      )}

      {table.status === 'occupied' && table.sessionStart && (
        <div className="live-session-info">
          {liveCost !== null && (
            <div className="live-cost-hero">
              <span className="live-cost-amount">€{liveCost}</span>
              <span className="live-cost-rate">@ €{table.hourlyRate}/h</span>
            </div>
          )}
          <div className="live-session-timer">{formatDuration(table.sessionStart)}</div>
          <div className="live-session-meta">
            <div className="live-session-row">
              <span className="live-label">{t('live.customer')}:</span>
              <span>{table.customerName || t('live.walkIn')}</span>
            </div>
            <div className="live-session-row">
              <span className="live-label">{t('live.started')}:</span>
              <span>{formatTime(table.sessionStart)}</span>
            </div>
          </div>
          <button className="danger live-end-btn" onClick={() => onEnd(table)}>
            {t('live.endSession')}
          </button>
        </div>
      )}

      {(table.status === 'reserved' || table.status === 'reserved_soon') && table.bookingStart && (
        <div className="live-session-info">
          <div className="live-session-row">
            <span className="live-label">{t('live.customer')}:</span>
            <span>{table.bookingCustomer || '—'}</span>
          </div>
          <div className="live-session-row">
            <span className="live-label">{t('live.bookingTime')}:</span>
            <span>{formatTime(table.bookingStart)} – {formatTime(table.bookingEnd)}</span>
          </div>
          {table.status === 'reserved_soon' && (
            <div className="live-soon-note">{t('live.startingSoon')}</div>
          )}
        </div>
      )}

      {table.status === 'free' && (
        <div className="live-session-info">
          {table.hourlyRate && (
            <div className="live-rate-display">€{table.hourlyRate}/h</div>
          )}
          <button className="primary live-start-btn" onClick={() => onStart(table)}>
            {t('live.startSession')}
          </button>
        </div>
      )}

      {table.tableNotes && (
        <div className="live-table-notes">{table.tableNotes}</div>
      )}
    </div>
  );
}

function StartSessionModal({ table, onClose, onConfirm, t }) {
  const [customerName, setCustomerName] = useState('');
  const [hourlyRate, setHourlyRate] = useState(table.hourlyRate?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onConfirm({
        tableId: table.tableId,
        customerName: customerName.trim() || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || t('live.error.start'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{t('live.startSessionFor', { table: table.tableName })}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            {t('live.customerName')}
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder={t('live.walkIn')}
              autoFocus
            />
          </label>
          <label>
            {t('live.hourlyRate')} (€)
            <input
              type="number"
              min="0"
              step="0.5"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              placeholder={t('live.hourlyRatePlaceholder')}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? t('common.loading') : t('live.startSession')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EndSessionModal({ table, onClose, onConfirm, t }) {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!table.hourlyRate || !table.sessionStart) return;
    const interval = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [table.hourlyRate, table.sessionStart]);

  const liveCost = table.hourlyRate && table.sessionStart
    ? formatCost(table.hourlyRate, table.sessionStart)
    : null;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await onConfirm();
      onClose(result);
    } catch (err) {
      setError(err.message || t('live.error.end'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(null)}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{t('live.endSessionFor', { table: table.tableName })}</h3>
        {liveCost !== null ? (
          <div className="end-session-preview">
            <div className="end-preview-label">{t('live.endCostPreview')}</div>
            <div className="end-preview-cost">€{liveCost}</div>
            <div className="end-preview-duration">{formatDuration(table.sessionStart)}</div>
            <div className="end-preview-rate">@ €{table.hourlyRate}/h</div>
            <p className="end-preview-note">{t('live.endSessionConfirm')}</p>
          </div>
        ) : (
          <p className="modal-body-text">{t('live.endSessionConfirm')}</p>
        )}
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={() => onClose(null)} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button type="button" className="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? t('common.loading') : t('live.endSession')}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillModal({ result, onClose, t }) {
  const hours = Math.floor(result.totalMinutes / 60);
  const mins = result.totalMinutes % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box bill-modal" onClick={e => e.stopPropagation()}>
        <div className="bill-check">✓</div>
        <h3 className="modal-title">{t('live.sessionEnded')}</h3>
        <div className="bill-details">
          <div className="bill-row">
            <span>{t('live.billTable')}</span>
            <strong>{result.tableName}</strong>
          </div>
          {result.customerName && (
            <div className="bill-row">
              <span>{t('live.customer')}</span>
              <strong>{result.customerName}</strong>
            </div>
          )}
          <div className="bill-row">
            <span>{t('live.billDuration')}</span>
            <strong>{durationStr}</strong>
          </div>
          {result.hourlyRate && (
            <div className="bill-row">
              <span>{t('live.hourlyRate')}</span>
              <strong>€{result.hourlyRate}/h</strong>
            </div>
          )}
          {result.totalCost != null && (
            <div className="bill-row bill-total">
              <span>{t('live.billTotal')}</span>
              <strong>€{result.totalCost.toFixed(2)}</strong>
            </div>
          )}
        </div>
        <button className="primary" style={{ width: '100%' }} onClick={onClose}>
          {t('live.close')}
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, t }) {
  const [records, setRecords] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getClubRecords()
      .then(data => {
        setRecords(data);
        const init = {};
        for (const r of data) {
          init[r.id] = {
            defaultRate: r.defaultHourlyRate != null ? String(r.defaultHourlyRate) : '',
            tables: (r.locations || []).flatMap(loc =>
              (loc.tables || []).map(tb => ({
                id: tb.id,
                name: tb.name,
                locationName: (r.locations || []).length > 1 ? loc.name : null,
                rate: tb.hourlyRate != null ? String(tb.hourlyRate) : ''
              }))
            )
          };
        }
        setRates(init);
      })
      .catch(err => setError(err.message || t('live.settingsLoadError')))
      .finally(() => setLoading(false));
  }, []);

  const setDefaultRate = (recordId, val) =>
    setRates(prev => ({ ...prev, [recordId]: { ...prev[recordId], defaultRate: val } }));

  const setTableRate = (recordId, idx, val) =>
    setRates(prev => {
      const tables = [...(prev[recordId]?.tables || [])];
      tables[idx] = { ...tables[idx], rate: val };
      return { ...prev, [recordId]: { ...prev[recordId], tables } };
    });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const record of records) {
        const r = rates[record.id];
        if (!r) continue;
        const payload = {
          ownerName: record.ownerName,
          ownerEmail: record.ownerEmail,
          ownerPhone: record.ownerPhone,
          website: record.website,
          socialLink: record.socialLink,
          logoUrl: record.logoUrl,
          description: record.description,
          defaultHourlyRate: r.defaultRate ? parseFloat(r.defaultRate) : null,
          locations: (record.locations || []).map(loc => ({
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
            tables: (loc.tables || []).map(tb => {
              const tableEntry = r.tables.find(tt => tt.id === tb.id);
              return {
                id: tb.id,
                name: tb.name,
                notes: tb.notes,
                hourlyRate: tableEntry?.rate ? parseFloat(tableEntry.rate) : null
              };
            })
          }))
        };
        await updateClubRecord(record.id, payload);
      }
      onClose(true);
    } catch (err) {
      setError(err.message || t('live.settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-box settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3 className="modal-title">{t('live.settingsTitle')}</h3>
          <span className="settings-modal-sub">{t('live.settingsSubtitle')}</span>
        </div>

        {loading && <p className="muted">{t('common.loading')}</p>}

        {!loading && records.length === 0 && (
          <p className="muted">{t('live.settingsNoClub')}</p>
        )}

        {!loading && records.map(record => {
          const r = rates[record.id] || { defaultRate: '', tables: [] };
          return (
            <div key={record.id} className="settings-record">
              {records.length > 1 && (
                <div className="settings-record-name">{record.ownerName || '—'}</div>
              )}

              <div className="settings-section">
                <div className="settings-section-label">{t('live.settingsDefaultRate')}</div>
                <div className="settings-rate-row">
                  <div className="settings-rate-input">
                    <span className="settings-currency">€</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={r.defaultRate}
                      onChange={e => setDefaultRate(record.id, e.target.value)}
                      placeholder="0.00"
                    />
                    <span className="settings-per-hour">/h</span>
                  </div>
                  <span className="settings-hint">{t('clubs.defaultHourlyRateHint')}</span>
                </div>
              </div>

              {r.tables.length > 0 && (
                <div className="settings-section">
                  <div className="settings-section-label">{t('live.settingsTableRates')}</div>
                  <div className="settings-table-list">
                    {r.tables.map((tb, idx) => (
                      <div key={tb.id} className="settings-table-row">
                        <div className="settings-table-meta">
                          <span className="settings-table-name">{tb.name}</span>
                          {tb.locationName && <span className="settings-table-loc">{tb.locationName}</span>}
                        </div>
                        <div className="settings-rate-input settings-rate-compact">
                          <span className="settings-currency">€</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={tb.rate}
                            onChange={e => setTableRate(record.id, idx, e.target.value)}
                            placeholder={r.defaultRate || '—'}
                          />
                          <span className="settings-per-hour">/h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {error && <div className="form-error">{error}</div>}

        {!loading && (
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => onClose(false)} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="button" className="primary" onClick={handleSave} disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsView({ revenueStats, tables, history, historyLoading, onLoadHistory, t }) {
  const activeSessions = tables.filter(tb => tb.status === 'occupied').length;

  useEffect(() => {
    if (history.length === 0) onLoadHistory();
  }, []);

  return (
    <div className="stats-view">
      <div className="stats-kpi-row">
        <div className="stats-kpi-card stats-kpi-active">
          <span className="stats-kpi-dot" />
          <span className="stats-kpi-value">{activeSessions}</span>
          <span className="stats-kpi-label">{t('live.statsActiveNow')}</span>
        </div>
        {revenueStats ? (
          <>
            <div className="stats-kpi-card stats-kpi-sessions">
              <span className="stats-kpi-icon stats-icon-sessions" />
              <span className="stats-kpi-value">{revenueStats.todayCompleted}</span>
              <span className="stats-kpi-label">{t('live.statsSessions')}</span>
            </div>
            <div className="stats-kpi-card stats-kpi-today">
              <span className="stats-kpi-icon stats-icon-euro" />
              <span className="stats-kpi-value">
                {revenueStats.todayRevenue > 0 ? `€${Number(revenueStats.todayRevenue).toFixed(2)}` : '—'}
              </span>
              <span className="stats-kpi-label">{t('live.statsRevToday')}</span>
            </div>
            <div className="stats-kpi-card stats-kpi-week">
              <span className="stats-kpi-icon stats-icon-week" />
              <span className="stats-kpi-value">
                {revenueStats.weekRevenue > 0 ? `€${Number(revenueStats.weekRevenue).toFixed(2)}` : '—'}
              </span>
              <span className="stats-kpi-label">{t('live.statsRevWeek')}</span>
            </div>
            <div className="stats-kpi-card stats-kpi-month">
              <span className="stats-kpi-icon stats-icon-month" />
              <span className="stats-kpi-value">
                {revenueStats.monthRevenue > 0 ? `€${Number(revenueStats.monthRevenue).toFixed(2)}` : '—'}
              </span>
              <span className="stats-kpi-label">{t('live.statsRevMonth')}</span>
            </div>
          </>
        ) : (
          <div className="stats-kpi-card stats-kpi-empty">
            <span className="muted">{t('common.loading')}</span>
          </div>
        )}
      </div>

      {revenueStats && (
        <div className="stats-revenue-bar">
          <div className="stats-revenue-bar-label">{t('live.statsRevMonth')}</div>
          <div className="stats-bar-track">
            <div
              className="stats-bar-fill"
              style={{
                width: revenueStats.monthRevenue > 0
                  ? `${Math.min((revenueStats.weekRevenue / revenueStats.monthRevenue) * 100, 100)}%`
                  : '0%'
              }}
            />
          </div>
          <div className="stats-bar-labels">
            <span className="muted">{t('live.statsRevWeek')}: {revenueStats.weekRevenue > 0 ? `€${Number(revenueStats.weekRevenue).toFixed(2)}` : '—'}</span>
            <span className="muted">{t('live.statsRevMonth')}: {revenueStats.monthRevenue > 0 ? `€${Number(revenueStats.monthRevenue).toFixed(2)}` : '—'}</span>
          </div>
        </div>
      )}

      <div className="stats-history-section">
        <h3 className="stats-history-title">{t('live.historyTitle')}</h3>
        {historyLoading && <p className="muted">{t('common.loading')}</p>}
        {!historyLoading && history.length === 0 && (
          <p className="muted">{t('live.historyNoSessions')}</p>
        )}
        {!historyLoading && history.length > 0 && (
          <div className="stats-history-list">
            {history.map((s) => {
              const h = Math.floor((s.totalMinutes || 0) / 60);
              const m = (s.totalMinutes || 0) % 60;
              const dur = h > 0 ? `${h}h ${m}m` : `${m}m`;
              return (
                <div key={s.id} className="stats-history-row">
                  <div className="stats-history-info">
                    <strong>{s.tableName}</strong>
                    {s.customerName && <span className="muted"> · {s.customerName}</span>}
                    <span className="stats-history-time">
                      {new Date(s.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {s.endedAt && ` → ${new Date(s.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                  <div className="stats-history-meta">
                    <span className="muted">{dur}</span>
                    {s.totalCost != null && (
                      <strong className="stats-money">€{Number(s.totalCost).toFixed(2)}</strong>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveTables() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [filterLocation, setFilterLocation] = useState('all');
  const [activeTab, setActiveTab] = useState('tables');

  const [revenueStats, setRevenueStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [startModal, setStartModal] = useState(null);
  const [endModal, setEndModal] = useState(null);   // full table object
  const [billModal, setBillModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [data, stats] = await Promise.all([
        getLiveStatus(),
        getSessionStats().catch(() => null)
      ]);
      setTables(data);
      if (stats) setRevenueStats(stats);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      setError(t('live.error.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getSessionHistory({ page: 1 });
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const handleStart = async (payload) => {
    const session = await startSession(payload);
    await load();
    return session;
  };

  const handleEnd = (table) => {
    setEndModal(table);
  };

  const confirmEnd = async (sessionId) => {
    const result = await endSession(sessionId);
    await load();
    return result;
  };

  const handleEndClose = (result) => {
    setEndModal(null);
    if (result) setBillModal(result);
  };

  const locations = [...new Map(tables.map(tb => [tb.locationId, tb.locationName])).entries()];

  const filtered = filterLocation === 'all'
    ? tables
    : tables.filter(tb => tb.locationId === filterLocation);

  const statusCounts = {
    free: tables.filter(tb => tb.status === 'free').length,
    occupied: tables.filter(tb => tb.status === 'occupied').length,
    reserved: tables.filter(tb => tb.status === 'reserved' || tb.status === 'reserved_soon').length,
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('live.title')}</h2>
          <p className="page-subtitle">{t('live.subtitle')}</p>
        </div>
        <div className="live-header-actions">
          {lastRefresh && (
            <span className="live-last-refresh">
              {t('live.lastRefresh', { time: lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })}
            </span>
          )}
          <button className="secondary" onClick={load} disabled={loading}>
            {t('live.refresh')}
          </button>
          <button className="secondary live-settings-btn" onClick={() => setSettingsOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {t('live.settings')}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="live-tabs">
        <button
          className={`live-tab ${activeTab === 'tables' ? 'live-tab-active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          {t('live.tabTables')}
        </button>
        <button
          className={`live-tab ${activeTab === 'stats' ? 'live-tab-active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          {t('live.tabStats')}
          {revenueStats && revenueStats.todayRevenue > 0 && (
            <span className="live-tab-badge">€{Number(revenueStats.todayRevenue).toFixed(0)}</span>
          )}
        </button>
      </div>

      {activeTab === 'tables' && (
        <>
          {/* Status bar */}
          <div className="live-stats">
            <div className="live-stat live-stat-free">
              <span className="live-stat-count">{statusCounts.free}</span>
              <span className="live-stat-label">{t('live.statusFree')}</span>
            </div>
            <div className="live-stat live-stat-occupied">
              <span className="live-stat-count">{statusCounts.occupied}</span>
              <span className="live-stat-label">{t('live.statusOccupied')}</span>
            </div>
            <div className="live-stat live-stat-reserved">
              <span className="live-stat-count">{statusCounts.reserved}</span>
              <span className="live-stat-label">{t('live.statusReserved')}</span>
            </div>
          </div>

          {/* Location filter */}
          {locations.length > 1 && (
            <div className="live-location-filter">
              <button
                className={filterLocation === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilterLocation('all')}
              >
                {t('live.allLocations')}
              </button>
              {locations.map(([id, name]) => (
                <button
                  key={id}
                  className={filterLocation === id ? 'primary' : 'secondary'}
                  onClick={() => setFilterLocation(id)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          {loading && tables.length === 0 ? (
            <div className="card">{t('common.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="card">{t('live.noTables')}</div>
          ) : (
            <div className="live-tables-grid">
              {filtered.map(table => (
                <TableCard
                  key={table.tableId}
                  table={table}
                  onStart={setStartModal}
                  onEnd={handleEnd}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'stats' && (
        <StatsView
          revenueStats={revenueStats}
          tables={tables}
          history={history}
          historyLoading={historyLoading}
          onLoadHistory={loadHistory}
          t={t}
        />
      )}

      {startModal && (
        <StartSessionModal
          table={startModal}
          onClose={() => setStartModal(null)}
          onConfirm={handleStart}
          t={t}
        />
      )}

      {endModal && (
        <EndSessionModal
          table={endModal}
          onClose={handleEndClose}
          onConfirm={() => confirmEnd(endModal.activeSessionId)}
          t={t}
        />
      )}

      {billModal && (
        <BillModal
          result={billModal}
          onClose={() => setBillModal(null)}
          t={t}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={(saved) => {
            setSettingsOpen(false);
            if (saved) load();
          }}
          t={t}
        />
      )}
    </div>
  );
}
