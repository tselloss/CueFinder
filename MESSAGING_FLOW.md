# CueFinder Messaging Flow - Complete Process

## 1. **Sending Original Message** 

### Frontend (Inbox.js)
```
User composes message → SendMessageRequest {
  recipientId: int,
  cueId?: int (optional - for listing inquiries),
  subject: string,
  content: string,
  messageType: string
}
↓
POST /api/messages
```

### Backend (MessageService.cs)
```
1. Verify sender exists and is not self-messaging
2. Verify recipient exists
3. If CueId provided:
   - Verify cue exists
   - Verify recipient is the listing owner
4. Auto-generate subject if empty (e.g., "Inquiry about: BK Rush")
5. Create Message record in database
6. Map to MessageResponseDto (includes sender/recipient names)
7. Send SignalR notification to recipient (real-time)
8. Return message to frontend
```

### Database Schema
```sql
Message {
  Id: int (PK),
  SenderId: int (FK Users),
  RecipientId: int (FK Users),
  CueId: int? (FK Cues),
  Subject: string,
  Content: string,
  MessageType: string ('message', 'inquiry', etc.),
  IsRead: bool,
  ReadAt: DateTime?,
  CreatedAt: DateTime
}
```

---

## 2. **Viewing Messages (Inbox)**

### Frontend (Inbox.js)
```
User clicks "Inbox" → GET /api/messages/inbox
↓
Display messages received by current user (sorted by newest first)
```

### Backend Flow
```
GET /api/messages/inbox?unreadOnly=false
↓
Query all messages where RecipientId = currentUserId
↓
Include sender/recipient data
↓
Return MessageResponseDto[] {
  id, senderId, senderName, recipientId, recipientName,
  cueId, subject, content, messageType, isRead, readAt, createdAt
}
```

---

## 3. **Replying to Message** ⭐ **KEY PROCESS**

### Step 1: User Selects Message
```
Frontend: User clicks on a message in inbox
↓
selectedMessage = MessageResponseDto {
  id: 5,
  senderId: 2,           // Original sender (John)
  senderName: "John",
  recipientId: 1,        // Current user
  recipientName: "Mike",
  cueId: 6,
  subject: "Inquiry about: BK Rush",
  content: "Is this still available?",
  isRead: false,
  createdAt: "2026-01-13..."
}
```

### Step 2: Get Original Sender Info
```
The selectedMessage ALREADY contains:
- senderId: Who sent the original message
- senderName: Name of original sender
- All other context (cueId, subject, etc.)

Frontend uses this to:
- Display: "Reply to: John"
- Know who to send reply to
- Maintain conversation context
```

### Step 3: User Types Reply
```
Frontend State:
replyBody = "Yes, available. What's your offer?"
```

### Step 4: Send Reply
```
POST /api/messages/{originalMessageId}/reply
Body: ReplyMessageRequest {
  content: "Yes, available. What's your offer?"
}
Header: Authorization: Bearer {jwt_token}
↓
Backend extracts: userId (from token) = 1 (Mike)
```

### Step 5: Backend Process
```
Backend MessageService.ReplyToMessageAsync(messageId=5, senderId=1, content="Yes..."):

1. Fetch original message (ID=5):
   - SenderId = 2 (John)
   - RecipientId = 1 (Mike - current user)
   - CueId = 6
   - Subject = "Inquiry about: BK Rush"

2. Verify authorization:
   - Check: senderId (1) == originalMessage.SenderId (2) OR
            senderId (1) == originalMessage.RecipientId (1) ✓
   - User IS part of conversation ✓

3. Determine recipient:
   - if (originalMessage.SenderId == senderId)
       recipient = originalMessage.RecipientId  // John is asking
   - else (originalMessage.RecipientId == senderId)
       recipient = originalMessage.SenderId      // Mike is replying
   - Result: recipientId = 2 (John)

4. Create reply message using SendMessageAsync():
   SendMessageRequest {
     recipientId: 2,     // Send to original sender
     cueId: 6,           // Keep conversation in context
     subject: "Re: Inquiry about: BK Rush",  // Add "Re:" prefix
     content: "Yes, available. What's your offer?",
     messageType: "message"
   }

5. SendMessageAsync creates new Message record:
   Message {
     id: 6,
     senderId: 1,        // Mike (current user)
     recipientId: 2,     // John (original sender)
     cueId: 6,           // Same listing
     subject: "Re: Inquiry about: BK Rush",
     content: "Yes, available. What's your offer?",
     messageType: "message",
     isRead: false,
     createdAt: DateTime.UtcNow
   }

6. Send SignalR notification:
   hubContext.Clients.Group("user-2").SendAsync("ReceiveMessage", replyDto)
   - Notifies John in real-time that he received a reply

7. Return MessageResponseDto to frontend
```

