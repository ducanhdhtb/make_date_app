# NearMatch Dating App - Database Schema Documentation

**Ngày tạo:** 2026-04-22  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Trạng thái:** Production-ready

---

## 📊 Tổng quan Database

NearMatch sử dụng PostgreSQL với Prisma ORM. Database được thiết kế cho ứng dụng dating với các tính năng:
- Quản lý người dùng và hồ sơ
- Hệ thống like/match
- Chat realtime với WebSocket
- Stories (tương tự Instagram)
- Notifications
- Block/Report users

**Tổng số bảng:** 16 bảng chính  
**Enums:** 8 loại enum  
**Relationships:** 30+ foreign keys

---

## 🔑 Enums (Kiểu dữ liệu)

### Gender (Giới tính)
```
- male (Nam)
- female (Nữ)
- other (Khác)
```

### InterestedIn (Quan tâm đến)
```
- male (Nam)
- female (Nữ)
- everyone (Tất cả)
```

### MatchStatus (Trạng thái match)
```
- active (Đang hoạt động)
- unmatched (Hủy match)
- blocked (Bị chặn)
```

### StoryMediaType (Loại media story)
```
- image (Ảnh)
- text (Văn bản)
```

### ShareTargetType (Loại chia sẻ)
```
- profile (Hồ sơ)
- story (Story)
```

### ConversationType (Loại hội thoại)
```
- direct (Trực tiếp 1-1)
```

### MessageType (Loại tin nhắn)
```
- text (Văn bản)
- image (Ảnh)
- file (Tệp)
- audio (Âm thanh)
```

### NotificationType (Loại thông báo)
```
- match_created (Match mới)
- new_message (Tin nhắn mới)
- new_like (Like mới)
- story_reaction (Reaction story)
- system (Hệ thống)
```

### ReportStatus (Trạng thái báo cáo)
```
- open (Mở)
- reviewed (Đã xem xét)
- rejected (Bị từ chối)
- actioned (Đã xử lý)
```

---

## 📋 Bảng Chi Tiết

### 1. **User** (Người dùng)
Bảng chính lưu thông tin người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất (Primary Key) |
| `email` | String | Email (Unique) |
| `phone` | String | Số điện thoại (Optional, Unique) |
| `passwordHash` | String | Hash mật khẩu |
| `displayName` | String | Tên hiển thị |
| `birthDate` | DateTime | Ngày sinh |
| `gender` | Gender | Giới tính |
| `interestedIn` | InterestedIn | Quan tâm đến |
| `bio` | String | Tiểu sử (Optional) |
| `jobTitle` | String | Chức danh công việc (Optional) |
| `avatarUrl` | String | URL ảnh đại diện (Optional) |
| `city` | String | Thành phố (Optional) |
| `latitude` | Decimal(9,6) | Vĩ độ (Optional) |
| `longitude` | Decimal(9,6) | Kinh độ (Optional) |
| `isLocationPrecise` | Boolean | Vị trí chính xác? (Default: false) |
| `isStoryPublic` | Boolean | Story công khai? (Default: true) |
| `lastActiveAt` | DateTime | Lần hoạt động cuối (Optional) |
| `createdAt` | DateTime | Ngày tạo |
| `updatedAt` | DateTime | Ngày cập nhật |

**Indexes:**
- `(latitude, longitude)` - Tìm kiếm địa lý
- `lastActiveAt` - Sắp xếp người dùng hoạt động

**Relations:**
- `photos` → UserPhoto (1-N)
- `interests` → UserInterest (1-N)
- `stories` → Story (1-N)
- `likesSent` → Like (1-N)
- `likesReceived` → Like (1-N)
- `matchesAsUser1` → Match (1-N)
- `matchesAsUser2` → Match (1-N)
- `shares` → Share (1-N)
- `blocksInitiated` → Block (1-N)
- `blocksReceived` → Block (1-N)
- `reportsFiled` → Report (1-N)
- `reportsAgainst` → Report (1-N)
- `conversationLinks` → ConversationParticipant (1-N)
- `messages` → Message (1-N)
- `messageReceipts` → MessageReceipt (1-N)
- `notifications` → Notification (1-N)
- `messageReactions` → MessageReaction (1-N)

---

### 2. **UserPhoto** (Ảnh người dùng)
Lưu danh sách ảnh của người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `userId` | String | ID người dùng (FK) |
| `photoUrl` | String | URL ảnh |
| `sortOrder` | Int | Thứ tự sắp xếp (Default: 0) |
| `createdAt` | DateTime | Ngày tạo |

