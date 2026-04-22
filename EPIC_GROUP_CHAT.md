# 📋 EPIC: Group Chat - Hộp Chat Giống Facebook

**Epic ID:** EPIC-001  
**Tên:** Group Chat Feature  
**Mô tả:** Tạo tính năng hộp chat nhóm cho phép mọi người chat với nhau, tương tự Facebook Messenger  
**Trạng thái:** Planning  
**Ưu tiên:** High  
**Ngày tạo:** 2026-04-22  
**Người tạo:** Kiro AI  

---

## 🎯 Mục Tiêu

Cho phép người dùng:
- ✅ Tạo nhóm chat với nhiều người
- ✅ Thêm/xóa thành viên từ nhóm
- ✅ Chat realtime trong nhóm
- ✅ Xem danh sách thành viên
- ✅ Quản lý nhóm (đổi tên, ảnh, mô tả)
- ✅ Ghim tin nhắn quan trọng
- ✅ Tìm kiếm tin nhắn trong nhóm
- ✅ Notifications cho tin nhắn nhóm

---

## 📊 Scope

### Trong Scope (MVP)
- ✅ Tạo nhóm chat
- ✅ Thêm/xóa thành viên
- ✅ Chat realtime
- ✅ Xem danh sách thành viên
- ✅ Đổi tên nhóm
- ✅ Đổi ảnh nhóm
- ✅ Ghim tin nhắn
- ✅ Tìm kiếm tin nhắn
- ✅ Notifications

### Ngoài Scope (Future)
- ❌ Video call nhóm
- ❌ Voice call nhóm
- ❌ Polls/Surveys
- ❌ File sharing (advanced)
- ❌ Admin roles (owner, moderator)
- ❌ Message encryption
- ❌ Backup/Archive

---

## 💾 Database Changes

### Bảng Mới

#### 1. **GroupConversation**
```sql
CREATE TABLE "GroupConversation" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatarUrl VARCHAR(500),
  createdByUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_created_by FOREIGN KEY (createdByUserId) REFERENCES "User"(id)
);

CREATE INDEX idx_group_created_at ON "GroupConversation"(createdAt);
```

#### 2. **GroupConversationMember**
```sql
CREATE TABLE "GroupConversationMember" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  groupConversationId UUID NOT NULL REFERENCES "GroupConversation"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  joinedAt TIMESTAMP DEFAULT NOW(),
  lastReadAt TIMESTAMP,
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
  
  CONSTRAINT unique_member UNIQUE(groupConversationId, userId),
  CONSTRAINT fk_group FOREIGN KEY (groupConversationId) REFERENCES "GroupConversation"(id),
  CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES "User"(id)
);

CREATE INDEX idx_group_member_user ON "GroupConversationMember"(userId, joinedAt);
CREATE INDEX idx_group_member_group ON "GroupConversationMember"(groupConversationId);
```

#### 3. **GroupMessage**
```sql
CREATE TABLE "GroupMessage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  groupConversationId UUID NOT NULL REFERENCES "GroupConversation"(id) ON DELETE CASCADE,
  senderUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  parentMessageId UUID REFERENCES "GroupMessage"(id) ON DELETE SET NULL,
  messageType VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'audio'
  textContent TEXT,
  mediaUrl VARCHAR(500),
  fileName VARCHAR(255),
  mimeType VARCHAR(100),
  fileSize INT,
  durationSeconds INT,
  pinnedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  recalledAt TIMESTAMP,
  deletedAt TIMESTAMP,
  
  CONSTRAINT fk_group FOREIGN KEY (groupConversationId) REFERENCES "GroupConversation"(id),
  CONSTRAINT fk_sender FOREIGN KEY (senderUserId) REFERENCES "User"(id)
);

CREATE INDEX idx_group_message_group ON "GroupMessage"(groupConversationId, createdAt);
CREATE INDEX idx_group_message_sender ON "GroupMessage"(senderUserId);
CREATE INDEX idx_group_message_parent ON "GroupMessage"(parentMessageId);
CREATE INDEX idx_group_message_pinned ON "GroupMessage"(groupConversationId, pinnedAt);
```

