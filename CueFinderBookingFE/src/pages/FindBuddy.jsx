import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext.jsx';
import * as buddyService from '../api/buddyService.js';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

function LevelBadge({ level, t }) {
  return <span className={`buddy-level buddy-level-${level}`}>{t(`buddy.levels.${level}`, { defaultValue: level })}</span>;
}

function StarPicker({ value, onChange }) {
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={`star-btn ${n <= value ? 'filled' : ''}`} onClick={() => onChange(n)}>
          ★
        </button>
      ))}
    </div>
  );
}

function PostCard({ post, user, t, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ skillLevel: 'intermediate', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    try {
      setLoading(true);
      setError('');
      await buddyService.sendRequest(post.id, form);
      setSent(true);
      setExpanded(false);
      onRefresh();
    } catch (e) {
      setError(e.message || t('buddy.error.request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buddy-post">
      <div className="buddy-post-header">
        <div className="buddy-post-avatar">{(post.userName || '?')[0].toUpperCase()}</div>
        <div className="buddy-post-info">
          <strong>{post.userName}</strong>
          <LevelBadge level={post.skillLevel} t={t} />
        </div>
        <div className="buddy-post-when">
          <span>📅 {new Date(post.playDate).toLocaleDateString()} · {post.startTime}</span>
          {post.locationName && <span>📍 {post.locationName}</span>}
        </div>
      </div>

      {post.notes && <p className="buddy-post-notes">{post.notes}</p>}

      <div className="buddy-post-footer">
        {post.requestCount > 0 && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {t('buddy.requestsCount', { count: post.requestCount })}
          </span>
        )}
        {!user && <span className="muted" style={{ fontSize: '0.82rem' }}>{t('buddy.loginToRequest')}</span>}
        {user && !sent && (
          <button
            className="secondary"
            style={{ fontSize: '0.85rem', padding: '6px 12px', marginLeft: 'auto' }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t('common.cancel') : t('buddy.sendRequest')}
          </button>
        )}
        {sent && <span className="success" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>✓ {t('buddy.requestSent')}</span>}
      </div>

      {error && <p className="error" style={{ fontSize: '0.82rem', margin: '4px 0 0' }}>{error}</p>}

      {expanded && (
        <div className="buddy-request-form">
          <label className="buddy-form-label">{t('buddy.yourLevel')}</label>
          <select value={form.skillLevel} onChange={(e) => setForm((p) => ({ ...p, skillLevel: e.target.value }))}>
            {LEVELS.map((l) => <option key={l} value={l}>{t(`buddy.levels.${l}`)}</option>)}
          </select>
          <textarea
            rows={2}
            placeholder={t('buddy.message')}
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          />
          <button className="primary" style={{ marginTop: 0 }} disabled={loading} onClick={handleSend}>
            {t('buddy.sendRequestSubmit')}
          </button>
        </div>
      )}
    </div>
  );
}

function RequestRow({ postId, req, t, onRefresh }) {
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ score: 5, note: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (fn) => async () => {
    try { setLoading(true); setError(''); await fn(); onRefresh(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleReview = handle(async () => {
    await buddyService.reviewRequest(postId, req.id, { score: reviewForm.score, note: reviewForm.note });
    setShowReview(false);
  });

  const s = (req.status || '').toLowerCase();

  return (
    <div className={`buddy-request-row buddy-req-${s}`}>
      <div className="buddy-request-info">
        <div className="buddy-post-avatar buddy-avatar-sm">{(req.requesterName || '?')[0].toUpperCase()}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '0.9rem' }}>{req.requesterName}</strong>
            <LevelBadge level={req.skillLevel} t={t} />
          </div>
          {req.message && <p className="muted" style={{ fontSize: '0.82rem', margin: '4px 0 0' }}>{req.message}</p>}
        </div>
      </div>

      <div className="buddy-request-actions">
        {s === 'pending' && (
          <>
            <button className="quick-confirm" disabled={loading} onClick={handle(() => buddyService.acceptRequest(postId, req.id))}>
              {t('buddy.accept')}
            </button>
            <button className="quick-reject" disabled={loading} onClick={handle(() => buddyService.declineRequest(postId, req.id))}>
              {t('buddy.decline')}
            </button>
          </>
        )}
        {s === 'accepted' && !req.reviewScore && (
          <>
            <span className="status-pill status-confirmed">✓ {t('buddy.status.accepted')}</span>
            <button className="secondary" style={{ fontSize: '0.82rem', padding: '5px 10px' }} onClick={() => setShowReview((v) => !v)}>
              {t('buddy.review')}
            </button>
          </>
        )}
        {s === 'accepted' && req.reviewScore && (
          <span className="status-pill status-confirmed">{'★'.repeat(req.reviewScore)} {t('buddy.reviewed')}</span>
        )}
        {s === 'declined' && (
          <span className="status-pill status-cancelled">{t('buddy.status.declined')}</span>
        )}
      </div>

      {error && <p className="error" style={{ fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}

      {showReview && (
        <div className="buddy-review-form">
          <label className="buddy-form-label">{t('buddy.reviewScore')}</label>
          <StarPicker value={reviewForm.score} onChange={(n) => setReviewForm((p) => ({ ...p, score: n }))} />
          <textarea
            rows={2}
            placeholder={t('buddy.reviewNote')}
            value={reviewForm.note}
            onChange={(e) => setReviewForm((p) => ({ ...p, note: e.target.value }))}
          />
          <button className="primary" style={{ marginTop: 0 }} disabled={loading} onClick={handleReview}>
            {t('buddy.submitReview')}
          </button>
        </div>
      )}
    </div>
  );
}

function MyPostCard({ post, t, onRefresh }) {
  const [showRequests, setShowRequests] = useState(true);
  const [loading, setLoading] = useState(false);

  const handle = (fn) => async () => {
    try { setLoading(true); await fn(); onRefresh(); }
    catch {} finally { setLoading(false); }
  };

  const pendingCount = (post.requests || []).filter((r) => r.status === 'pending').length;
  const statusClass = post.status === 'open' ? 'confirmed' : post.status === 'matched' ? 'pending' : 'cancelled';

  return (
    <div className="buddy-post buddy-my-post">
      <div className="buddy-post-header">
        <div className="buddy-post-info">
          <LevelBadge level={post.skillLevel} t={t} />
          <span className={`status-pill status-${statusClass}`}>{t(`buddy.status.${post.status}`, { defaultValue: post.status })}</span>
        </div>
        <div className="buddy-post-when">
          <span>📅 {new Date(post.playDate).toLocaleDateString()} · {post.startTime}</span>
          {post.locationName && <span>📍 {post.locationName}</span>}
        </div>
      </div>

      {post.notes && <p className="buddy-post-notes">{post.notes}</p>}

      <div className="buddy-post-footer">
        {post.status === 'open' && (
          <button className="secondary" style={{ fontSize: '0.82rem', padding: '5px 10px' }} disabled={loading} onClick={handle(() => buddyService.closePost(post.id))}>
            {t('buddy.closePost')}
          </button>
        )}
        <button className="danger" style={{ fontSize: '0.82rem', padding: '5px 10px' }} disabled={loading} onClick={handle(() => buddyService.deletePost(post.id))}>
          {t('buddy.deletePost')}
        </button>
        {(post.requests || []).length > 0 && (
          <button className="secondary" style={{ fontSize: '0.82rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowRequests((v) => !v)}>
            {pendingCount > 0 && <span className="tab-badge" style={{ margin: 0 }}>{pendingCount}</span>}
            {t('buddy.requestsCount', { count: post.requests.length })}
          </button>
        )}
      </div>

      {showRequests && (post.requests || []).length > 0 && (
        <div className="buddy-requests-list">
          {post.requests.map((req) => (
            <RequestRow key={req.id} postId={post.id} req={req} t={t} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FindBuddy() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState('browse');
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [filterLevel, setFilterLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ locationName: '', playDate: '', startTime: '', skillLevel: 'intermediate', notes: '' });

  const loadPosts = async (level = filterLevel) => {
    try {
      setLoading(true);
      setError('');
      const data = await buddyService.getPosts(level);
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || t('buddy.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const loadMyPosts = async () => {
    if (!user) return;
    try {
      const data = await buddyService.getMyPosts();
      setMyPosts(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadMyRequests = async () => {
    if (!user) return;
    try {
      const data = await buddyService.getMyRequests();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => { loadPosts(filterLevel); }, [filterLevel]);
  useEffect(() => {
    if (tab === 'mine') loadMyPosts();
    if (tab === 'requests') loadMyRequests();
  }, [tab, user]);

  const handleCreate = async () => {
    if (!form.playDate || !form.startTime || !form.skillLevel) {
      setError(t('buddy.requiredFields'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      await buddyService.createPost({
        locationName: form.locationName || null,
        playDate: new Date(form.playDate).toISOString(),
        startTime: form.startTime,
        skillLevel: form.skillLevel,
        notes: form.notes || null
      });
      setForm({ locationName: '', playDate: '', startTime: '', skillLevel: 'intermediate', notes: '' });
      setShowCreate(false);
      await loadMyPosts();
    } catch (e) {
      setError(e.message || t('buddy.error.create'));
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    loadPosts(filterLevel);
    if (tab === 'mine') loadMyPosts();
    if (tab === 'requests') loadMyRequests();
  };

  return (
    <section className="card">
      <div className="home-hero" style={{ paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.7rem' }}>{t('buddy.title')}</h1>
        <p className="home-hero-tagline" style={{ fontSize: '0.9rem' }}>{t('buddy.subtitle')}</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="tab-bar" style={{ marginBottom: '20px' }}>
        <button className={`tab-button ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>
          {t('buddy.tabBrowse')}
        </button>
        {user && (
          <button className={`tab-button ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
            {t('buddy.tabMyPosts')}
          </button>
        )}
        {user && (
          <button className={`tab-button ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            {t('buddy.tabMyRequests')}
          </button>
        )}
        {!user && (
          <span className="muted" style={{ fontSize: '0.82rem', alignSelf: 'center', marginLeft: '8px' }}>
            — {t('buddy.loginToRequest')}
          </span>
        )}
      </div>

      {/* Browse */}
      {tab === 'browse' && (
        <>
          <div className="buddy-filters">
            <button className={`secondary ${filterLevel === '' ? 'buddy-filter-active' : ''}`} style={{ fontSize: '0.82rem', padding: '5px 12px' }} onClick={() => setFilterLevel('')}>
              {t('buddy.levelAll')}
            </button>
            {LEVELS.map((l) => (
              <button key={l} className={`secondary ${filterLevel === l ? 'buddy-filter-active' : ''}`} style={{ fontSize: '0.82rem', padding: '5px 12px' }} onClick={() => setFilterLevel(l)}>
                {t(`buddy.levels.${l}`)}
              </button>
            ))}
          </div>

          {loading && <p className="muted" style={{ marginTop: '12px' }}>{t('common.loading')}</p>}
          {!loading && posts.length === 0 && (
            <div className="section-card" style={{ textAlign: 'center', padding: '40px 20px', marginTop: '8px' }}>
              <p className="muted" style={{ margin: 0 }}>{t('buddy.noPosts')}</p>
            </div>
          )}

          <div className="buddy-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} user={user} t={t} onRefresh={refreshAll} />
            ))}
          </div>
        </>
      )}

      {/* My Posts */}
      {tab === 'mine' && user && (
        <>
          <div className="section-card" style={{ marginBottom: '16px' }}>
            <div className="add-form-toggle" onClick={() => setShowCreate((v) => !v)}>
              <h2 className="section-title">{t('buddy.newPost')}</h2>
              <svg className={`toggle-icon ${showCreate ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {showCreate && (
              <div className="form-grid" style={{ marginTop: '4px' }}>
                <div className="form-section-label">When & where</div>
                <div className="form-group">
                  <label className="form-label">{t('buddy.playDate')}</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={form.playDate} onChange={(e) => setForm((p) => ({ ...p, playDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('buddy.startTime')}</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('buddy.locationName')}</label>
                  <input placeholder={t('buddy.locationName')} value={form.locationName} onChange={(e) => setForm((p) => ({ ...p, locationName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('buddy.level')}</label>
                  <select value={form.skillLevel} onChange={(e) => setForm((p) => ({ ...p, skillLevel: e.target.value }))}>
                    {LEVELS.map((l) => <option key={l} value={l}>{t(`buddy.levels.${l}`)}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('buddy.notes')}</label>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
                <button className="primary" style={{ gridColumn: '1 / -1', marginTop: 0 }} disabled={loading} onClick={handleCreate}>
                  {t('buddy.createPost')}
                </button>
              </div>
            )}
          </div>

          {myPosts.length === 0 && (
            <div className="section-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p className="muted" style={{ margin: 0 }}>{t('buddy.noMyPosts')}</p>
            </div>
          )}
          <div className="buddy-list">
            {myPosts.map((post) => <MyPostCard key={post.id} post={post} t={t} onRefresh={loadMyPosts} />)}
          </div>
        </>
      )}

      {/* My Requests */}
      {tab === 'requests' && user && (
        <>
          {myRequests.length === 0 && (
            <div className="section-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p className="muted" style={{ margin: 0 }}>{t('buddy.noMyRequests')}</p>
            </div>
          )}
          <div className="buddy-list">
            {myRequests.map((req) => (
              <div key={req.id} className="buddy-post">
                <div className="buddy-post-header">
                  <div className="buddy-post-avatar">{(req.post.userName || '?')[0].toUpperCase()}</div>
                  <div className="buddy-post-info">
                    <strong>{req.post.userName}</strong>
                    <LevelBadge level={req.post.skillLevel} t={t} />
                  </div>
                  <div className="buddy-post-when">
                    <span>📅 {new Date(req.post.playDate).toLocaleDateString()} · {req.post.startTime}</span>
                    {req.post.locationName && <span>📍 {req.post.locationName}</span>}
                  </div>
                </div>
                {req.message && <p className="buddy-post-notes">{req.message}</p>}
                <div className="buddy-post-footer">
                  <span className="muted" style={{ fontSize: '0.8rem' }}>{t('buddy.yourLevel')}: <LevelBadge level={req.skillLevel} t={t} /></span>
                  <span className={`status-pill status-${req.status === 'accepted' ? 'confirmed' : req.status === 'declined' ? 'cancelled' : 'pending'}`}>
                    {t(`buddy.status.${req.status}`, { defaultValue: req.status })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