**Indexes:**
- `(userId, sortOrder)` - Lấy ảnh theo thứ tự

**Relations:**
- `user` → User (N-1)

---

### 3. **UserInterest** (Sở thích người dùng)
Lưu danh sách sở thích/tag của người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `userId` | String | ID người dùng (FK) |
| `interestName` | String | Tên sở thích |

**Unique Constraint:**
- `(userId, interestName)` - Không trùng sở thích

**Relations:**
- `user` → User (N-1)

---

### 4. **Like** (Thích)
Lưu các lần like giữa người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `fromUserId` | String | ID người like (FK) |
| `toUserId` | String | ID người được like (FK) |
| `createdAt` | DateTime | Ngày tạo |

**Unique Constraint:**
- `(fromUserId, toUserId)` - Mỗi cặp chỉ like 1 lần

**Relations:**
- `fromUser` → User (N-1)
- `toUser` → User (N-1)

---

### 5. **Match** (Match)
Lưu các match giữa người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `user1Id` | String | ID người dùng 1 (FK) |
| `user2Id` | String | ID người dùng 2 (FK) |
| `status` | MatchStatus | Trạng thái (Default: active) |
| `matchedAt` | DateTime | Ngày match |
| `updatedAt` | DateTime | Ngày cập nhật |

**Unique Constraint:**
- `(user1Id, user2Id)` - Mỗi cặp chỉ match 1 lần

**Relations:**
- `user1` → User (N-1)
- `user2` → User (N-1)

---

### 6. **Story** (Story)
Lưu stories của người dùng (tương tự Instagram).

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `userId` | String | ID người dùng (FK) |
| `mediaType` | StoryMediaType | Loại media (image/text) |
| `mediaUrl` | String | URL media (Optional) |
| `textContent` | String | Nội dung text (Optional) |
| `caption` | String | Chú thích (Optional) |
| `createdAt` | DateTime | Ngày tạo |
| `expiresAt` | DateTime | Ngày hết hạn |

**Indexes:**
- `(userId, expiresAt)` - Lấy story của user chưa hết hạn
- `expiresAt` - Xóa story hết hạn

**Relations:**
- `user` → User (N-1)

---

### 7. **Share** (Chia sẻ)
Lưu lịch sử chia sẻ profile/story.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `userId` | String | ID người chia sẻ (FK) |
| `targetType` | ShareTargetType | Loại mục tiêu (profile/story) |
| `targetId` | String | ID mục tiêu |
| `channel` | String | Kênh chia sẻ (facebook, whatsapp, etc) |
| `createdAt` | DateTime | Ngày tạo |

**Indexes:**
- `(targetType, targetId)` - Lấy chia sẻ theo mục tiêu

**Relations:**
- `user` → User (N-1)

---

### 8. **Block** (Chặn)
Lưu danh sách chặn người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `blockerUserId` | String | ID người chặn (FK) |
| `blockedUserId` | String | ID người bị chặn (FK) |
| `reason` | String | Lý do chặn (Optional) |
| `createdAt` | DateTime | Ngày tạo |

**Unique Constraint:**
- `(blockerUserId, blockedUserId)` - Mỗi cặp chỉ chặn 1 lần

**Relations:**
- `blocker` → User (N-1)
- `blocked` → User (N-1)

---

### 9. **Report** (Báo cáo)
Lưu báo cáo vi phạm.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `reporterUserId` | String | ID người báo cáo (FK) |
| `reportedUserId` | String | ID người bị báo cáo (FK, Optional) |
| `targetType` | String | Loại mục tiêu (user, message, story) |
| `targetId` | String | ID mục tiêu (Optional) |
| `reason` | String | Lý do báo cáo |
| `details` | String | Chi tiết (Optional) |
| `status` | ReportStatus | Trạng thái (Default: open) |
| `createdAt` | DateTime | Ngày tạo |

**Indexes:**
- `(targetType, targetId)` - Lấy báo cáo theo mục tiêu
- `(status, createdAt)` - Lấy báo cáo chưa xử lý

**Relations:**
- `reporter` → User (N-1)
- `reportedUser` → User (N-1, Optional)

---

### 10. **Conversation** (Hội thoại)
Lưu hội thoại chat.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `type` | ConversationType | Loại (Default: direct) |
| `createdAt` | DateTime | Ngày tạo |
| `updatedAt` | DateTime | Ngày cập nhật |