#### 4. **GroupMessageReaction**
```sql
CREATE TABLE "GroupMessageReaction" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  groupMessageId UUID NOT NULL REFERENCES "GroupMessage"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_reaction UNIQUE(groupMessageId, userId, emoji),
  CONSTRAINT fk_message FOREIGN KEY (groupMessageId) REFERENCES "GroupMessage"(id),
  CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES "User"(id)
);

CREATE INDEX idx_group_reaction_message ON "GroupMessageReaction"(groupMessageId);
```

### Bảng Sửa Đổi

#### **Conversation** (Đổi tên thành DirectConversation)
```sql
ALTER TABLE "Conversation" RENAME TO "DirectConversation";
ALTER TABLE "ConversationParticipant" RENAME TO "DirectConversationParticipant";
ALTER TABLE "Message" RENAME TO "DirectMessage";
ALTER TABLE "MessageReceipt" RENAME TO "DirectMessageReceipt";
ALTER TABLE "MessageReaction" RENAME TO "DirectMessageReaction";
```

---

## 🏗️ Backend Architecture

### Modules Mới

#### 1. **GroupConversations Module**
```
apps/api/src/group-conversations/
├── group-conversations.controller.ts
├── group-conversations.service.ts
├── group-conversations.module.ts
├── dto/
│   ├── create-group.dto.ts
│   ├── update-group.dto.ts
│   ├── add-member.dto.ts
│   └── list-groups.query.dto.ts
└── entities/
    └── group-conversation.entity.ts
```

**Endpoints:**
- `POST /group-conversations` - Tạo nhóm
- `GET /group-conversations` - Danh sách nhóm
- `GET /group-conversations/:id` - Chi tiết nhóm
- `PUT /group-conversations/:id` - Cập nhật nhóm
- `DELETE /group-conversations/:id` - Xóa nhóm
- `POST /group-conversations/:id/members` - Thêm thành viên
- `DELETE /group-conversations/:id/members/:userId` - Xóa thành viên
- `GET /group-conversations/:id/members` - Danh sách thành viên

#### 2. **GroupMessages Module**
```
apps/api/src/group-messages/
├── group-messages.controller.ts
├── group-messages.service.ts
├── group-messages.module.ts
├── dto/
│   ├── create-message.dto.ts
│   ├── list-messages.query.dto.ts
│   └── add-reaction.dto.ts
└── entities/
    └── group-message.entity.ts
```

**Endpoints:**
- `GET /group-conversations/:id/messages` - Lấy tin nhắn
- `POST /group-conversations/:id/messages` - Gửi tin nhắn
- `POST /group-conversations/:id/messages/image` - Gửi ảnh
- `POST /group-conversations/:id/messages/attachment` - Gửi tệp
- `PATCH /group-conversations/:id/messages/:messageId/recall` - Thu hồi
- `DELETE /group-conversations/:id/messages/:messageId` - Xóa
- `POST /group-conversations/:id/messages/:messageId/reactions` - Thêm reaction
- `DELETE /group-conversations/:id/messages/:messageId/reactions/:emoji` - Xóa reaction
- `PATCH /group-conversations/:id/messages/:messageId/pin` - Ghim
- `DELETE /group-conversations/:id/messages/:messageId/pin` - Bỏ ghim

#### 3. **Realtime Gateway Updates**
```
apps/api/src/realtime/realtime.gateway.ts
```

**New Events:**
- `group.join` - Tham gia nhóm
- `group.leave` - Rời nhóm
- `group.message.new` - Tin nhắn nhóm mới
- `group.message.updated` - Tin nhắn cập nhật
- `group.message.delivered` - Tin nhắn đã gửi
- `group.message.seen` - Tin nhắn đã xem
- `group.typing.start` - Gõ tin nhắn
- `group.typing.stop` - Dừng gõ
- `group.member.added` - Thành viên mới
- `group.member.removed` - Thành viên rời
- `group.updated` - Nhóm cập nhật

---

## 🎨 Frontend Architecture

### Pages Mới

