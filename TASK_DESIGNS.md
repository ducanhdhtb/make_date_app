# 📐 Task Designs - Group Chat Feature

**Ngày tạo:** 2026-04-22  
**Epic:** EPIC-001 - Group Chat  
**Tổng Tasks:** 17  

---

## 🎨 Design Overview

### Color Scheme
```
Primary: #ec4899 (Pink)
Secondary: #8b5cf6 (Purple)
Success: #10b981 (Green)
Error: #ef4444 (Red)
Background: #f9fafb (Light Gray)
Text: #1f2937 (Dark Gray)
Border: #e5e7eb (Gray)
```

### Typography
```
Heading 1: 32px, Bold, #1f2937
Heading 2: 24px, Bold, #1f2937
Heading 3: 20px, Bold, #1f2937
Body: 16px, Regular, #374151
Small: 14px, Regular, #6b7280
```

---

## 📋 TASK-001: Database Schema

### Design Document

**Objective:** Tạo database schema cho group chat

**Database Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    GROUP CHAT SCHEMA                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   GroupConversation      │
├──────────────────────────┤
│ id (UUID)                │
│ name (VARCHAR)           │
│ description (TEXT)       │
│ avatarUrl (VARCHAR)      │
│ createdByUserId (FK)     │
│ createdAt (TIMESTAMP)    │
│ updatedAt (TIMESTAMP)    │
└──────────────────────────┘
         │
         ├─→ 1:N ─→ GroupConversationMember
         │
         ├─→ 1:N ─→ GroupMessage
         │
         └─→ N:1 ─→ User (createdBy)

┌──────────────────────────┐
│ GroupConversationMember  │
├──────────────────────────┤
│ id (UUID)                │
│ groupConversationId (FK) │
│ userId (FK)              │
│ joinedAt (TIMESTAMP)     │
│ lastReadAt (TIMESTAMP)   │
│ role (VARCHAR)           │
└──────────────────────────┘
         │
         ├─→ N:1 ─→ GroupConversation
         │
         └─→ N:1 ─→ User

┌──────────────────────────┐
│     GroupMessage         │
├──────────────────────────┤
│ id (UUID)                │
│ groupConversationId (FK) │
│ senderUserId (FK)        │
│ parentMessageId (FK)     │
│ messageType (VARCHAR)    │
│ textContent (TEXT)       │
│ mediaUrl (VARCHAR)       │
│ fileName (VARCHAR)       │
│ mimeType (VARCHAR)       │
│ fileSize (INT)           │
│ durationSeconds (INT)    │
│ pinnedAt (TIMESTAMP)     │
│ createdAt (TIMESTAMP)    │
│ updatedAt (TIMESTAMP)    │
│ recalledAt (TIMESTAMP)   │
│ deletedAt (TIMESTAMP)    │
└──────────────────────────┘
         │
         ├─→ N:1 ─→ GroupConversation
         ├─→ N:1 ─→ User (sender)
         ├─→ N:1 ─→ GroupMessage (parent)
         ├─→ 1:N ─→ GroupMessage (replies)
         └─→ 1:N ─→ GroupMessageReaction

┌──────────────────────────┐
│ GroupMessageReaction     │
├──────────────────────────┤
│ id (UUID)                │
│ groupMessageId (FK)      │
│ userId (FK)              │
│ emoji (VARCHAR)          │
│ createdAt (TIMESTAMP)    │
└──────────────────────────┘
         │
         ├─→ N:1 ─→ GroupMessage
         │
         └─→ N:1 ─→ User
```

**Indexes:**
```
GroupConversation:
- idx_group_created_at (createdAt)

GroupConversationMember:
- idx_group_member_user (userId, joinedAt)
- idx_group_member_group (groupConversationId)

GroupMessage:
- idx_group_message_group (groupConversationId, createdAt)
- idx_group_message_sender (senderUserId)
- idx_group_message_parent (parentMessageId)
- idx_group_message_pinned (groupConversationId, pinnedAt)

GroupMessageReaction:
- idx_group_reaction_message (groupMessageId)
```

**Constraints:**
```
GroupConversationMember:
- UNIQUE(groupConversationId, userId)

