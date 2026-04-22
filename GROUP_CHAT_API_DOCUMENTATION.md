# 📚 Group Chat API Documentation

**Version:** 1.0.0  
**Base URL:** `/api`  
**Authentication:** JWT Bearer Token  
**Last Updated:** 2026-04-22

---

## 🔐 Authentication

Tất cả endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents

1. [Group Conversations](#group-conversations)
2. [Group Messages](#group-messages)
3. [WebSocket Events](#websocket-events)
4. [Error Codes](#error-codes)

---

## 🗂️ Group Conversations

### 1. Tạo nhóm mới

**POST** `/group-conversations`

Tạo nhóm chat mới với các thành viên được chọn.

**Request Body:**
```json
{
  "name": "string (3-100 chars, required)",
  "description": "string (max 500 chars, optional)",
  "avatarUrl": "string (URL, optional)",
  "memberIds": ["string[] (min 1 member, required)"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Tên nhóm",
  "description": "Mô tả nhóm",
  "avatarUrl": "https://...",
  "createdByUserId": "uuid",
  "createdAt": "2026-04-22T10:00:00Z",
  "updatedAt": "2026-04-22T10:00:00Z",
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "role": "owner",
      "joinedAt": "2026-04-22T10:00:00Z",
      "user": {
        "id": "uuid",
        "displayName": "Nguyễn Văn A",
        "avatarUrl": "https://...",
        "email": "a@example.com"
      }
    }
  ]
}
```

**Error Codes:**
- `400` - Dữ liệu không hợp lệ
- `401` - Không có quyền truy cập
- `404` - Một số thành viên không tồn tại

**Example:**
```bash
curl -X POST https://api.example.com/api/group-conversations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nhóm dự án ABC",
    "description": "Nhóm chat cho dự án ABC",
    "memberIds": ["user-uuid-1", "user-uuid-2"]
  }'
```

---

### 2. Lấy danh sách nhóm

**GET** `/group-conversations`

Lấy danh sách tất cả nhóm mà user là thành viên.

**Query Parameters:**
- `page` (number, optional) - Trang hiện tại (default: 1)
- `limit` (number, optional) - Số item per page (default: 20, max: 100)
- `search` (string, optional) - Tìm kiếm theo tên nhóm
- `sortBy` (string, optional) - Sắp xếp theo: `createdAt`, `updatedAt`, `name` (default: `updatedAt`)
- `sortOrder` (string, optional) - Thứ tự: `asc`, `desc` (default: `desc`)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tên nhóm",
      "description": "Mô tả",
      "avatarUrl": "https://...",
      "createdAt": "2026-04-22T10:00:00Z",
      "updatedAt": "2026-04-22T10:00:00Z",
      "members": [...],
      "messages": [
        {
          "id": "uuid",
          "textContent": "Tin nhắn cuối",
          "createdAt": "2026-04-22T10:00:00Z",
          "sender": {
            "displayName": "User A"
          }
        }
      ]
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

**Example:**
```bash
curl -X GET "https://api.example.com/api/group-conversations?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

### 3. Lấy chi tiết nhóm

**GET** `/group-conversations/:id`

Lấy thông tin chi tiết của một nhóm.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Tên nhóm",
  "description": "Mô tả",
  "avatarUrl": "https://...",
  "createdByUserId": "uuid",
  "createdAt": "2026-04-22T10:00:00Z",
  "updatedAt": "2026-04-22T10:00:00Z",
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "role": "owner",
      "joinedAt": "2026-04-22T10:00:00Z",
      "user": {
        "id": "uuid",
        "displayName": "User A",
        "avatarUrl": "https://...",
        "email": "a@example.com"
      }
    }
  ],
  "createdBy": {
    "id": "uuid",
    "displayName": "User A",
    "avatarUrl": "https://..."
  }
}
```

**Error Codes:**
- `403` - Không phải thành viên của nhóm
- `404` - Nhóm không tồn tại

---

### 4. Cập nhật nhóm

**PUT** `/group-conversations/:id`

Cập nhật thông tin nhóm (chỉ owner hoặc admin).

**Request Body:**
```json
{
  "name": "string (3-100 chars, optional)",
  "description": "string (max 500 chars, optional)",
  "avatarUrl": "string (URL, optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Tên mới",
  "description": "Mô tả mới",
  "avatarUrl": "https://...",
  "updatedAt": "2026-04-22T10:00:00Z",
  "members": [...]
}
```

**Error Codes:**
- `403` - Không có quyền cập nhật (không phải owner/admin)

---

### 5. Xóa nhóm

**DELETE** `/group-conversations/:id`

Xóa nhóm (chỉ owner).

**Response:** `204 No Content`

**Error Codes:**
- `403` - Không có quyền xóa (không phải owner)

---

### 6. Thêm thành viên

**POST** `/group-conversations/:id/members`

Thêm thành viên mới vào nhóm (chỉ owner hoặc admin).

**Request Body:**
```json
{
  "userId": "string (uuid, required)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "groupConversationId": "uuid",
  "userId": "uuid",
  "role": "member",
  "joinedAt": "2026-04-22T10:00:00Z",
  "user": {
    "id": "uuid",
    "displayName": "User B",
    "avatarUrl": "https://...",
    "email": "b@example.com"
  }
}
```

**Error Codes:**
- `400` - User đã là thành viên
- `404` - User không tồn tại

---

### 7. Xóa thành viên

**DELETE** `/group-conversations/:id/members/:userId`

Xóa thành viên khỏi nhóm (chỉ owner hoặc admin).

**Response:** `204 No Content`

**Error Codes:**
- `400` - Không thể xóa owner
- `404` - Thành viên không tồn tại

---

### 8. Lấy danh sách thành viên

**GET** `/group-conversations/:id/members`

Lấy danh sách thành viên của nhóm.

**Query Parameters:**
- `page` (number, optional) - Trang hiện tại
- `limit` (number, optional) - Số item per page
- `search` (string, optional) - Tìm kiếm theo tên

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "role": "owner",
      "joinedAt": "2026-04-22T10:00:00Z",
      "user": {
        "id": "uuid",
        "displayName": "User A",
        "avatarUrl": "https://...",
        "email": "a@example.com"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

---

### 9. Rời nhóm

**POST** `/group-conversations/:id/leave`

Rời khỏi nhóm (không áp dụng cho owner).

**Response:** `204 No Content`

**Error Codes:**
- `400` - Owner không thể rời nhóm

---

## 💬 Group Messages

### 1. Gửi tin nhắn text

**POST** `/group-conversations/:id/messages`

Gửi tin nhắn text trong nhóm.

**Request Body:**
```json
{
  "textContent": "string (max 5000 chars, required)",
  "parentMessageId": "string (uuid, optional) - ID tin nhắn đang trả lời"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "groupConversationId": "uuid",
  "senderUserId": "uuid",
  "textContent": "Nội dung tin nhắn",
  "messageType": "text",
  "createdAt": "2026-04-22T10:00:00Z",
  "sender": {
    "id": "uuid",
    "displayName": "User A",
    "avatarUrl": "https://..."
  },
  "reactions": [],
  "parentMessage": null
}
```

---

### 2. Gửi tin nhắn ảnh

**POST** `/group-conversations/:id/messages/image`

Upload và gửi tin nhắn ảnh.

**Request:** `multipart/form-data`
- `file` (File, required) - File ảnh (jpg, png, gif, webp)
- `textContent` (string, optional) - Caption
- `parentMessageId` (string, optional) - ID tin nhắn đang trả lời

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "groupConversationId": "uuid",
  "senderUserId": "uuid",
  "textContent": "Caption",
  "mediaUrl": "https://res.cloudinary.com/...",
  "messageType": "image",
  "createdAt": "2026-04-22T10:00:00Z",
  "sender": {...},
  "reactions": []
}
```

**Error Codes:**
- `400` - File không hợp lệ hoặc quá lớn

---

### 3. Lấy danh sách tin nhắn

**GET** `/group-conversations/:id/messages`

Lấy danh sách tin nhắn trong nhóm (cursor-based pagination).

**Query Parameters:**
- `limit` (number, optional) - Số tin nhắn (default: 20, max: 100)
- `before` (string, optional) - Cursor (ISO date) để lấy tin nhắn cũ hơn
- `q` (string, optional) - Tìm kiếm theo nội dung

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "textContent": "Nội dung",
      "mediaUrl": null,
      "messageType": "text",
      "createdAt": "2026-04-22T10:00:00Z",
      "sender": {...},
      "reactions": [...],
      "parentMessage": null,
      "recalledAt": null,
      "deletedAt": null,
      "pinnedAt": null
    }
  ],
  "hasMore": true,
  "nextCursor": "2026-04-22T09:00:00Z"
}
```

---

### 4. Thu hồi tin nhắn

**PATCH** `/group-conversations/:id/messages/:messageId/recall`

Thu hồi tin nhắn (chỉ người gửi, trong vòng 24h).

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "recalledAt": "2026-04-22T10:00:00Z",
  ...
}
```

**Error Codes:**
- `403` - Không phải tin nhắn của mình

---

### 5. Xóa tin nhắn

**DELETE** `/group-conversations/:id/messages/:messageId`

Xóa tin nhắn (chỉ người gửi).

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "deletedAt": "2026-04-22T10:00:00Z",
  ...
}
```

---

### 6. Thêm reaction

**POST** `/group-conversations/:id/messages/:messageId/reactions`

Thêm emoji reaction vào tin nhắn.

**Request Body:**
```json
{
  "emoji": "string (1-10 chars, required) - Emoji: ❤️, 👍, 😂, 😍, 😮"
}
```

**Response:** `201 Created`
```json
[
  {
    "emoji": "❤️",
    "count": 2,
    "reacted": true,
    "users": [
      {
        "id": "uuid",
        "displayName": "User A"
      }
    ]
  }
]
```

---

### 7. Xóa reaction

**DELETE** `/group-conversations/:id/messages/:messageId/reactions/:emoji`

Xóa emoji reaction khỏi tin nhắn.

**Response:** `200 OK`
```json
[
  {
    "emoji": "❤️",
    "count": 1,
    "reacted": false,
    "users": [...]
  }
]
```

---

### 8. Ghim tin nhắn

**PATCH** `/group-conversations/:id/messages/:messageId/pin`

Ghim tin nhắn (chỉ owner hoặc admin).

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "pinnedAt": "2026-04-22T10:00:00Z",
  ...
}
```

---

### 9. Bỏ ghim tin nhắn

**DELETE** `/group-conversations/:id/messages/:messageId/pin`

Bỏ ghim tin nhắn (chỉ owner hoặc admin).

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "pinnedAt": null,
  ...
}
```

---

## 🔌 WebSocket Events

**Namespace:** `/realtime`

### Client → Server Events

#### 1. Tham gia nhóm
```javascript
socket.emit('group.join', { 
  groupConversationId: 'uuid' 
});
```

#### 2. Rời nhóm
```javascript
socket.emit('group.leave', { 
  groupConversationId: 'uuid' 
});
```

#### 3. Bắt đầu gõ
```javascript
socket.emit('group.typing.start', { 
  groupConversationId: 'uuid',
  displayName: 'User A'
});
```

#### 4. Dừng gõ
```javascript
socket.emit('group.typing.stop', { 
  groupConversationId: 'uuid' 
});
```

---

### Server → Client Events

#### 1. Tin nhắn mới
```javascript
socket.on('group.message.new', (data) => {
  // data = { groupConversationId: 'uuid', message: {...} }
});
```

#### 2. Tin nhắn cập nhật
```javascript
socket.on('group.message.updated', (data) => {
  // data = { groupConversationId: 'uuid', message: {...}, action: 'deleted' | 'recalled' | 'pinned' }
});
```

#### 3. Reaction cập nhật
```javascript
socket.on('group.message.reaction_updated', (data) => {
  // data = { groupConversationId: 'uuid', messageId: 'uuid', reactions: [...] }
});
```

#### 4. Thành viên thêm
```javascript
socket.on('group.member.added', (data) => {
  // data = { groupConversationId: 'uuid', member: {...}, user: {...} }
});
```

#### 5. Thành viên xóa
```javascript
socket.on('group.member.removed', (data) => {
  // data = { groupConversationId: 'uuid', userId: 'uuid' }
});
```

#### 6. Nhóm cập nhật
```javascript
socket.on('group.updated', (data) => {
  // data = { groupConversationId: 'uuid', group: {...}, action: 'created' | 'updated' }
});
```

#### 7. Typing indicator
```javascript
socket.on('group.typing.start', (data) => {
  // data = { groupConversationId: 'uuid', userId: 'uuid', displayName: 'User A' }
});

socket.on('group.typing.stop', (data) => {
  // data = { groupConversationId: 'uuid', userId: 'uuid' }
});
```

---

## ⚠️ Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Dữ liệu không hợp lệ |
| 401 | Unauthorized | Không có quyền truy cập |
| 403 | Forbidden | Không có quyền thực hiện hành động |
| 404 | Not Found | Resource không tồn tại |
| 409 | Conflict | Xung đột dữ liệu |
| 413 | Payload Too Large | File upload quá lớn |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Lỗi server |

---

## 📝 Rate Limits

- **API Endpoints:** 100 requests/minute
- **Message Sending:** 30 messages/minute
- **Image Upload:** 10 uploads/minute
- **WebSocket Events:** 60 events/minute

---

## 🔒 Permissions

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Update group info | ✅ | ✅ | ❌ |
| Delete group | ✅ | ❌ | ❌ |
| Add member | ✅ | ✅ | ❌ |
| Remove member | ✅ | ✅ | ❌ |
| Leave group | ❌ | ✅ | ✅ |
| Send message | ✅ | ✅ | ✅ |
| Pin message | ✅ | ✅ | ❌ |
| Recall own message | ✅ | ✅ | ✅ |
| Delete own message | ✅ | ✅ | ✅ |

---

## 📚 Related Documentation

- [User Guide](./USER_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)

---

**Last Updated:** 2026-04-22  
**API Version:** 1.0.0  
**Maintainer:** Kiro AI
