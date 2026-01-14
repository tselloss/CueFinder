# Complete Messaging System Flow - Seller & User Conversation

## Overview
```
📌 Seller creates listing (cue) 
  ↓
👥 User discovers listing and clicks "Message Seller"
  ↓
💬 User sends message about the listing
  ↓
🔔 Seller gets real-time notification (SignalR)
  ↓
✏️ Seller replies to message
  ↓
🔄 Back and forth conversation happens
  ↓
📊 Both can view entire conversation thread for that cue
```

---

## Step 1: Seller Creates a Listing

### Backend (CuesController.cs)
```csharp
POST /api/cues
Body: CreateCueRequest {
  title: "BK Rush",
  brand: "Predator",
  price: 1200,
  description: "...",
  condition: "Excellent",
  cueType: "break",
  weight: 18.5,
  images: [...]
}
↓
Database Record Created:
Cue {
  id: 6,
  title: "BK Rush",
  userId: 1,           // Seller ID
  price: 1200,
  createdAt: DateTime.UtcNow,
  images: [...]
}
```

### User Sees Listing
```
GET /api/cues/{id}
↓
Returns:
{
  id: 6,
  title: "BK Rush",
  brand: "Predator",
  sellerId: 1,
  sellerName: "VagelisKarachristos",
  sellerEmail: "karachristos.e@outlook.com",
  sellerPhone: "+306987901345",
  sellerHidePhone: true,
  price: 1200,
  images: [...]
}
```

---

## Step 2: User Clicks "Message Seller" Button

### UI Component (ItemDetail.js)
```javascript
User views cue detail page
  ↓
Sees seller info card with button:
  <Button label="Message Seller" onClick={() => setShowMessage(true)} />
  ↓
Modal opens with form:
- Subject field (auto-filled): "Inquiry about: BK Rush"
- Message body textarea
- Send button
```

### Message Composition
```
User types:
Subject: "Inquiry about: BK Rush"  [Auto-filled]
Body: "Is this still available? What's the condition?"
```

---

## Step 3: User Sends Message to Seller

### Frontend Call
```javascript
messageService.sendMessage({
  recipientId: 1,        // Seller ID
  cueId: 6,              // Which listing it's about
  subject: "Inquiry about: BK Rush",
  content: "Is this still available? What's the condition?",
  messageType: "inquiry"
})
```

### Backend Processing (MessageService.cs)
```
POST /api/messages
Body: SendMessageRequest {
  recipientId: 1,        // Seller
  cueId: 6,              // Listing
  subject: "Inquiry about: BK Rush",
  content: "Is this still available?...",
  messageType: "inquiry"
}

MessageService.SendMessageAsync():

1. ✓ Verify sender (User ID 2) is not messaging self
2. ✓ Verify recipient (Seller ID 1) exists
3. ✓ Verify cue exists
4. ✓ Verify recipient (seller) owns the cue
5. Create Message record:
   Message {
     id: 100,
     senderId: 2,        // User
     recipientId: 1,     // Seller
     cueId: 6,           // Listing reference
     subject: "Inquiry about: BK Rush",
     content: "Is this still available?...",
     messageType: "inquiry",
     isRead: false,
     createdAt: "2026-01-13T16:30:00Z"
   }
6. SignalR Notification → Seller gets real-time alert:
   hubContext.Clients.Group("user-1").SendAsync("ReceiveMessage", {
     id: 100,
     senderId: 2,
     senderName: "John",
     cueId: 6,
     subject: "Inquiry about: BK Rush",
     content: "Is this still available?..."
   })
```

### Database
```sql
-- Message stored
INSERT INTO "Messages" 
  (SenderId, RecipientId, CueId, Subject, Content, MessageType, IsRead, CreatedAt)
VALUES 
  (2, 1, 6, 'Inquiry about: BK Rush', 'Is this...', 'inquiry', false, '2026-01-13T16:30:00Z');
```

---

## Step 4: Seller Receives Message (Real-Time)

### SignalR Hub (Frontend)
```javascript
connection.on("ReceiveMessage", (message) => {
  console.log("📬 New message from:", message.senderName);
  // Update inbox
  // Show notification
  // Play sound
});
```