**Indexes:**
- `updatedAt` - Sắp xếp hội thoại gần đây

**Relations:**
- `participants` → ConversationParticipant (1-N)
- `messages` → Message (1-N)

---

### 11. **ConversationParticipant** (Thành viên hội thoại)
Lưu thành viên của hội thoại.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `conversationId` | String | ID hội thoại (FK) |
| `userId` | String | ID người dùng (FK) |
| `joinedAt` | DateTime | Ngày tham gia |
| `lastReadAt` | DateTime | Lần đọc cuối (Optional) |

**Unique Constraint:**
- `(conversationId, userId)` - Mỗi user chỉ tham gia 1 lần

**Indexes:**
- `(userId, joinedAt)` - Lấy hội thoại của user

**Relations:**
- `conversation` → Conversation (N-1)
- `user` → User (N-1)

---

### 12. **Message** (Tin nhắn)
Lưu tin nhắn trong hội thoại.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `conversationId` | String | ID hội thoại (FK) |
| `senderUserId` | String | ID người gửi (FK) |
| `parentMessageId` | String | ID tin nhắn gốc (FK, Optional) - Dùng cho reply |
| `messageType` | MessageType | Loại tin nhắn (Default: text) |
| `textContent` | String | Nội dung text (Optional) |
| `mediaUrl` | String | URL media (Optional) |
| `fileName` | String | Tên tệp (Optional) |
| `mimeType` | String | MIME type (Optional) |
| `fileSize` | Int | Kích thước tệp (Optional) |
| `durationSeconds` | Int | Thời lượng audio (Optional) |
| `forwardedFromMessageId` | String | ID tin nhắn được forward (FK, Optional) |
| `pinnedAt` | DateTime | Ngày ghim (Optional) |
| `createdAt` | DateTime | Ngày tạo |
| `deliveredAt` | DateTime | Ngày gửi thành công (Optional) |
| `seenAt` | DateTime | Ngày xem (Optional) |
| `recalledAt` | DateTime | Ngày thu hồi (Optional) |
| `deletedAt` | DateTime | Ngày xóa (Optional) |

**Indexes:**
- `(conversationId, createdAt)` - Lấy tin nhắn theo hội thoại
- `parentMessageId` - Lấy reply của tin nhắn
- `forwardedFromMessageId` - Lấy forward của tin nhắn
- `(conversationId, pinnedAt)` - Lấy tin nhắn ghim

**Relations:**
- `conversation` → Conversation (N-1)
- `sender` → User (N-1)
- `parentMessage` → Message (N-1, Optional) - Self-join
- `replies` → Message (1-N) - Self-join
- `forwardedFromMessage` → Message (N-1, Optional) - Self-join
- `forwardedMessages` → Message (1-N) - Self-join
- `receipts` → MessageReceipt (1-N)
- `reactions` → MessageReaction (1-N)

---

### 13. **MessageReceipt** (Biên nhận tin nhắn)
Lưu trạng thái gửi/xem tin nhắn cho mỗi người nhận.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `messageId` | String | ID tin nhắn (FK) |
| `userId` | String | ID người nhận (FK) |
| `deliveredAt` | DateTime | Ngày gửi thành công (Optional) |
| `seenAt` | DateTime | Ngày xem (Optional) |
| `createdAt` | DateTime | Ngày tạo |

**Unique Constraint:**
- `(messageId, userId)` - Mỗi user chỉ có 1 receipt/tin nhắn

**Indexes:**
- `(userId, deliveredAt, seenAt)` - Lấy tin nhắn chưa xem

**Relations:**
- `message` → Message (N-1)
- `user` → User (N-1)

---

### 14. **MessageReaction** (Reaction tin nhắn)
Lưu emoji reaction trên tin nhắn.

| Coll | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `messageId` | String | ID tin nhắn (FK) |
| `userId` | String | ID người reaction (FK) |
| `emoji` | String | Emoji (❤️, 👍, 😂, etc) |
| `createdAt` | DateTime | Ngày tạo |

**Unique Constraint:**
- `(messageId, userId, emoji)` - Mỗi user chỉ reaction 1 emoji/tin nhắn

**Indexes:**
- `(messageId, createdAt)` - Lấy reaction của tin nhắn

**Relations:**
- `message` → Message (N-1)
- `user` → User (N-1)

---

