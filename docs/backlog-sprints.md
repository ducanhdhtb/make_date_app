# Backlog theo sprint cho FE / BE / QA

## Sprint 1 – Auth + Profile foundation
### FE
- Màn hình đăng ký, đăng nhập
- Form edit profile
- Lưu token localStorage
- Route guard cơ bản

### BE
- Auth register/login/me
- JWT strategy + guard
- CRUD user profile
- Prisma schema user, photo, interest

### QA
- Test auth success/fail
- Test validation profile
- Test unauthorized access

## Sprint 2 – Discover + View profile
### FE
- Trang discover
- Filter khoảng cách/giới tính/tuổi
- Trang profile chi tiết

### BE
- API discover theo vị trí
- Tính khoảng cách Haversine
- API profile public detail

### QA
- Test permission vị trí
- Test filter discover
- Test profile edge cases

## Sprint 3 – Like + Match
### FE
- Button thả tim
- Danh sách matches
- UI trạng thái matched

### BE
- API like
- Match service hai chiều
- Notification match cơ bản

### QA
- Test like trùng
- Test match khi 2 chiều like
- Test danh sách match

## Sprint 4 – Story + Share
### FE
- Story feed
- Form đăng story text/image
- Share profile/story

### BE
- API create/list story
- Expire story sau 24h
- API create share log

### QA
- Test story hết hạn
- Test upload ảnh story
- Test link share

## Sprint 5 – Docker hóa môi trường dev
### FE
- Đọc env từ compose/local
- Smoke test flow login/discover bằng local stack

### BE
- Docker compose cho postgres/api/web
- Script `prisma db push`
- Seed data tự động

### QA
- Verify `docker compose up` chạy local
- Verify API + Web + DB lên đủ service
- Smoke test seed accounts

## Sprint 6 – Chat + Notifications + Safety
### FE
- Trang chats
- Badge notifications
- Action block/report trong profile/chat

### BE
- Module conversations/messages
- Module notifications
- Module blocks
- Module reports
- Rule ngăn chat khi blocked

### QA
- Test tạo chat chỉ khi matched
- Test nhận notification khi có tin nhắn mới
- Test block làm ẩn chat/discover
- Test report user/story/message