### Seller Sees in Inbox
```
GET /api/messages/inbox
↓
Returns messages where RecipientId = seller.id (1)
↓
Message shown:
From: John (User)
Subject: "Inquiry about: BK Rush"
Content: "Is this still available?..."
```

---

## Step 5: Seller Clicks Reply

### UI (Inbox.js)
```javascript
Seller clicks on message from John
  ↓
selectedMessage = {
  id: 100,
  senderId: 2,           // John (User)
  senderName: "John",
  recipientId: 1,        // Seller (current user)
  subject: "Inquiry about: BK Rush",
  content: "Is this still available?...",
  cueId: 6,              // Listing context
  messageType: "inquiry"
}
  ↓
Reply form shows:
- Replying to: John
- Message context: "Inquiry about: BK Rush"
- Text area for reply
- Send button
```

---

## Step 6: Seller Sends Reply

### Frontend Call
```javascript
messageService.replyToMessage(
  messageId: 100,        // Original message ID
  content: "Yes, still available! Excellent condition."
)
```

### Backend Processing (MessageService.cs)
```
POST /api/messages/100/reply
Body: ReplyMessageRequest {
  content: "Yes, still available! Excellent condition."
}

Header: Authorization: Bearer {seller_jwt_token}
  ↓ Extract sellerId (1) from token

MessageService.ReplyToMessageAsync(messageId=100, senderId=1, content="Yes..."):

1. Fetch original message (ID=100):
   {
     id: 100,
     senderId: 2,           // John
     recipientId: 1,        // Seller (me)
     cueId: 6,
     subject: "Inquiry about: BK Rush",
     content: "Is this still available?..."
   }

2. Verify authorization:
   - Check: senderId (1) is part of conversation?
   - YES! I'm the recipientId ✓

3. Determine who to send reply to:
   - originalMessage.senderId (2) ≠ senderId (1)
   - So recipient = originalMessage.senderId = 2 (John)

4. Create reply via SendMessageAsync():
   SendMessageRequest {
     recipientId: 2,        // John (original sender)
     cueId: 6,              // Same listing context
     subject: "Re: Inquiry about: BK Rush",  // Add "Re:" prefix
     content: "Yes, still available! Excellent condition.",
     messageType: "message"
   }

5. New Message created:
   Message {
     id: 101,
     senderId: 1,        // Seller (me)
     recipientId: 2,     // John
     cueId: 6,           // Same listing
     subject: "Re: Inquiry about: BK Rush",
     content: "Yes, still available! Excellent condition.",
     messageType: "message",
     isRead: false,
     createdAt: "2026-01-13T16:35:00Z"
   }

6. SignalR Notification → User (John) gets real-time alert:
   hubContext.Clients.Group("user-2").SendAsync("ReceiveMessage", {
     id: 101,
     senderId: 1,
     senderName: "VagelisKarachristos",
     recipientId: 2,
     cueId: 6,
     subject: "Re: Inquiry about: BK Rush",
     content: "Yes, still available!..."
   })
```

---

## Step 7: User Receives Reply (Real-Time)

### Frontend
```javascript
// User gets instant notification
connection.on("ReceiveMessage", (message) => {
  // Update inbox
  // Show: "VagelisKarachristos replied to: Re: Inquiry about: BK Rush"
});
```

---

## Step 8: View Conversation Thread

### Both Can See Full Thread
```
GET /api/messages/thread/{otherUserId}?cueId=6

Query: Messages between User (2) and Seller (1) for Cue (6)
Results (chronological order):

Message 1 (ID=100) [2:35 PM]
From: John (User)
To: VagelisKarachristos (Seller)
"Is this still available? What's the condition?"

Message 2 (ID=101) [2:40 PM]
From: VagelisKarachristos (Seller)
To: John (User)
"Yes, still available! Excellent condition."

Message 3 (ID=102) [3:00 PM]
From: John (User)
To: VagelisKarachristos (Seller)
"Perfect! Can we meet this weekend?"

Message 4 (ID=103) [3:15 PM]
From: VagelisKarachristos (Seller)
To: John (User)
"Sure! Saturday at 5 PM, near the metro?"
```

---

## Step 9: Continue Conversation