#### 1. **Group Chats Page** (`apps/web/app/group-chats/page.tsx`)
```
┌─────────────────────────────────────────────────────────────┐
│                    Group Chats Page                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ Group List       │  │ Chat Area                        │ │
│  │                  │  │                                  │ │
│  │ [+ New Group]    │  │ Group Name                       │ │
│  │                  │  │ Members: 5                       │ │
│  │ Group 1          │  │                                  │ │
│  │ Group 2          │  │ ┌──────────────────────────────┐ │ │
│  │ Group 3          │  │ │ Messages                     │ │ │
│  │ Group 4          │  │ │                              │ │ │
│  │                  │  │ │ User A: Hello everyone!      │ │ │
│  │ [Search]         │  │ │ User B: Hi there!            │ │ │
│  │                  │  │ │ User C: How are you?         │ │ │
│  │                  │  │ │                              │ │ │
│  │                  │  │ └──────────────────────────────┘ │ │
│  │                  │  │                                  │ │
│  │                  │  │ [Type message...] [Send]         │ │
│  │                  │  │                                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 2. **Create Group Modal** (`apps/web/components/create-group-modal.tsx`)
```
┌─────────────────────────────────────┐
│ Create New Group                    │
├─────────────────────────────────────┤
│                                     │
│ Group Name: [_________________]    │
│                                     │
│ Description: [_________________]   │
│                                     │
│ Add Members:                        │
│ ☐ User A                            │
│ ☐ User B                            │
│ ☐ User C                            │
│ ☐ User D                            │
│                                     │
│ [Cancel] [Create]                   │
│                                     │
└─────────────────────────────────────┘
```

#### 3. **Group Info Sidebar** (`apps/web/components/group-info-sidebar.tsx`)
```
┌──────────────────────────┐
│ Group Info               │
├──────────────────────────┤
│                          │
│ [Group Avatar]           │
│                          │
│ Group Name               │
│ 5 members                │
│                          │
│ Description:             │
│ This is a group chat     │
│                          │
│ Members:                 │
│ • User A (Owner)         │
│ • User B                 │
│ • User C                 │
│ • User D                 │
│ • User E                 │
│                          │
│ [Add Member]             │
│ [Leave Group]            │
│ [Delete Group]           │
│                          │
└──────────────────────────┘
```

### Components Mới

```
apps/web/components/
├── group-chat-list.tsx
├── group-chat-bubble.tsx
├── group-info-sidebar.tsx
├── create-group-modal.tsx
├── add-member-modal.tsx
├── group-message-actions.tsx
└── group-typing-indicator.tsx
```

### Hooks Mới

```
apps/web/lib/hooks/
├── useGroupChat.ts
├── useGroupMessages.ts
├── useGroupMembers.ts
└── useGroupSocket.ts
```

---

## 🔌 WebSocket Events

### Client → Server

```typescript
// Join group
socket.emit('group.join', { groupConversationId: string })

// Leave group
socket.emit('group.leave', { groupConversationId: string })

// Typing start
socket.emit('group.typing.start', { 
  groupConversationId: string,
  displayName: string 
})

// Typing stop
socket.emit('group.typing.stop', { 
  groupConversationId: string 
})
```

### Server → Client

```typescript
// New message
socket.on('group.message.new', {
  groupConversationId: string,
  message: GroupMessage
})

// Message updated
socket.on('group.message.updated', {
  groupConversationId: string,
  message: GroupMessage
})

// Message delivered
socket.on('group.message.delivered', {
  groupConversationId: string,
  messageIds: string[],
  deliveredAt: string
})

// Message seen
socket.on('group.message.seen', {
  groupConversationId: string,
  userId: string,
  messageIds: string[],
  seenAt: string
})

// Typing start
socket.on('group.typing.start', {
  groupConversationId: string,
  userId: string,
  displayName: string
})

// Typing stop
socket.on('group.typing.stop', {
  groupConversationId: string,
  userId: string
})

// Member added
socket.on('group.member.added', {
  groupConversationId: string,
  user: User
})

// Member removed
socket.on('group.member.removed', {
  groupConversationId: string,
  userId: string
})

// Group updated
socket.on('group.updated', {
  groupConversationId: string,
  group: GroupConversation
})