GroupMessageReaction:
- UNIQUE(groupMessageId, userId, emoji)
```

---

## 📋 TASK-002: GroupConversations Service

### Design Document

**Objective:** Implement GroupConversationsService

**Service Methods:**

```typescript
class GroupConversationsService {
  // Create
  async create(
    currentUserId: string,
    dto: CreateGroupDto
  ): Promise<GroupConversation>
  
  // Read
  async findById(
    currentUserId: string,
    groupId: string
  ): Promise<GroupConversation>
  
  async findAll(
    currentUserId: string,
    query: ListGroupsQueryDto
  ): Promise<PaginatedResponse<GroupConversation>>
  
  // Update
  async update(
    currentUserId: string,
    groupId: string,
    dto: UpdateGroupDto
  ): Promise<GroupConversation>
  
  // Delete
  async delete(
    currentUserId: string,
    groupId: string
  ): Promise<void>
  
  // Members
  async addMember(
    currentUserId: string,
    groupId: string,
    dto: AddMemberDto
  ): Promise<GroupConversationMember>
  
  async removeMember(
    currentUserId: string,
    groupId: string,
    userId: string
  ): Promise<void>
  
  async getMembers(
    currentUserId: string,
    groupId: string,
    query: ListMembersQueryDto
  ): Promise<PaginatedResponse<GroupConversationMember>>
}
```

**DTOs:**

```typescript
// Create Group
interface CreateGroupDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  memberIds: string[];
}

// Update Group
interface UpdateGroupDto {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

// Add Member
interface AddMemberDto {
  userId: string;
}

// List Groups Query
interface ListGroupsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// List Members Query
interface ListMembersQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}
```

**Business Logic:**

```
Create Group:
1. Validate input
2. Create GroupConversation
3. Add creator as owner
4. Add members
5. Emit group.created event
6. Return group

Add Member:
1. Check if user exists
2. Check if already member
3. Add member
4. Emit group.member.added event
5. Send notification

Remove Member:
1. Check if member exists
2. Remove member
3. Emit group.member.removed event
4. If last member, delete group

Delete Group:
1. Check if owner
2. Delete group (cascade)
3. Emit group.deleted event
```

---

## 📋 TASK-003: GroupMessages Service

### Design Document

**Objective:** Implement GroupMessagesService

**Service Methods:**

```typescript
class GroupMessagesService {
  // Send
  async sendMessage(
    currentUserId: string,
    groupId: string,
    dto: CreateMessageDto
  ): Promise<GroupMessage>
  
  async sendImage(
    currentUserId: string,
    groupId: string,
    file: Express.Multer.File,
    dto: CreateImageMessageDto
  ): Promise<GroupMessage>
  
  async sendAttachment(
    currentUserId: string,
    groupId: string,
    file: Express.Multer.File,
    dto: CreateAttachmentMessageDto
  ): Promise<GroupMessage>
  
  // Get
  async getMessages(
    currentUserId: string,
    groupId: string,
    query: ListMessagesQueryDto
  ): Promise<PaginatedResponse<GroupMessage>>
  
  // Update
  async updateMessage(
    currentUserId: string,
    groupId: string,
    messageId: string,
    dto: UpdateMessageDto
  ): Promise<GroupMessage>
  
  // Delete
  async deleteMessage(
    currentUserId: string,
    groupId: string,
    messageId: string
  ): Promise<void>
  
  async recallMessage(
    currentUserId: string,
    groupId: string,
    messageId: string
  ): Promise<GroupMessage>
  
  // Reactions
  async addReaction(
    currentUserId: string,
    groupId: string,
    messageId: string,
    emoji: string
  ): Promise<GroupMessageReaction[]>
  
  async removeReaction(
    currentUserId: string,
    groupId: string,
    messageId: string,
    emoji: string
  ): Promise<GroupMessageReaction[]>
  
  // Pin
  async pinMessage(
    currentUserId: string,
    groupId: string,
    messageId: string
  ): Promise<GroupMessage>
  
  async unpinMessage(
    currentUserId: string,
    groupId: string,
    messageId: string
  ): Promise<GroupMessage>
}
```

**DTOs:**

```typescript
// Create Message
interface CreateMessageDto {
  textContent: string;
  parentMessageId?: string;
}

