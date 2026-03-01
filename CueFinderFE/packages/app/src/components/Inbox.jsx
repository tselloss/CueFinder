import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, Trash2, ArrowLeft, Inbox as InboxIcon, X, Gavel, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import * as messageService from '../api/messageService';
import '../styles/inbox.css';

/* ─── helpers ─────────────────────────────────────────────── */

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7)  return `${diffDays}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatBubbleTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const AVATAR_COLORS = [
  '#1e9eff','#17caf4','#22c55e','#f59e0b',
  '#a855f7','#ef4444','#06b6d4','#ec4899',
];

function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function parseOfferContent(content) {
  try { return JSON.parse(content); } catch { return null; }
}

/* ─── Sub-components ──────────────────────────────────────── */

function Avatar({ name, size = 'md' }) {
  return (
    <div
      className={`msng-avatar msng-avatar-${size}`}
      style={{ background: avatarColor(name) }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

function ThreadItem({ message, active, onClick }) {
  const isOffer = ['offer', 'accepted', 'rejected', 'counter_offer'].includes(message.messageType);
  return (
    <button
      type="button"
      className={[
        'msng-thread',
        active           ? 'msng-thread-active'  : '',
        !message.isRead  ? 'msng-thread-unread'  : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <Avatar name={message.senderName} size="md" />
      <div className="msng-thread-body">
        <div className="msng-thread-top">
          <span className="msng-thread-name">{message.senderName}</span>
          <span className="msng-thread-time">{formatTime(message.createdAt)}</span>
        </div>
        <div className="msng-thread-sub">
          <span className="msng-thread-preview">
            {isOffer && <span style={{ marginRight: 4 }}>🔨</span>}
            {message.subject ? `${message.subject}: ` : ''}{isOffer ? 'Offer message' : message.content}
          </span>
          {!message.isRead && <span className="msng-thread-dot" />}
        </div>
      </div>
    </button>
  );
}

function Bubble({ text, sent, time, senderName }) {
  return (
    <div className={`msng-bubble-row${sent ? ' msng-bubble-row-sent' : ''}`}>
      {!sent && <Avatar name={senderName} size="sm" />}
      <div className="msng-bubble-col">
        <div className={`msng-bubble${sent ? ' msng-bubble-sent' : ' msng-bubble-recv'}`}>
          <span className="msng-bubble-text">{text}</span>
        </div>
        <span className="msng-bubble-time">{time}</span>
      </div>
    </div>
  );
}

function OfferCard({ data, time, senderName, onAccept, onReject, onCounter, responding }) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterVal, setCounterVal] = useState('');
  const [counterMsg, setCounterMsg] = useState('');

  const discount = data.originalPrice
    ? Math.round((1 - data.amount / data.originalPrice) * 100)
    : 0;

  return (
    <div className="msng-bubble-row">
      <Avatar name={senderName} size="sm" />
      <div className="msng-bubble-col" style={{ maxWidth: '100%' }}>
        <div style={{
          border: '1.5px solid #f59e0b',
          borderRadius: 12,
          padding: '14px 16px',
          background: 'var(--card, #1c1c1e)',
          minWidth: 260,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Gavel size={16} color="#f59e0b" />
            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>Bid Offer</span>
            {data.itemTitle && (
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 4 }}>
                — {data.itemTitle}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Offered amount</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>€{Number(data.amount).toFixed(2)}</div>
            </div>
            {data.originalPrice && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Asking price</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)' }}>€{Number(data.originalPrice).toFixed(2)}</div>
                {discount > 0 && (
                  <div style={{ fontSize: 11, color: '#f59e0b' }}>−{discount}% off</div>
                )}
              </div>
            )}
          </div>
          {data.note && (
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', marginBottom: 10, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
              "{data.note}"
            </div>
          )}
          {onAccept && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <button
                onClick={onAccept}
                disabled={responding}
                style={{ flex: 1, minWidth: 80, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <CheckCircle size={14} /> Accept
              </button>
              <button
                onClick={onReject}
                disabled={responding}
                style={{ flex: 1, minWidth: 80, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <XCircle size={14} /> Decline
              </button>
              <button
                onClick={() => setShowCounter(v => !v)}
                disabled={responding}
                style={{ flex: 1, minWidth: 80, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #f59e0b', background: 'transparent', color: '#f59e0b', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <RefreshCw size={14} /> Counter
              </button>
            </div>
          )}
          {onAccept && showCounter && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>€</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={counterVal}
                  onChange={e => setCounterVal(e.target.value)}
                  placeholder="Your price"
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14 }}
                />
              </div>
              <textarea
                value={counterMsg}
                onChange={e => setCounterMsg(e.target.value)}
                placeholder="Message (optional)"
                rows={2}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 13, resize: 'vertical' }}
              />
              <button
                onClick={() => onCounter(parseFloat(counterVal) || 0, counterMsg)}
                disabled={responding || !counterVal}
                style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Send Counter Offer
              </button>
            </div>
          )}
        </div>
        <span className="msng-bubble-time">{time}</span>
      </div>
    </div>
  );
}

function ResponseCard({ messageType, data, time, senderName }) {
  const configs = {
    accepted: { icon: <CheckCircle size={20} color="#22c55e" />, label: 'Offer Accepted!', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: '#22c55e' },
    rejected: { icon: <XCircle size={20} color="#ef4444" />, label: 'Offer Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: '#ef4444' },
    counter_offer: { icon: <RefreshCw size={20} color="#f59e0b" />, label: 'Counter Offer', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b' },
  };
  const cfg = configs[messageType];
  if (!cfg) return null;

  return (
    <div className="msng-bubble-row">
      <Avatar name={senderName} size="sm" />
      <div className="msng-bubble-col">
        <div style={{ border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px', background: cfg.bg, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {cfg.icon}
            <span style={{ fontWeight: 700, color: cfg.color, fontSize: 14 }}>{cfg.label}</span>
          </div>
          {messageType === 'counter_offer' && data?.counterAmount != null && (
            <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color, marginBottom: 4 }}>
              €{Number(data.counterAmount).toFixed(2)}
            </div>
          )}
          {messageType === 'accepted' && data?.amount != null && (
            <div style={{ fontSize: 16, color: 'var(--foreground)' }}>
              Your offer of €{Number(data.amount).toFixed(2)} was accepted.
            </div>
          )}
          {data?.message && (
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 6 }}>
              "{data.message}"
            </div>
          )}
        </div>
        <span className="msng-bubble-time">{time}</span>
      </div>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="msng-empty-panel">
      <div className="msng-empty-icon"><InboxIcon size={32} /></div>
      <p className="msng-empty-title">Your Messages</p>
      <p className="msng-empty-sub">Select a conversation to start chatting</p>
    </div>
  );
}

/* ─── Main Inbox ──────────────────────────────────────────── */

export default function Inbox({ onBack }) {
  const [messages,     setMessages]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [replyText,    setReplyText]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  // sentReplies: { [messageId]: [{text, time}] }
  const [sentReplies,  setSentReplies]  = useState({});
  const [offerResponding, setOfferResponding] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  /* load */
  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messageService.getInbox(false);
      setMessages(data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  /* scroll to bottom when chat changes */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.id, sentReplies]);

  /* open thread + mark read */
  const openThread = async (msg) => {
    setSelected(msg);
    setReplyText('');
    if (!msg.isRead) {
      try {
        await messageService.markAsRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      } catch { /* silent */ }
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  /* send reply */
  const handleSend = async () => {
    if (!selected || !replyText.trim() || sending) return;
    const text = replyText.trim();
    setSending(true);
    try {
      await messageService.replyToMessage(selected.id, text);
      setSentReplies((prev) => ({
        ...prev,
        [selected.id]: [...(prev[selected.id] || []), { text, time: new Date().toISOString() }],
      }));
      setReplyText('');
    } catch {
      alert('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  /* offer response */
  const handleOfferResponse = async (action, counterAmount, counterMsg) => {
    if (!selected || offerResponding) return;
    setOfferResponding(true);
    try {
      await messageService.respondToOffer({
        recipientId: selected.senderId,
        cueId: selected.cueId,
        action,
        counterAmount: counterAmount || null,
        message: counterMsg || '',
      });
      // Add a local "sent" indicator in the reply list
      const labels = { accepted: 'Offer accepted ✓', rejected: 'Offer declined ✗', counter: `Counter offer sent: €${counterAmount?.toFixed(2)}` };
      setSentReplies((prev) => ({
        ...prev,
        [selected.id]: [...(prev[selected.id] || []), { text: labels[action] || 'Response sent', time: new Date().toISOString() }],
      }));
    } catch {
      alert('Failed to send response. Please try again.');
    } finally {
      setOfferResponding(false);
    }
  };

  /* delete */
  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messageService.deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      if (selected?.id === msgId) setSelected(null);
    } catch {
      alert('Could not delete. Try again.');
    }
  };

  /* Enter to send, Shift+Enter = newline */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* auto-grow textarea */
  const handleInputChange = (e) => {
    setReplyText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  /* filtered + sorted list */
  const filtered = messages
    .filter((m) => {
      if (filterUnread && m.isRead) return false;
      if (!searchTerm) return true;
      const t = searchTerm.toLowerCase();
      return (
        m.senderName.toLowerCase().includes(t) ||
        (m.subject || '').toLowerCase().includes(t) ||
        m.content.toLowerCase().includes(t)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount    = messages.filter((m) => !m.isRead).length;
  const sessionReplies = selected ? (sentReplies[selected.id] || []) : [];
  const chatOpen       = !!selected;

  // Determine if the selected message is an offer-type
  const offerData = selected ? parseOfferContent(selected.content) : null;
  const isOfferMsg = selected?.messageType === 'offer' && offerData?.type === 'offer';
  const isResponseMsg = ['accepted', 'rejected', 'counter_offer'].includes(selected?.messageType);

  // Whether the current user already responded (has session replies)
  const alreadyResponded = sessionReplies.length > 0;

  return (
    <div className={`msng-root${chatOpen ? ' chat-open' : ''}`}>

      {/* ════════ LEFT PANEL — thread list ════════ */}
      <aside className="msng-sidebar">

        {/* header */}
        <div className="msng-sidebar-header">
          <div className="msng-sidebar-title-row">
            {onBack && (
              <button className="msng-back-btn" onClick={onBack} type="button" aria-label="Back">
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="msng-sidebar-title">
              Messages
              {unreadCount > 0 && <span className="msng-unread-badge">{unreadCount}</span>}
            </span>
          </div>

          {/* search */}
          <div className="msng-search-wrap">
            <Search size={14} className="msng-search-icon" />
            <input
              className="msng-search-input"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="msng-search-clear" onClick={() => setSearchTerm('')} type="button">
                <X size={12} />
              </button>
            )}
          </div>

          {/* filter pills */}
          <div className="msng-filter-row">
            <button
              type="button"
              className={`msng-filter-pill${!filterUnread ? ' active' : ''}`}
              onClick={() => setFilterUnread(false)}
            >All</button>
            <button
              type="button"
              className={`msng-filter-pill${filterUnread ? ' active' : ''}`}
              onClick={() => setFilterUnread(true)}
            >
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          </div>
        </div>

        {/* list */}
        <div className="msng-thread-list">
          {loading ? (
            <div className="msng-loading"><div className="msng-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="msng-list-empty">
              <InboxIcon size={26} />
              <p>{searchTerm ? 'No results' : 'No messages'}</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <ThreadItem
                key={msg.id}
                message={msg}
                active={selected?.id === msg.id}
                onClick={() => openThread(msg)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ════════ RIGHT PANEL — chat ════════ */}
      <main className="msng-chat">
        {!selected ? (
          <EmptyPanel />
        ) : (
          <>
            {/* chat header */}
            <div className="msng-chat-header">
              <Avatar name={selected.senderName} size="md" />
              <div className="msng-chat-header-info">
                <span className="msng-chat-header-name">{selected.senderName}</span>
                {selected.subject && (
                  <span className="msng-chat-header-sub">Re: {selected.subject}</span>
                )}
              </div>
              {isOfferMsg && (
                <span className="msng-listing-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                  🔨 Bid Offer
                </span>
              )}
              {isResponseMsg && (
                <span className="msng-listing-badge">Offer Response</span>
              )}
              {!isOfferMsg && !isResponseMsg && selected.cueId && (
                <span className="msng-listing-badge">About a listing</span>
              )}
              <div className="msng-chat-header-actions">
                <button
                  className="msng-icon-btn msng-delete-btn"
                  onClick={() => handleDelete(selected.id)}
                  type="button"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="msng-icon-btn msng-close-btn"
                  onClick={() => setSelected(null)}
                  type="button"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* bubbles */}
            <div className="msng-chat-body">
              <div className="msng-date-divider">
                <span>
                  {new Date(selected.createdAt).toLocaleDateString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>

              {/* Offer or regular message bubble */}
              {isOfferMsg ? (
                <OfferCard
                  data={offerData}
                  time={formatBubbleTime(selected.createdAt)}
                  senderName={selected.senderName}
                  onAccept={!alreadyResponded ? () => handleOfferResponse('accepted') : null}
                  onReject={!alreadyResponded ? () => handleOfferResponse('rejected') : null}
                  onCounter={!alreadyResponded ? (amt, msg) => handleOfferResponse('counter', amt, msg) : null}
                  responding={offerResponding}
                />
              ) : isResponseMsg ? (
                <ResponseCard
                  messageType={selected.messageType}
                  data={offerData}
                  time={formatBubbleTime(selected.createdAt)}
                  senderName={selected.senderName}
                />
              ) : (
                <Bubble
                  text={selected.content}
                  sent={false}
                  time={formatBubbleTime(selected.createdAt)}
                  senderName={selected.senderName}
                />
              )}

              {/* replies sent this session */}
              {sessionReplies.map((r, i) => (
                <Bubble
                  key={i}
                  text={r.text}
                  sent={true}
                  time={formatBubbleTime(r.time)}
                  senderName="You"
                />
              ))}

              <div ref={chatEndRef} />
            </div>

            {/* input bar — hide for offer messages that were already responded */}
            {(!isOfferMsg || alreadyResponded) && !isResponseMsg && (
              <div className="msng-input-bar">
                <div className="msng-input-wrap">
                  <textarea
                    ref={inputRef}
                    className="msng-input"
                    placeholder="Aa"
                    value={replyText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>
                <button
                  type="button"
                  className={`msng-send-btn${replyText.trim() ? ' active' : ''}`}
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  aria-label="Send"
                >
                  {sending
                    ? <div className="msng-spinner msng-spinner-sm" />
                    : <Send size={18} />
                  }
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
