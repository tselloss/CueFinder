import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Trash2, Send, Search, Filter } from 'lucide-react';
import * as messageService from '../api/messageService';
import * as authService from '../api/authService';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

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
      alert('✅ Your reply has been sent successfully!');
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('❌ Unable to send reply. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this message? This action cannot be undone.')) return;

    try {
      await messageService.deleteMessage(messageId);
      loadInbox();
      setSelectedMessage(null);
      alert('✅ Message deleted successfully!');
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('❌ Unable to delete message. Please try again.');
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold mt-2">Inbox</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filter & Search */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filterUnread ? 'default' : 'outline'}
            onClick={() => setFilterUnread(!filterUnread)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {filterUnread ? `Unread (${unreadCount})` : 'All'}
          </Button>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg text-muted-foreground">
                  {searchTerm ? 'No messages match your search' : 'No messages yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  !message.isRead ? 'border-l-4 border-l-primary bg-card/80' : ''
                }`}
                onClick={() => {
                  if (!message.isRead) handleMarkAsRead(message.id);
                  setSelectedMessage(message);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">
                          {message.senderName}
                        </span>
                        {!message.isRead && (
                          <Badge variant="warning" className="text-xs">New</Badge>
                        )}
                        {message.cueId && (
                          <Badge variant="outline" className="text-xs">About Listing</Badge>
                        )}
                      </div>
                      <p className="font-medium truncate">
                        {message.subject}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={true} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <DialogTitle className="text-xl">
                    {selectedMessage.senderName}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Subject */}
              <div>
                <h4 className="font-semibold mb-1">Subject</h4>
                <p>{selectedMessage.subject}</p>
              </div>

              {/* Meta */}
              {selectedMessage.cueId && (
                <Badge variant="outline">Related to a listing</Badge>
              )}

              {/* Message Content */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </CardContent>
              </Card>

              {/* Reply Box */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold">Reply</h4>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedMessage(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReply}
                disabled={sending || !replyBody.trim()}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Reply
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedMessage.id)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