// Create Image Message
interface CreateImageMessageDto {
  textContent?: string;
  parentMessageId?: string;
}

// Create Attachment Message
interface CreateAttachmentMessageDto {
  textContent?: string;
  parentMessageId?: string;
}

// Update Message
interface UpdateMessageDto {
  textContent?: string;
}

// List Messages Query
interface ListMessagesQueryDto {
  page?: number;
  limit?: number;
  before?: string; // cursor
  search?: string;
}
```

**Business Logic:**

```
Send Message:
1. Check if member
2. Validate input
3. Create message
4. Emit group.message.new event
5. Send notifications
6. Return message

Send Image:
1. Check if member
2. Upload to Cloudinary
3. Create message with mediaUrl
4. Emit group.message.new event
5. Return message

Add Reaction:
1. Check if member
2. Check if message exists
3. Add reaction
4. Emit group.message.reaction_updated event
5. Return reactions

Pin Message:
1. Check if owner/admin
2. Set pinnedAt
3. Emit group.message.updated event
4. Return message
```

---

## 📋 TASK-007: Group Chats Page

### Design Document

**Objective:** Tạo trang group chats

**Page Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Group Chats Page                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Group List           │  │ Chat Area                        │ │
│  │                      │  │                                  │ │
│  │ [+ New Group]        │  │ ┌──────────────────────────────┐ │ │
│  │ [Search...]          │  │ │ Group Name                   │ │ │
│  │                      │  │ │ 5 members • Settings         │ │ │
│  │ ┌──────────────────┐ │  │ └──────────────────────────────┘ │ │
│  │ │ Group 1          │ │  │                                  │ │
│  │ │ 3 messages       │ │  │ ┌──────────────────────────────┐ │ │
│  │ │ 2 hours ago      │ │  │ │ Messages                     │ │ │
│  │ └──────────────────┘ │  │ │                              │ │ │
│  │                      │  │ │ User A: Hello everyone!      │ │ │
│  │ ┌──────────────────┐ │  │ │ User B: Hi there!            │ │ │
│  │ │ Group 2          │ │  │ │ User C: How are you?         │ │ │
│  │ │ 1 message        │ │  │ │                              │ │ │
│  │ │ 1 day ago        │ │  │ │ [Typing indicator...]        │ │ │
│  │ └──────────────────┘ │  │ │                              │ │ │
│  │                      │  │ └──────────────────────────────┘ │ │
│  │ ┌──────────────────┐ │  │                                  │ │
│  │ │ Group 3          │ │  │ [Type message...] [Send]         │ │
│  │ │ 5 messages       │ │  │ [Attach] [Emoji]                 │ │
│  │ │ 3 days ago       │ │  │                                  │ │
│  │ └──────────────────┘ │  │                                  │ │
│  │                      │  │                                  │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**

```
GroupChatsPage
├── GroupList
│   ├── CreateGroupButton
│   ├── SearchInput
│   └── GroupListItem[] (scrollable)
│       ├── GroupAvatar
│       ├── GroupName
│       ├── LastMessage
│       └── Timestamp
│
└── ChatArea
    ├── GroupHeader
    │   ├── GroupName
    │   ├── MemberCount
    │   └── SettingsButton
    │
    ├── MessageList (virtual scroll)
    │   └── GroupMessageBubble[]
    │       ├── SenderAvatar
    │       ├── SenderName
    │       ├── MessageContent
    │       ├── Timestamp
    │       ├── Reactions
    │       └── MessageActions
    │
    ├── TypingIndicator
    │
    └── MessageComposer
        ├── TextInput
        ├── AttachButton
        ├── EmojiButton
        └── SendButton
```

**Responsive Design:**

```
Desktop (1024px+):
- Left sidebar: 300px
- Chat area: flex

Tablet (768px - 1023px):
- Left sidebar: 250px
- Chat area: flex