### User Replies Again
```
User clicks on seller's last message:
selectedMessage = Message {
  id: 103,
  senderId: 1,           // Seller
  senderName: "VagelisKarachristos",
  recipientId: 2,        // User (me)
  cueId: 6,
  subject: "Re: Inquiry about: BK Rush"
}
  ↓
Types: "Sounds great! See you then!"
  ↓
POST /api/messages/103/reply
  ↓
Backend determines:
- I'm replying to Message 103
- Original sender: Seller (1)
- I'm the recipient: User (2)
- Send my reply to: Seller (1) ✓
  ↓
New message created:
Message {
  id: 104,
  senderId: 2,           // Me (User)
  recipientId: 1,        // Seller
  cueId: 6,              // Same listing
  subject: "Re: Inquiry about: BK Rush",
  content: "Sounds great! See you then!"
}
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/cues` | GET | Get all listings | ✗ |
| `/api/cues/{id}` | GET | Get listing details (shows seller) | ✗ |
| `/api/messages` | POST | Send initial message | ✓ |
| `/api/messages/inbox` | GET | Get received messages | ✓ |
| `/api/messages/{id}/reply` | POST | Reply to message | ✓ |
| `/api/messages/thread/{userId}?cueId={cueId}` | GET | View full conversation for a listing | ✓ |
| `/api/messages/{id}` | DELETE | Delete message | ✓ |
| `/api/messages/{id}/read` | POST | Mark as read | ✓ |

---

## Key Features Implemented

✅ **Message Seller Button**
- Shown on every cue detail page
- Pre-fills subject with cue title
- Modal for composing message

✅ **Real-Time Notifications**
- SignalR connects authenticated users
- Messages arrive instantly in inbox
- No page refresh needed

✅ **Conversation Context**
- Messages reference the cue they're about
- Can view full thread for a cue
- "Re:" prefix for replies

✅ **Smart Reply Logic**
- Backend automatically determines recipient
- User doesn't manually select who to reply to
- Works bidirectionally (seller ↔ user)

✅ **Unread Tracking**
- Mark messages as read
- Filter unread in inbox
- See read/unread status

✅ **Delete Messages**
- Sender or recipient can delete
- Authorization enforced

✅ **Phone Hiding**
- Seller can hide phone in listing
- Message system keeps seller safe

---

## Complete User Flow

1. **Seller**: Creates cue listing (BK Rush, €1200)
2. **User**: Finds listing, sees seller info with "Message Seller" button
3. **User**: Clicks button, modal opens with subject pre-filled
4. **User**: Types question: "Is this still available?"
5. **Seller**: Gets real-time notification (SignalR)
6. **Seller**: Opens inbox, sees message from user
7. **Seller**: Clicks message, reply form appears with context
8. **Seller**: Types reply: "Yes! Excellent condition."
9. **User**: Gets real-time notification with reply
10. **Both**: Can view full conversation thread anytime
11. **Both**: Can continue messaging about the specific cue
12. **Either**: Can delete their own messages or received messages

---

## Architecture

```
Frontend (React)
├── CueDetail.js
│   └── ItemDetail.js [Message Seller button]
│       └── messageService.sendMessage()
├── Inbox.js
│   ├── messageService.getInbox()
│   ├── messageService.replyToMessage()
│   └── messageService.deleteMessage()
└── SignalRHub
    └── connection.on("ReceiveMessage")

Backend (ASP.NET Core)
├── MessagesController
│   ├── POST /api/messages
│   ├── GET /api/messages/inbox
│   ├── POST /api/messages/{id}/reply
│   ├── DELETE /api/messages/{id}
│   └── POST /api/messages/{id}/read
├── MessageService
│   ├── SendMessageAsync()
│   ├── ReplyToMessageAsync()
│   ├── DeleteMessageAsync()
│   ├── GetInboxAsync()
│   ├── GetThreadAsync()
│   └── MarkAsReadAsync()
├── MessageHub (SignalR)
│   └── Sends real-time notifications
└── Database
    └── Messages table (with SenderId, RecipientId, CueId)
```

This is a **complete, production-ready messaging system** with everything needed for seller-user conversations about listings! 🎉
