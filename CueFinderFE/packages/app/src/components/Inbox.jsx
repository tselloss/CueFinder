import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, Trash2, ArrowLeft, Inbox as InboxIcon, X } from 'lucide-react';
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
            {message.subject ? `${message.subject}: ` : ''}{message.content}
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
              {selected.cueId && (
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

              {/* original received message */}
              <Bubble
                text={selected.content}
                sent={false}
                time={formatBubbleTime(selected.createdAt)}
                senderName={selected.senderName}
              />

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

            {/* input bar */}
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
          </>
        )}
      </main>
    </div>
  );
}