Mobile (< 768px):
- Toggle between list and chat
- Full width
```

---

## 📋 TASK-008: Create Group Modal

### Design Document

**Objective:** Tạo modal để tạo nhóm mới

**Modal Layout:**

```
┌─────────────────────────────────────────┐
│ Create New Group                    [X] │
├─────────────────────────────────────────┤
│                                         │
│ Group Name *                            │
│ [_________________________________]    │
│ (max 100 characters)                    │
│                                         │
│ Description                             │
│ [_________________________________]    │
│ [_________________________________]    │
│ (max 500 characters)                    │
│                                         │
│ Group Avatar                            │
│ [Upload Image] or [Use Default]         │
│                                         │
│ Add Members *                           │
│ [Search members...]                     │
│                                         │
│ ☐ User A (linh@example.com)             │
│ ☐ User B (john@example.com)             │
│ ☐ User C (jane@example.com)             │
│ ☐ User D (bob@example.com)              │
│ ☐ User E (alice@example.com)            │
│                                         │
│ Selected: 3 members                     │
│                                         │
│ [Cancel] [Create Group]                 │
│                                         │
└─────────────────────────────────────────┘
```

**Form Validation:**

```
Group Name:
- Required
- Min 3 characters
- Max 100 characters
- Unique

Description:
- Optional
- Max 500 characters

Members:
- Required (min 2)
- Max 100 members
- Cannot include self
```

**States:**

```
Initial:
- Empty form
- Create button disabled

Filling:
- Form validation in real-time
- Create button enabled if valid

Loading:
- Spinner on Create button
- Form disabled

Success:
- Close modal
- Show toast notification
- Redirect to group chat

Error:
- Show error message
- Keep form data
- Enable retry
```

---

## 📋 TASK-010: Message Sending & Display

### Design Document

**Objective:** Implement gửi và hiển thị tin nhắn

**Message Bubble Design:**

```
┌─────────────────────────────────────────┐
│ User A                          2:30 PM │
├─────────────────────────────────────────┤
│ Hello everyone! How are you?            │
│                                         │
│ ❤️ 2  👍 1  😂 3                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ User B                          2:31 PM │
├─────────────────────────────────────────┤
│ [Image]                                 │
│ Great! Just finished work               │
│                                         │
│ ❤️ 1                                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ User C                          2:32 PM │
├─────────────────────────────────────────┤
│ > User A: Hello everyone!               │
│ I'm doing great, thanks!                │
└─────────────────────────────────────────┘
```

**Message Types:**

```
Text Message:
- Sender name
- Text content
- Timestamp
- Reactions
- Actions (reply, forward, etc)

Image Message:
- Sender name
- Image (thumbnail)
- Optional caption
- Timestamp
- Reactions

File Message:
- Sender name
- File icon
- File name
- File size
- Timestamp
- Reactions

Audio Message:
- Sender name
- Audio player
- Duration
- Timestamp
- Reactions
```

**Message Actions:**

```
Hover/Long Press:
┌─────────────────────────────────────────┐
│ [❤️] [👍] [😂] [😍] [😮] [More]        │
│ [Reply] [Forward] [Pin] [Delete]        │
└─────────────────────────────────────────┘
```

**Delivery Status:**

```
Pending: ⏱️
Sent: ✓
Delivered: ✓✓
Seen: ✓✓ (blue)
```

---

## 📋 TASK-011: Message Actions

### Design Document

**Objective:** Implement reply, forward, reactions, pin, recall, delete

**Reply Flow:**

```
1. User clicks Reply on message
   ↓
2. Quote preview appears in composer
   ┌─────────────────────────────────┐
   │ > User A: Hello everyone!       │
   │ [X]                             │
   └─────────────────────────────────┘
   ↓
3. User types reply
   ↓
4. User sends
   ↓
5. Message appears with quote
   ┌─────────────────────────────────┐
   │ User B                  2:31 PM │
   │ > User A: Hello everyone!       │
   │ I'm doing great!                │
   └─────────────────────────────────┘
```

**Forward Flow:**

```
1. User clicks Forward on message
   ↓
2. Modal appears with group list
   ┌─────────────────────────────────┐
   │ Forward to:                     │
   │ ☐ Group 1                       │
   │ ☐ Group 2                       │
   │ ☐ Group 3                       │
   │ [Cancel] [Forward]              │
   └─────────────────────────────────┘
   ↓
3. User selects group
   ↓
4. Message forwarded
   ↓
