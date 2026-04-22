# Database Schema – Dev Ready

## Công nghệ
- PostgreSQL 15+
- Prisma ORM
- UUID primary key
- Decimal cho latitude/longitude

## Bảng hiện có trong source code
- users
- user_photos
- user_interests
- likes
- matches
- stories
- shares

## Quy tắc dữ liệu
- 1 user có nhiều ảnh và nhiều sở thích.
- 1 cặp user chỉ có 1 bản ghi like theo mỗi chiều.
- 1 cặp user chỉ có 1 match sau khi sort cặp id.
- Story hết hạn sau 24 giờ bằng `expires_at`.

## Prisma schema chính
Xem file thật tại: `apps/api/prisma/schema.prisma`

### Index quan trọng
- `users(latitude, longitude)` cho discover theo vị trí
- `users(last_active_at)` cho xếp hạng active
- `stories(expires_at)` cho lọc story còn hiệu lực
- `shares(target_type, target_id)` cho public share lookup

## Gợi ý mở rộng giai đoạn sau
- block_users
- reports
- notifications
- chats
