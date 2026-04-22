# ERD chuẩn hóa

## 1. Nhóm tài khoản & hồ sơ
- `users`
- `user_photos`
- `user_interests`

Quan hệ:
- `users (1) - (n) user_photos`
- `users (1) - (n) user_interests`

## 2. Nhóm tương tác hẹn hò
- `likes`
- `matches`
- `stories`
- `shares`

Quan hệ:
- `users (1) - (n) likes` theo 2 vai trò gửi/nhận
- `users (1) - (n) stories`
- `users (1) - (n) shares`
- `matches` lưu cặp người dùng đã ghép nối

## 3. Nhóm an toàn
- `blocks`
- `reports`

Quan hệ:
- `users (1) - (n) blocks` theo 2 vai trò blocker/blocked
- `users (1) - (n) reports` theo vai trò reporter/reported_user

## 4. Nhóm chat
- `conversations`
- `conversation_participants`
- `messages`

Quan hệ:
- `conversations (1) - (n) conversation_participants`
- `users (1) - (n) conversation_participants`
- `conversations (1) - (n) messages`
- `users (1) - (n) messages` theo vai trò sender

## 5. Nhóm thông báo
- `notifications`

Quan hệ:
- `users (1) - (n) notifications`

## 6. Gợi ý chuẩn hóa
- Tách `user_interests` khỏi `users` để tránh lưu mảng text khó query
- Tách `conversation_participants` để mở đường cho group chat sau này
- `blocks` và `reports` độc lập để không trộn rule an toàn với `matches`
- `notifications.data` dùng JSON để linh hoạt gắn `conversationId`, `senderUserId`, `matchId`