5. Show confirmation
```

**Reactions:**

```
Click emoji button:
┌─────────────────────────────────────┐
│ ❤️  👍  😂  😍  😮  [More]          │
└─────────────────────────────────────┘

Click emoji:
- Add reaction
- Show count
- Highlight if user reacted

Click again:
- Remove reaction
- Update count
```

**Pin Message:**

```
1. User clicks Pin
   ↓
2. Message pinned
   ↓
3. Show notification
   "Message pinned by User A"
   ↓
4. Pinned message appears in header
   ┌─────────────────────────────────┐
   │ 📌 Pinned Messages (3)          │
   │ • Message 1                     │
   │ • Message 2                     │
   │ • Message 3                     │
   └─────────────────────────────────┘
```

**Recall Message:**

```
1. User clicks Recall
   ↓
2. Confirmation dialog
   "Are you sure?"
   ↓
3. Message recalled
   ↓
4. Show "This message was recalled"
```

**Delete Message:**

```
1. User clicks Delete
   ↓
2. Confirmation dialog
   "Delete this message?"
   ↓
3. Message deleted
   ↓
4. Show "This message was deleted"
```

---

## 📋 TASK-012: Typing Indicators

### Design Document

**Objective:** Hiển thị ai đang gõ tin nhắn

**Typing Indicator Animation:**

```
User A đang gõ...
User A, User B đang gõ...
User A, User B, User C đang gõ...
```

**Implementation:**

```
1. User starts typing
   ↓
2. Emit group.typing.start event
   ↓
3. Other users see "User A đang gõ..."
   ↓
4. User stops typing (1.6s idle)
   ↓
5. Emit group.typing.stop event
   ↓
6. Typing indicator disappears
```

**UI:**

```
┌─────────────────────────────────────┐
│ Messages                            │
│                                     │
│ User A: Hello!                      │
│ User B: Hi there!                   │
│                                     │
│ User C đang gõ...                   │
│ ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏                │
│                                     │
└─────────────────────────────────────┘
```

---

## 📋 TASK-013: Message Search

### Design Document

**Objective:** Tìm kiếm tin nhắn trong nhóm

**Search UI:**

```
┌─────────────────────────────────────┐
│ [Search messages...] [X]            │
└─────────────────────────────────────┘

Search Results:
┌─────────────────────────────────────┐
│ 5 results found                     │
│                                     │
│ User A: Hello everyone!             │
│ 2 hours ago                         │
│                                     │
│ User B: Great! Just finished work   │
│ 1 hour ago                          │
│                                     │
│ User C: I'm doing great, thanks!    │
│ 30 minutes ago                      │
│                                     │
│ User A: How about you?              │
│ 15 minutes ago                      │
│                                     │
│ User B: All good!                   │
│ 5 minutes ago                       │
└─────────────────────────────────────┘
```

**Search Features:**

```
- Search by text content
- Search by sender name
- Filter by date range
- Sort by relevance or date
- Highlight matches
- Click to jump to message
```

---

## 📋 TASK-014: API Tests

### Design Document

**Objective:** Viết API tests cho group conversations

**Test Cases:**

```
GroupConversations:
✅ Create group
✅ Get group
✅ List groups
✅ Update group
✅ Delete group
✅ Add member
✅ Remove member
✅ Get members
✅ Create with invalid data
✅ Unauthorized access

GroupMessages:
✅ Send message
✅ Get messages
✅ Update message
✅ Delete message
✅ Recall message
✅ Pin message
✅ Add reaction
✅ Remove reaction
✅ Send image
✅ Send attachment

Total: 20+ tests
```

---

## 📋 TASK-015: E2E UI Tests

### Design Document

**Objective:** Viết E2E tests cho group chat UI

**Test Cases:**

```
✅ Create group
✅ Send message
✅ Add member
✅ Remove member
✅ Reply to message
✅ Forward message
✅ Add reaction
✅ Pin message
✅ Recall message
✅ Delete message
✅ Search messages
✅ Typing indicator
✅ Upload image
✅ Leave group
✅ Delete group

Total: 15+ tests
```

---

**Tạo bởi:** Kiro AI  
**Ngày tạo:** 2026-04-22

