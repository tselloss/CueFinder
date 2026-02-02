import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mail, ArrowLeft, Trash2, X, Loader2, Clock } from 'lucide-react';
import MaterialInput from './MaterialInput';
import * as messageService from '../api/messageService';
import * as authService from '../api/authService';
import Badge from './Badge';

// Helper function to format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function Inbox({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInbox();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      // Verify current user context
      authService.getCurrent();
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadInbox = async () => {
    setLoading(true);
    try {
      const data = await messageService.getInbox(false);
      setMessages(data || []);
      const unread = (data || []).filter(m => !m.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error loading inbox:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyBody.trim()) return;

    setSending(true);
    try {
      await messageService.replyToMessage(selectedMessage.id, replyBody);
      
      setReplyBody('');
      setSelectedMessage(null);
      loadInbox();
      alert('Reply sent successfully!');
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageService.deleteMessage(messageId);
      loadInbox();
      setSelectedMessage(null);
      alert('Message deleted successfully!');
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await messageService.markAsRead(messageId);
      loadInbox();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const filteredMessages = messages
    .filter(m => {
      if (filterUnread && m.isRead) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        m.senderName.toLowerCase().includes(term) ||
        m.subject.toLowerCase().includes(term) ||
        m.content.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-muted-foreground">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex gap-4 items-center mb-8">
        <Button variant="outline" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-500">{messages.length} messages</p>
          </div>
          {unreadCount > 0 && (
            <div className="ml-auto">
              <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-sm font-semibold px-3 py-1 rounded-full border border-red-200">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {unreadCount} {unreadCount === 1 ? 'Unread' : 'Unread'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-8 space-y-3">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1">
            <MaterialInput
              placeholder="Search by sender, subject, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant={filterUnread ? 'default' : 'outline'}
            onClick={() => setFilterUnread(!filterUnread)}
            className="sm:w-auto"
          >
            {filterUnread ? `Unread (${unreadCount})` : 'All Messages'}
          </Button>
        </div>
        {(searchTerm || filterUnread) && (
          <p className="text-xs text-gray-500">
            Showing {filteredMessages.length} of {messages.length} messages
          </p>
        )}
      </div>

      {/* Messages List */}
      <div className="space-y-3 max-w-3xl">
        {filteredMessages.length === 0 ? (
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Mail className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base font-medium">
                  {searchTerm ? 'No messages match your search' : 'No messages yet'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm && 'Try a different search term'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all border-l-4 hover:shadow-md ${
                message.isRead
                  ? 'bg-white border-l-transparent border border-gray-200 hover:border-gray-300'
                  : 'bg-gradient-to-r from-blue-50 to-white border-l-blue-600 border border-blue-200'
              }`}
              onClick={() => {
                if (!message.isRead) handleMarkAsRead(message.id);
                setSelectedMessage(message);
              }}
            >
              <CardContent className="p-4">
                <div className="flex gap-3 items-start justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex gap-2 items-center">
                      <p className="font-semibold text-gray-900 truncate">
                        {message.senderName}
                      </p>
                      {!message.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">
                      {message.subject}
                    </p>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex gap-2 items-center pt-2">
                      {!message.isRead && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">
                          New
                        </span>
                      )}
                      {message.cueId && (
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded">
                          About Listing
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white text-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto z-[1000] border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedMessage.senderName}
                </h3>
                <div className="flex gap-2 items-center mt-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Subject & Meta */}
              <div className="space-y-2">
                <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">Subject</p>
                <p className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</p>
              </div>

              {selectedMessage.cueId && (
                <div>
                  <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Related to a listing
                  </span>
                </div>
              )}

              {/* Message Content */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 space-y-3">
                <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">Message</p>
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Reply Box */}
              <div className="space-y-5 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-4">Reply to Message</p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Your Message</label>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your reply..."
                      rows={6}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleReply}
                      disabled={sending || !replyBody.trim()}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {sending ? 'Sending...' : 'Reply'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 font-medium py-3 rounded-lg transition-all"
                    >
                      Cancel
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="gap-2 text-red-600 border border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300 font-medium py-3 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