### 15. **Notification** (Thông báo)
Lưu thông báo cho người dùng.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | ID duy nhất |
| `userId` | String | ID người nhận (FK) |
| `type` | NotificationType | Loại thông báo |
| `title` | String | Tiêu đề |
| `body` | String | Nội dung (Optional) |
| `data` | JSON | Dữ liệu bổ sung (Optional) |
| `isRead` | Boolean | Đã đọc? (Default: false) |
| `createdAt` | DateTime | Ngày tạo |
| `readAt` | DateTime | Ngày đọc (Optional) |

**Indexes:**
- `(userId, isRead, createdAt)` - Lấy thông báo chưa đọc

**Relations:**
- `user` → User (N-1)

---

## 🔗 Mối Quan Hệ Chính

### User → Like → User (Thích)
```
User A --like--> User B
```
- Một user có thể like nhiều user khác
- Mỗi cặp user chỉ like 1 lần

### User → Match → User (Match)
```
User A <--match--> User B
```
- Khi cả 2 user like nhau → tạo Match
- Status: active, unmatched, blocked

### User → Conversation ← User (Chat)
```
User A <--conversation--> User B
```
- Mỗi hội thoại có 2 participant (direct message)
- Một user có thể có nhiều hội thoại

### Conversation → Message → User (Tin nhắn)
```
Conversation
  ├── Message (User A gửi)
  ├── Message (User B gửi)
  └── Message (User A gửi)
```
- Mỗi tin nhắn thuộc 1 hội thoại
- Mỗi tin nhắn có 1 người gửi

### Message → MessageReceipt → User (Trạng thái tin nhắn)
```
Message
  ├── Receipt (User B: delivered, seen)
  └── Receipt (User C: delivered, not seen)
```
- Mỗi tin nhắn có receipt cho mỗi người nhận
- Lưu trạng thái: delivered, seen

### Message → MessageReaction → User (Reaction)
```
Message
  ├── Reaction (User A: ❤️)
  ├── Reaction (User B: 👍)
  └── Reaction (User A: 😂)
```
- Mỗi user có thể reaction nhiều emoji trên 1 tin nhắn
- Mỗi user chỉ reaction 1 emoji/tin nhắn

### Message → Message (Reply/Forward)
```
Message A (gốc)
  ├── Message B (reply to A)
  └── Message C (forward from A)
```
- Tin nhắn có thể reply tin nhắn khác
- Tin nhắn có thể forward từ tin nhắn khác

### User → Story (Story)
```
User
  ├── Story 1 (expires in 24h)
  ├── Story 2 (expires in 24h)
  └── Story 3 (expires in 24h)
```
- Mỗi user có thể có nhiều story
- Story tự động hết hạn sau 24h

### User → Block → User (Chặn)
```
User A --block--> User B
```
- User A chặn User B
- User B không thể nhìn thấy User A

### User → Report (Báo cáo)
```
User A --report--> User B (hoặc Message, Story)
```
- Báo cáo user, message, hoặc story
- Status: open, reviewed, rejected, actioned

---

## 📈 Thống Kê Database

| Loại | Số lượng |
|---|---|
| **Bảng** | 15 |
| **Enums** | 8 |
| **Foreign Keys** | 30+ |
| **Unique Constraints** | 10+ |
| **Indexes** | 20+ |

---

## 🚀 Tối ưu hóa

### Indexes được sử dụng:
1. **Tìm kiếm địa lý:** `User(latitude, longitude)`
2. **Sắp xếp gần đây:** `Conversation(updatedAt)`, `User(lastActiveAt)`
3. **Lấy tin nhắn:** `Message(conversationId, createdAt)`
4. **Lấy thông báo chưa đọc:** `Notification(userId, isRead, createdAt)`
5. **Lấy story chưa hết hạn:** `Story(userId, expiresAt)`

### Cascade Delete:
- Xóa User → xóa tất cả photos, stories, messages, etc
- Xóa Conversation → xóa tất cả messages
- Xóa Message → xóa tất cả reactions, receipts

---

## 💾 Seed Data

Tài khoản mặc định:
- **Email:** `linh@example.com`
- **Password:** `Password123!`
- **Giới tính:** Female
- **Quan tâm:** Male
- **Vị trí:** Hanoi, Vietnam (21.0285°N, 105.8542°E)

---

## 📝 Ghi chú

- Database sử dụng UUID cho tất cả primary keys
- Timestamps: `createdAt`, `updatedAt` tự động
- Soft delete: `deletedAt`, `recalledAt` cho tin nhắn
- Realtime: `deliveredAt`, `seenAt` cập nhật qua WebSocket
- Vị trí: Decimal(9,6) cho độ chính xác cao