// Reaction updated
socket.on('group.message.reaction_updated', {
  groupConversationId: string,
  messageId: string,
  reactions: MessageReaction[]
})
```

---

## 📋 Tasks

### Phase 1: Database & Backend Setup

#### TASK-001: Database Schema
- **Mô tả:** Tạo bảng GroupConversation, GroupConversationMember, GroupMessage, GroupMessageReaction
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ 4 bảng mới được tạo
  - ✅ Indexes được tạo
  - ✅ Foreign keys được setup
  - ✅ Migrations chạy thành công

#### TASK-002: GroupConversations Service
- **Mô tả:** Implement GroupConversationsService với CRUD operations
- **Ước tính:** 6 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ Create group
  - ✅ Get group
  - ✅ List groups
  - ✅ Update group
  - ✅ Delete group
  - ✅ Add member
  - ✅ Remove member
  - ✅ Get members

#### TASK-003: GroupMessages Service
- **Mô tả:** Implement GroupMessagesService
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ Send message
  - ✅ Get messages (paginated)
  - ✅ Update message
  - ✅ Delete message
  - ✅ Recall message
  - ✅ Pin message
  - ✅ Add reaction
  - ✅ Remove reaction

#### TASK-004: GroupConversations Controller
- **Mô tả:** Implement REST endpoints cho group conversations
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ POST /group-conversations
  - ✅ GET /group-conversations
  - ✅ GET /group-conversations/:id
  - ✅ PUT /group-conversations/:id
  - ✅ DELETE /group-conversations/:id
  - ✅ POST /group-conversations/:id/members
  - ✅ DELETE /group-conversations/:id/members/:userId
  - ✅ GET /group-conversations/:id/members

#### TASK-005: GroupMessages Controller
- **Mô tả:** Implement REST endpoints cho group messages
- **Ước tính:** 6 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ GET /group-conversations/:id/messages
  - ✅ POST /group-conversations/:id/messages
  - ✅ POST /group-conversations/:id/messages/image
  - ✅ POST /group-conversations/:id/messages/attachment
  - ✅ PATCH /group-conversations/:id/messages/:messageId/recall
  - ✅ DELETE /group-conversations/:id/messages/:messageId
  - ✅ POST /group-conversations/:id/messages/:messageId/reactions
  - ✅ DELETE /group-conversations/:id/messages/:messageId/reactions/:emoji
  - ✅ PATCH /group-conversations/:id/messages/:messageId/pin
  - ✅ DELETE /group-conversations/:id/messages/:messageId/pin

#### TASK-006: Realtime Gateway Updates
- **Mô tả:** Update RealtimeGateway để support group chat events
- **Ước tính:** 6 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ group.join event
  - ✅ group.leave event
  - ✅ group.message.new event
  - ✅ group.typing.start event
  - ✅ group.typing.stop event
  - ✅ group.member.added event
  - ✅ group.member.removed event
  - ✅ group.updated event

### Phase 2: Frontend UI

#### TASK-007: Group Chats Page
- **Mô tả:** Tạo trang group chats với list và chat area
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ Hiển thị danh sách nhóm
  - ✅ Hiển thị chat area
  - ✅ Hiển thị tin nhắn
  - ✅ Responsive design

#### TASK-008: Create Group Modal
- **Mô tả:** Tạo modal để tạo nhóm mới
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ Input group name
  - ✅ Input description
  - ✅ Select members
  - ✅ Create button
  - ✅ Validation

#### TASK-009: Group Info Sidebar
- **Mô tả:** Tạo sidebar hiển thị thông tin nhóm
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** Medium
- **Acceptance Criteria:**
  - ✅ Hiển thị tên nhóm
  - ✅ Hiển thị ảnh nhóm
  - ✅ Hiển thị danh sách thành viên
  - ✅ Add member button
  - ✅ Leave group button

#### TASK-010: Message Sending & Display
- **Mô tả:** Implement gửi và hiển thị tin nhắn
- **Ước tính:** 6 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ Gửi tin nhắn text
  - ✅ Gửi ảnh
  - ✅ Gửi tệp
  - ✅ Hiển thị tin nhắn
  - ✅ Hiển thị tên người gửi
  - ✅ Hiển thị thời gian

#### TASK-011: Message Actions
- **Mô tả:** Implement reply, forward, reactions, pin, recall, delete
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ Reply tin nhắn
  - ✅ Forward tin nhắn
  - ✅ Add reactions
  - ✅ Pin tin nhắn
  - ✅ Recall tin nhắn
  - ✅ Delete tin nhắn

#### TASK-012: Typing Indicators
- **Mô tả:** Hiển thị ai đang gõ tin nhắn
- **Ước tính:** 3 giờ
- **Độ ưu tiên:** Medium
- **Acceptance Criteria:**
  - ✅ Hiển thị "User A đang gõ..."
  - ✅ Ẩn sau 1.6 giây
  - ✅ Support nhiều người gõ

#### TASK-013: Message Search
- **Mô tả:** Tìm kiếm tin nhắn trong nhóm
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** Medium
- **Acceptance Criteria:**
  - ✅ Search input
  - ✅ Search results
  - ✅ Highlight matches
  - ✅ Clear search

### Phase 3: Testing

#### TASK-014: API Tests
- **Mô tả:** Viết API tests cho group conversations
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ 20+ API tests
  - ✅ CRUD operations
  - ✅ Member management
  - ✅ Message operations
  - ✅ Error handling

#### TASK-015: E2E UI Tests
- **Mô tả:** Viết E2E tests cho group chat UI
- **Ước tính:** 10 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ 15+ E2E tests
  - ✅ Create group
  - ✅ Send message
  - ✅ Add member
  - ✅ Message actions
  - ✅ Realtime updates

### Phase 4: Documentation

#### TASK-016: API Documentation
- **Mô tả:** Viết documentation cho group chat API
- **Ước tính:** 3 giờ
- **Độ ưu tiên:** Medium
- **Acceptance Criteria:**
  - ✅ Endpoint documentation
  - ✅ Request/response examples
  - ✅ Error codes

#### TASK-017: User Guide
- **Mô tả:** Viết hướng dẫn sử dụng group chat
- **Ước tính:** 2 giờ
- **Độ ưu tiên:** Medium
- **Acceptance Criteria:**
  - ✅ Cách tạo nhóm
  - ✅ Cách thêm thành viên
  - ✅ Cách gửi tin nhắn
  - ✅ Cách quản lý nhóm

---

## 📊 Timeline

```
Phase 1: Database & Backend (34 giờ)
├── TASK-001: Database Schema (4h)
├── TASK-002: GroupConversations Service (6h)
├── TASK-003: GroupMessages Service (8h)
├── TASK-004: GroupConversations Controller (4h)
├── TASK-005: GroupMessages Controller (6h)
└── TASK-006: Realtime Gateway (6h)

