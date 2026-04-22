# Chat + Notification + Block/Report

## 1. Phạm vi mở rộng
Bổ sung 4 năng lực sau cho MVP:
- Chat 1-1 sau khi match
- Notification trong app
- Block user
- Report user / story / message

## 2. Rule nghiệp vụ
### Chat
- Chỉ được tạo hội thoại direct khi 2 user đang có `match.status = active`
- Nếu một trong hai bên block nhau, không thể mở hoặc gửi tin nhắn
- Tin nhắn hỗ trợ `text` và `image`

### Notification
- Khi có tin nhắn mới, tạo notification cho người nhận
- Khi ghép đôi, nên tạo notification `match_created`
- Có API đọc danh sách và đánh dấu đã đọc toàn bộ

### Block
- Block làm ẩn đối tượng khỏi discover
- Block ngăn chat 2 chiều
- Nếu đã có match thì chuyển trạng thái match sang `blocked`

### Report
- Cho phép report theo `targetType`: `user`, `story`, `message`
- Report lưu lý do và mô tả bổ sung
- Admin xử lý ở backoffice giai đoạn sau

## 3. Endpoint mới
- `POST /api/conversations`
- `GET /api/conversations`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`
- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `POST /api/blocks`
- `GET /api/blocks`
- `DELETE /api/blocks/:targetUserId`
- `POST /api/reports`
- `GET /api/reports/mine`

## 4. Hướng UI đề xuất
- Tab `Chats`
- Badge notification ở top bar
- Nút `Block` và `Report` trong profile/menu 3 chấm
- Dialog xác nhận khi block/report
