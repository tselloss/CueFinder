import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mail, ArrowLeft, Trash2, X, Loader2 } from 'lucide-react';
import MaterialInput from './MaterialInput';
import * as messageService from '../api/messageService';
import * as authService from '../api/authService';
import Badge from './Badge';

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
      <div className="flex gap-4 items-center mb-6">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-2 items-center">
          <Mail className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Inbox</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-2 mb-6 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <MaterialInput
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant={filterUnread ? 'default' : 'outline'}
          onClick={() => setFilterUnread(!filterUnread)}
        >
          {filterUnread ? `Unread (${unreadCount})` : 'All'}
        </Button>
      </div>

      {/* Messages List */}
      <div className="space-y-3 max-w-2xl">
        {filteredMessages.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg">
                {searchTerm ? 'No messages match your search' : 'No messages yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all border-l-4 ${
                message.isRead
                  ? 'bg-white border-l-transparent'
                  : 'bg-blue-50 border-l-purple-600'
              }`}
              onClick={() => {
                if (!message.isRead) handleMarkAsRead(message.id);
                setSelectedMessage(message);
              }}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex gap-2 items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 items-center mb-1">
                      <p className="font-bold text-base">
                        {message.senderName}
                      </p>
                      {!message.isRead && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded">
                          New
                        </span>
                      )}
                      {message.cueId && (
                        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded">
                          About Listing
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm truncate">
                      {message.subject}
                    </p>
                    <p className="text-muted-foreground text-sm truncate">
                      {message.content}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
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
            className="bg-[#0a0e1a] text-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto z-[1000] border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start p-6 pb-4 border-b border-gray-700">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {selectedMessage.senderName}
                </h3>
                <p className="text-sm text-gray-400">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-500/20 -mt-1"
                  title="Delete message"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 -mt-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {/* Subject & Meta */}
              <div className="mb-4 space-y-2">
                <p className="font-bold text-sm text-white">Subject</p>
                <p className="text-gray-300">{selectedMessage.subject}</p>
              </div>

              {selectedMessage.cueId && (
                <div className="mb-4">
                  <span className="bg-gray-700 text-gray-200 text-xs font-semibold px-3 py-1 rounded">
                    Related to a listing
                  </span>
                </div>
              )}

              {/* Message Content */}
              <div className="bg-[#141824] rounded-lg p-4 mb-6 border border-gray-700">
                <p className="whitespace-pre-wrap text-gray-300">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Reply Box */}
              <div className="space-y-4 pt-6 border-t border-gray-700">
                <p className="font-semibold text-base text-white mb-3">Reply</p>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Your Message</label>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type your reply..."
                    rows={6}
                    required
                    className="w-full px-4 py-3 bg-[#141824] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={handleReply}
                    disabled={sending || !replyBody.trim()}
                    className="gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {sending ? 'Sending...' : 'Reply'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedMessage(null)}
                    className="w-full text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700 hover:border-gray-600 font-medium py-3 rounded-lg transition-all"
                  >
                    Cancel
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
