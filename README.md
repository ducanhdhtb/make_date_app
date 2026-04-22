# Dating App MVP v6

Bản v6 bổ sung thêm:
- modal UX cho block/report ở profile và chat
- unread count theo từng conversation
- polling ngắn cho chats và notifications để giả lập realtime ở môi trường dev local
- thông báo có thể điều hướng thẳng vào hội thoại nếu payload chứa `conversationId`

## Chạy local nhanh

```bash
docker compose up
```

Sau khi chạy:
- Web: http://localhost:3000
- API: http://localhost:3001/api

## Điểm đáng chú ý

- Chat list hiển thị badge unread cho từng hội thoại.
- Khi mở hội thoại, backend cập nhật `lastReadAt` và unread count về 0.
- Notification dropdown và trang notifications tự refresh theo chu kỳ ngắn để người dùng thấy thay đổi mới.
- Block/report không còn dùng `prompt`, thay bằng modal frontend.


## Realtime WebSocket

- Backend dùng Socket.IO namespace: `/realtime`
- Frontend dùng `socket.io-client`
- Biến môi trường frontend:
  - `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`

Sự kiện chính:
- `message.new`
- `conversation.read`
- `notification.new`
- `notification.read_all`
- `match.created`
- `user.blocked`


## Update v8
- Chat có `delivered / seen status`.
- Hỗ trợ upload ảnh chat qua Cloudinary.
- Frontend có UX reconnect khi socket mất kết nối, kèm nút thử lại.


## Update v9
- Preview ảnh trước khi gửi trong chat.
- Resend cho tin nhắn/upload lỗi ngay trong cửa sổ chat.
- API lịch sử chat hỗ trợ `before` + `limit`, frontend dùng infinite scroll để tải tin nhắn cũ dần.


## Frontend chat UX nâng cấp

- Optimistic UI cho tin nhắn đang gửi
- Nén ảnh phía client trước khi upload chat
- Virtualized message list + infinite scroll cho hội thoại dài


## Chat enhancements v11
- WebSocket typing indicator: `typing.start`, `typing.stop`
- Message actions: `PATCH /api/conversations/:conversationId/messages/:messageId/recall`, `DELETE /api/conversations/:conversationId/messages/:messageId`
- Chat image upload now shows upload progress on client
- Message model adds `recalledAt` and `deletedAt` for soft actions


## v12 additions
- Reply/quote message trong chat
- Emoji reaction realtime
- Search trong hội thoại qua query q


## v13 chat additions

- Pin/unpin message
- Forward message to another conversation
- Upload file/audio attachment in chat
- Message payload now includes `fileName`, `mimeType`, `fileSize`, `durationSeconds`, `pinnedAt`, `forwardedFromMessage`