Phase 2: Frontend UI (37 giờ)
├── TASK-007: Group Chats Page (8h)
├── TASK-008: Create Group Modal (4h)
├── TASK-009: Group Info Sidebar (4h)
├── TASK-010: Message Sending & Display (6h)
├── TASK-011: Message Actions (8h)
├── TASK-012: Typing Indicators (3h)
└── TASK-013: Message Search (4h)

Phase 3: Testing (18 giờ)
├── TASK-014: API Tests (8h)
└── TASK-015: E2E UI Tests (10h)

Phase 4: Documentation (5 giờ)
├── TASK-016: API Documentation (3h)
└── TASK-017: User Guide (2h)

TOTAL: 94 giờ (~2.5 tuần)
```

---

## 🎯 Success Criteria

- ✅ Tất cả 17 tasks hoàn thành
- ✅ 20+ API tests pass
- ✅ 15+ E2E tests pass
- ✅ Realtime chat hoạt động
- ✅ Responsive design
- ✅ Documentation hoàn chỉnh
- ✅ Zero critical bugs

---

## 🔗 Related Epics

- EPIC-002: Advanced Group Features (Video call, Voice call, Polls)
- EPIC-003: Group Moderation (Admin roles, Permissions)

---

## 📝 Notes

- Sử dụng Prisma migrations cho database changes
- Sử dụng Socket.IO namespaces cho group events
- Implement pagination cho messages
- Implement virtual scrolling cho performance
- Implement image compression cho media
- Implement rate limiting cho API

---

**Tạo bởi:** Kiro AI  
**Ngày tạo:** 2026-04-22  
**Cập nhật lần cuối:** 2026-04-22

