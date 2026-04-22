# API Spec Dev-ready

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Users
- `PUT /api/users/me`
- `POST /api/users/me/avatar`
- `POST /api/users/me/photos`
- `GET /api/users/discover?lat=&lng=&radius=&ageFrom=&ageTo=&gender=`
- `GET /api/users/:id`

## Likes & Matches
- `POST /api/likes`
  - body: `{ "targetUserId": "uuid" }`
- `GET /api/matches`

## Stories
- `POST /api/stories`
  - body: `{ "textContent": "...", "caption": "..." }` hoặc upload image
- `GET /api/stories/feed`
- `GET /api/users/:id/stories`

## Shares
- `POST /api/shares`
  - body: `{ "targetType": "profile|story", "targetId": "uuid", "channel": "copy_link" }`

## Conversations
- `POST /api/conversations`
  - body: `{ "targetUserId": "uuid" }`
- `GET /api/conversations`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`
  - body: `{ "textContent": "Hello" }` hoặc `{ "mediaUrl": "https://..." }`

## Notifications
- `GET /api/notifications`
- `POST /api/notifications/read-all`

## Blocks
- `POST /api/blocks`
  - body: `{ "targetUserId": "uuid", "reason": "spam" }`
- `GET /api/blocks`
- `DELETE /api/blocks/:targetUserId`

## Reports
- `POST /api/reports`
  - body: `{ "reportedUserId": "uuid", "targetType": "user", "reason": "fake_profile", "details": "..." }`
- `GET /api/reports/mine`

## Response notes
- Tất cả endpoint trừ auth register/login yêu cầu Bearer token
- Tất cả lỗi validation trả `400`
- Không có token hoặc token sai trả `401`
- Không đủ điều kiện chat do chưa match hoặc đã block trả `403`


## WebSocket realtime

**Namespace:** `/realtime`

**Auth:** gửi JWT access token qua `auth.token` khi kết nối Socket.IO.

**Client -> Server**
- `conversation.join` `{ conversationId }`
- `conversation.leave` `{ conversationId }`

**Server -> Client**
- `socket.ready` `{ userId }`
- `message.new` `{ conversationId, message }`
- `conversation.read` `{ conversationId, userId, readAt }`
- `notification.new` `Notification`
- `notification.read_all` `{ userId, updated, readAt }`
- `match.created` `{ matchId, userIds }`
- `user.blocked` `{ blockerUserId, blockedUserId }`


## Realtime chat v8
- `POST /api/conversations/:conversationId/messages/image` upload ảnh chat qua multipart form-data field `file`, optional `textContent`.
- Message response giờ có thêm `deliveredAt` và `seenAt`.
- WebSocket events thêm `message.delivered` và `message.seen`.


## Conversations - message history pagination
- `GET /api/conversations/:conversationId/messages?before=<ISO_DATE>&limit=20`
- Response:
```json
{
  "items": [/* messages asc */],
  "hasMore": true,
  "nextCursor": "2026-04-21T12:34:56.000Z"
}
```
- Bỏ `before` để lấy trang mới nhất. Dùng `nextCursor` làm mốc để tải trang cũ hơn.


## Frontend chat UX nâng cấp

- Optimistic UI cho tin nhắn đang gửi
- Nén ảnh phía client trước khi upload chat
- Virtualized message list + infinite scroll cho hội thoại dài


## Chat enhancements v11
- WebSocket typing indicator: `typing.start`, `typing.stop`
- Message actions: `PATCH /api/conversations/:conversationId/messages/:messageId/recall`, `DELETE /api/conversations/:conversationId/messages/:messageId`
- Chat image upload now shows upload progress on client
- Message model adds `recalledAt` and `deletedAt` for soft actions


### Conversation search and reactions
- `GET /api/conversations/:conversationId/messages?before=&limit=&q=`
- `POST /api/conversations/:conversationId/messages` body: `{ textContent?, mediaUrl?, parentMessageId? }`
- `POST /api/conversations/:conversationId/messages/image` form-data: `file`, `textContent?`, `parentMessageId?`
- `POST /api/conversations/:conversationId/messages/:messageId/reactions` body: `{ emoji }`
- `DELETE /api/conversations/:conversationId/messages/:messageId/reactions/:emoji`

Message response now includes:
- `parentMessage`
- `reactions[]` with `emoji`, `count`, `reacted`


## v13 chat additions

- Pin/unpin message
- Forward message to another conversation
- Upload file/audio attachment in chat
- Message payload now includes `fileName`, `mimeType`, `fileSize`, `durationSeconds`, `pinnedAt`, `forwardedFromMessage`
