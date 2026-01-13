import React, { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, Card, CardBody, Layer, TextArea, Spinner } from 'grommet';
import { Close, Search, MailOption, Previous, Trash } from 'grommet-icons';
import Badge from './Badge';
import * as messageService from '../api/messageService';
import * as authService from '../api/authService';

export default function Inbox({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadInbox();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = authService.getCurrent();
      setCurrentUserId(user?.id);
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
      <Box fill align="center" justify="center">
        <Spinner />
        <Text>Loading inbox...</Text>
      </Box>
    );
  }

  return (
    <Box fill background="background" pad="medium">
      {/* Header */}
      <Box direction="row" gap="medium" align="center" margin={{ bottom: 'medium' }}>
        <Button icon={<Previous />} onClick={onBack} />
        <Box direction="row" gap="small" align="center">
          <MailOption size="large" />
          <Heading level="2" margin="none">Inbox</Heading>
          {unreadCount > 0 && (
            <Badge background="status-critical" pad="small" round="full" value={unreadCount} />
          )}
        </Box>
      </Box>

      {/* Filter & Search */}
      <Box direction="row" gap="small" margin={{ bottom: 'medium' }} align="center">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            flex: 1,
            maxWidth: '300px'
          }}
        />
        <Button
          label={filterUnread ? `Unread (${unreadCount})` : 'All'}
          onClick={() => setFilterUnread(!filterUnread)}
          primary={filterUnread}
        />
      </Box>

      {/* Messages List */}
      <Box gap="small" style={{ maxWidth: '800px' }}>
        {filteredMessages.length === 0 ? (
          <Card background="white">
            <CardBody pad="large" align="center">
              <Text size="large" color="text-weak">
                {searchTerm ? 'No messages match your search' : 'No messages yet'}
              </Text>
            </CardBody>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card
              key={message.id}
              background={message.isRead ? 'white' : 'light-1'}
              style={{ cursor: 'pointer', borderLeft: message.isRead ? 'none' : '4px solid #7D4CDB' }}
              onClick={() => {
                if (!message.isRead) handleMarkAsRead(message.id);
                setSelectedMessage(message);
              }}
            >
              <CardBody pad="medium" gap="small">
                <Box direction="row" gap="small" align="start" justify="between">
                  <Box gap="xsmall" flex="grow">
                    <Box direction="row" gap="small" align="center">
                      <Text weight="bold" size="large">
                        {message.senderName}
                      </Text>
                      {!message.isRead && (
                        <Badge background="status-warning" label="New" pad="xsmall" round="small" />
                      )}
                      {message.cueId && (
                        <Badge background="light-4" label="About Listing" pad="xsmall" round="small" />
                      )}
                    </Box>
                    <Text weight="bold" truncate>
                      {message.subject}
                    </Text>
                    <Text color="dark-4" size="small" truncate>
                      {message.content}
                    </Text>
                  </Box>
                  <Text size="small" color="text-weak">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </Text>
                </Box>
              </CardBody>
            </Card>
          ))
        )}
      </Box>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Layer onEsc={() => setSelectedMessage(null)} onClickOutside={() => setSelectedMessage(null)}>
          <Box pad="medium" gap="medium" width="large" overflow="auto">
            {/* Header */}
            <Box direction="row" justify="between" align="center">
              <Box flex="grow">
                <Heading level="4" margin="none">
                  {selectedMessage.senderName}
                </Heading>
                <Text size="small" color="text-weak">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </Text>
              </Box>
              <Box direction="row" gap="small">
                <Button 
                  icon={<Trash color="status-critical" />} 
                  onClick={() => handleDelete(selectedMessage.id)}
                  tip="Delete message"
                />
                <Button icon={<Close />} onClick={() => setSelectedMessage(null)} />
              </Box>
            </Box>

            {/* Subject & Meta */}
            <Box gap="xsmall">
              <Text weight="bold">Subject</Text>
              <Text>{selectedMessage.subject}</Text>
            </Box>

            {selectedMessage.cueId && (
              <Box gap="xsmall">
                <Badge background="light-4" label="Related to a listing" pad="xsmall" round="small" />
              </Box>
            )}

            {/* Message Content */}
            <Card background="light-1">
              <CardBody pad="medium">
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.content}
                </Text>
              </CardBody>
            </Card>

            {/* Reply Box */}
            <Box gap="small" border={{ top: true, color: 'light-4' }} pad={{ top: 'medium' }}>
              <Text weight="bold">Reply</Text>
              <TextArea
                placeholder="Type your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
              />
              <Box direction="row" gap="small" justify="end">
                <Button label="Cancel" onClick={() => setSelectedMessage(null)} />
                <Button
                  label={sending ? 'Sending...' : 'Reply'}
                  primary
                  onClick={handleReply}
                  disabled={sending || !replyBody.trim()}
                />
              </Box>
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
}