### Step 6: Frontend Updates
```
Frontend:
1. Clear replyBody = ""
2. Close reply modal
3. Reload inbox
4. Show success message
5. Display reply in message thread
```

---

## 4. **Message Thread (Conversation)**

### Frontend: View Full Conversation
```
GET /api/messages/thread/{otherUserId}?cueId=6
↓
Returns all messages between current user and otherUserId for cueId 6
↓
Ordered by CreatedAt (chronological)
```

### Messages in Thread for Cue #6 (BK Rush):
```
1. Message (ID=5) - John → Mike: "Is this still available?"
2. Message (ID=6) - Mike → John: "Yes, available. What's your offer?"
3. Message (ID=7) - John → Mike: "Can you send more photos?"
4. Message (ID=8) - Mike → John: "Sure! Check your email."
```

---

## 5. **Deleting a Message**

### Frontend
```
User clicks delete button
↓
handleDelete(messageId)
```

### Backend
```
DELETE /api/messages/{id}
Body: none
Header: Authorization: Bearer {jwt_token}

MessageService.DeleteMessageAsync(messageId=5, userId=1):
1. Find message
2. Verify userId is sender OR recipient
3. Delete message
4. Return 204 No Content
```

---

## 6. **Marking Message as Read**

### Frontend
```
POST /api/messages/{id}/read
```

### Backend
```
MarkAsReadAsync(messageId, userId):
1. Find message
2. Verify userId is recipient
3. Set IsRead = true, ReadAt = DateTime.UtcNow
4. Return 204 No Content
```

---

## Summary: What's Needed for Replying

| Component | Data Required | Source |
|-----------|---------------|--------|
| **Original Message ID** | messageId (5) | URL/UI selection |
| **Current User ID** | senderId (1) | JWT token claims |
| **Reply Content** | content string | TextArea input |
| **Original Sender ID** | senderId (2) | Already in selectedMessage |
| **Conversation Context** | cueId (6), subject | Already in selectedMessage |
| **Authorization** | JWT token | Local storage |

### **Key Insight:**
- The **original message object contains all info needed** to determine who to send the reply to
- Frontend just needs: messageId + replyContent + currentUserId (from token)
- Backend looks up original message and automatically figures out recipient
- No manual user selection of recipient needed - it's derived from original message

---

## API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/messages | Send new message | ✓ |
| GET | /api/messages/inbox | Get received messages | ✓ |
| GET | /api/messages/sent | Get sent messages | ✓ |
| GET | /api/messages/thread/{userId} | Get conversation thread | ✓ |
| POST | /api/messages/{id}/reply | Reply to message | ✓ |
| DELETE | /api/messages/{id} | Delete message | ✓ |
| POST | /api/messages/{id}/read | Mark as read | ✓ |

---

## Real-Time Features (SignalR)

### Message Hub Groups
```
- When user receives message → Joins group "user-{userId}"
- When reply sent → Hub sends to group "user-{recipientId}"
- Real-time notification: "ReceiveMessage" event with MessageResponseDto
```

### Frontend SignalR Setup
```javascript
connection.on("ReceiveMessage", (message) => {
  // Update inbox immediately without page refresh
  setMessages(prev => [message, ...prev]);
  // Play notification sound
  // Show toast alert
});
```
