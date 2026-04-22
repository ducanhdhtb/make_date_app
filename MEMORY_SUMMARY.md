# 🧠 Kiro Memory - NearMatch App Summary

**Ngày cập nhật:** 2026-04-22  
**Trạng thái:** Ghi nhớ toàn bộ nội dung app

---

## 📱 App Overview

**NearMatch** - Ứng dụng dating hiện đại với chat realtime, stories, và hệ thống match thông minh.

### Tech Stack
- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend:** NestJS + Node.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Realtime:** Socket.IO (WebSocket)
- **Upload:** Cloudinary
- **Testing:** Playwright Java 1.46 + JUnit 5
- **CI/CD:** Jenkins + GitHub Webhook
- **Deployment:** Docker + Docker Compose

---

## 🎯 Core Features

### 1. Authentication
- ✅ Login/Register
- ✅ JWT tokens (access + refresh)
- ✅ Password hashing (bcrypt)
- ✅ Email validation

### 2. User Discovery
- ✅ Khám phá người dùng gần đó (geolocation)
- ✅ Bộ lọc: radius, gender, age
- ✅ Sắp xếp theo khoảng cách
- ✅ Default location: Hanoi, Vietnam (21.0285°N, 105.8542°E)

### 3. Like & Match System
- ✅ Like user
- ✅ Mutual like → Match
- ✅ Match status: active, unmatched, blocked
- ✅ Notifications khi match

### 4. Chat Realtime
- ✅ Direct message (1-1)
- ✅ Message types: text, image, file, audio
- ✅ Reply/Quote tin nhắn
- ✅ Forward tin nhắn
- ✅ Emoji reactions (❤️, 👍, 😂, 😍, 😮)
- ✅ Pin/Unpin tin nhắn
- ✅ Recall/Delete tin nhắn
- ✅ Typing indicators
- ✅ Delivery status (pending, delivered, seen)
- ✅ Upload progress
- ✅ Message search
- ✅ Infinite scroll
- ✅ Virtual scrolling (tối ưu)

### 5. Stories
- ✅ Upload ảnh hoặc text
- ✅ Tự động hết hạn sau 24h
- ✅ Công khai hoặc riêng tư
- ✅ Xem lịch sử người xem
- ✅ Emoji reactions

### 6. Notifications
- ✅ Match created
- ✅ New message
- ✅ New like
- ✅ Story reaction
- ✅ System notifications
- ✅ Mark as read

### 7. Safety Features
- ✅ Block user
- ✅ Report user/message/story
- ✅ Report status tracking
- ✅ Admin review

---

## 📊 Database (15 Tables)

### Core Tables
1. **User** - Người dùng (email, password, profile, location)
2. **UserPhoto** - Ảnh người dùng
3. **UserInterest** - Sở thích/tag
4. **Like** - Thích (fromUserId → toUserId)
5. **Match** - Match (user1 ↔ user2)
6. **Story** - Story (24h expiry)
7. **Share** - Chia sẻ profile/story
8. **Block** - Chặn user
9. **Report** - Báo cáo vi phạm

### Chat Tables
10. **Conversation** - Hội thoại (direct message)
11. **ConversationParticipant** - Thành viên hội thoại
12. **Message** - Tin nhắn (text, image, file, audio)
13. **MessageReceipt** - Biên nhận (delivered, seen)
14. **MessageReaction** - Emoji reaction

### Notification Table
15. **Notification** - Thông báo

### Key Relationships
- User → Like → User (thích)
- User ↔ Match ↔ User (match)
- User → Story (24h)
- User ↔ Conversation ↔ User (chat)
- Conversation → Message → User (tin nhắn)
- Message → MessageReceipt → User (trạng thái)
- Message → MessageReaction → User (reaction)
- Message → Message (reply/forward)

---

## 🔌 API Endpoints

### Auth
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `POST /auth/refresh` - Làm mới token

### Users
- `GET /users/me` - Thông tin hiện tại
- `PUT /users/me` - Cập nhật hồ sơ
- `GET /users/:id` - Thông tin user khác
- `GET /users/discover` - Khám phá gần đó
- `POST /users/me/photos` - Upload ảnh
- `DELETE /users/me/photos/:photoId` - Xóa ảnh

### Likes & Matches
- `POST /likes` - Like user
- `GET /likes/sent` - Like đã gửi
- `GET /likes/received` - Like nhận được
- `GET /matches` - Danh sách match
- `PATCH /matches/:matchId` - Cập nhật match

### Conversations & Messages
- `GET /conversations` - Danh sách hội thoại
- `POST /conversations` - Tạo hội thoại
- `GET /conversations/:id/messages` - Lấy tin nhắn
- `POST /conversations/:id/messages` - Gửi tin nhắn
- `POST /conversations/:id/messages/image` - Gửi ảnh
- `POST /conversations/:id/messages/attachment` - Gửi tệp
- `PATCH /conversations/:id/messages/:messageId/recall` - Thu hồi
- `DELETE /conversations/:id/messages/:messageId` - Xóa
- `POST /conversations/:id/messages/:messageId/reactions` - Thêm reaction
- `DELETE /conversations/:id/messages/:messageId/reactions/:emoji` - Xóa reaction
- `PATCH /conversations/:id/messages/:messageId/pin` - Ghim
- `DELETE /conversations/:id/messages/:messageId/pin` - Bỏ ghim

### Stories
- `GET /stories` - Danh sách story
- `POST /stories` - Tạo story
- `DELETE /stories/:id` - Xóa story
- `POST /stories/:id/reactions` - Thêm reaction
- `DELETE /stories/:id/reactions/:emoji` - Xóa reaction

### Notifications
- `GET /notifications` - Danh sách thông báo
- `POST /notifications/read-all` - Đánh dấu tất cả đã đọc
- `PATCH /notifications/:id` - Đánh dấu đã đọc

### Safety
- `POST /blocks` - Chặn user
- `DELETE /blocks/:userId` - Bỏ chặn
- `GET /blocks` - Danh sách chặn
- `POST /reports` - Báo cáo
- `GET /reports` - Danh sách báo cáo (admin)

---

## 🔌 WebSocket Events

### Client → Server
- `conversation.join` - Tham gia hội thoại
- `conversation.leave` - Rời hội thoại
- `typing.start` - Bắt đầu gõ
- `typing.stop` - Dừng gõ

### Server → Client
- `message.new` - Tin nhắn mới
- `message.updated` - Tin nhắn cập nhật
- `message.delivered` - Tin nhắn đã gửi
- `message.seen` - Tin nhắn đã xem
- `message.reaction_updated` - Reaction cập nhật
- `typing.start` - Người khác gõ
- `typing.stop` - Người khác dừng gõ
- `conversation.read` - Hội thoại đã đọc
- `notification.new` - Thông báo mới
- `match.created` - Match mới
- `user.blocked` - User bị chặn

---

## 🧪 Testing (119 Test Cases)

### E2E UI Tests (57 tests)
- **HomePageTest** (7) - Trang chủ
- **LoginTest** (1) - Đăng nhập
- **RegisterTest** (4) - Đăng ký
- **AuthRedirectTest** (1) - Redirect
- **DiscoverTest** (7) - Khám phá
- **MatchesTest** (4) - Matches
- **ChatsTest** (15) - Chat realtime ✨ NEW!
  - Message sending
  - Delivery status
  - Reply/Quote
  - Reactions
  - Image upload
  - Typing indicators
  - Search
  - Socket connection
- **StoriesTest** (6) - Stories
- **NotificationsTest** (6) - Thông báo
- **ProfileEditTest** (6) - Hồ sơ

### API Tests (62 tests)
- **AuthApiTest** (11) - Auth API
- **UsersApiTest** (10) - Users API
- **LikesApiTest** (8) - Likes API
- **ConversationsApiTest** (13) - Chat API
- **StoriesApiTest** (9) - Stories API
- **NotificationsApiTest** (6) - Notifications API

### Test Execution
```bash
mvn test -Dheadless=true              # Chạy tất cả
mvn test -Dtest="ChatsTest"           # Chạy chat tests
mvn test -Dheadless=false             # Có giao diện
```

---

## 🚀 CI/CD Pipeline (Jenkins)

### Stages
1. Checkout từ GitHub
2. Install Playwright browsers
3. Run E2E + API tests
4. Generate Allure report
5. Send email notification

### Email Notification
- **To:** ducanhdhtb@gmail.com
- **Format:** HTML
- **Nội dung:** Pass/Fail/Skip counts, failed tests, Allure link

### Trigger
- Tự động khi push lên GitHub
- Webhook: `https://github.com/ducanhdhtb/make_date_app`

---

## 🐳 Docker Setup

### Services
```yaml
web:
  - Next.js (port 3002)
  - NEXT_PUBLIC_API_URL=http://localhost:3001/api

api:
  - NestJS (port 3001)
  - DATABASE_URL, JWT_SECRET, CLOUDINARY_*

postgres:
  - PostgreSQL (port 5432)
  - Database: nearmatch
```

### Commands
```bash
docker compose up -d              # Start
docker compose logs -f api        # Logs
docker compose down               # Stop
docker compose down -v            # Reset
```

---

## 📁 Project Structure

```
make_date_app/
├── apps/api/                      # NestJS backend
│   ├── src/auth, users, conversations, stories, etc
│   ├── prisma/schema.prisma       # Database schema
│   └── Dockerfile
├── apps/web/                      # Next.js frontend
│   ├── app/page, auth, discover, chats, stories, etc
│   ├── lib/api, auth, socket, types
│   └── Dockerfile
├── e2e-playwright-java/           # E2E tests
│   ├── src/test/java/com/nearmatch/e2e/
│   ├── pom.xml
│   └── TEST_PLAN.md
├── Jenkinsfile                    # CI/CD
├── docker-compose.yml
├── DATABASE_SCHEMA.md             # Database docs ✨ NEW!
├── APP_ARCHITECTURE.md            # Architecture docs ✨ NEW!
├── README.md
├── USER_GUIDE.md
└── JENKINS_SETUP.md
```

---

## 🔑 Key Files to Remember

### Backend
- `apps/api/prisma/schema.prisma` - Database schema (15 tables)
- `apps/api/src/auth/auth.service.ts` - Login/Register logic
- `apps/api/src/conversations/conversations.service.ts` - Chat logic
- `apps/api/src/realtime/realtime.gateway.ts` - WebSocket
- `apps/api/src/users/users.service.ts` - User discovery

### Frontend
- `apps/web/app/chats/page.tsx` - Chat UI (1014 lines)
- `apps/web/lib/socket.ts` - Socket.IO client
- `apps/web/lib/api.ts` - API client
- `apps/web/app/discover/page.tsx` - Discovery UI

### Testing
- `e2e-playwright-java/src/test/java/com/nearmatch/e2e/ChatsTest.java` - 15 chat tests
- `e2e-playwright-java/TEST_PLAN.md` - Test documentation
- `e2e-playwright-java/pom.xml` - Maven config

### Documentation
- `DATABASE_SCHEMA.md` - Database structure
- `APP_ARCHITECTURE.md` - Full architecture
- `README.md` - Project overview
- `USER_GUIDE.md` - User guide
- `JENKINS_SETUP.md` - Jenkins setup

---

## 🎯 Important Notes

### Realtime Features
- ✅ WebSocket (Socket.IO) cho chat realtime
- ✅ Typing indicators
- ✅ Delivery status (pending, delivered, seen)
- ✅ Emoji reactions
- ✅ Message receipts

### Optimizations
- ✅ Indexes cho tìm kiếm địa lý
- ✅ Pagination cho tin nhắn
- ✅ Virtual scrolling cho chat
- ✅ Image compression
- ✅ Lazy loading

### Security
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS enabled
- ✅ Input validation
- ✅ Rate limiting (có thể thêm)

### Default Account
- **Email:** linh@example.com
- **Password:** Password123!
- **Location:** Hanoi, Vietnam

---

## 📞 Links

- **GitHub:** https://github.com/ducanhdhtb/make_date_app
- **Jenkins:** http://localhost:8080/job/nearmatch-e2e/
- **Frontend:** http://localhost:3002
- **Backend:** http://localhost:3001/api
- **Database:** localhost:5432

---

## 📝 Recent Updates (2026-04-22)

✅ Updated chat test cases from 5 to 15 comprehensive tests  
✅ Added DATABASE_SCHEMA.md with complete database documentation  
✅ Added APP_ARCHITECTURE.md with full architecture overview  
✅ Total test count increased from 104 to 119 tests  
✅ All tests compile successfully  
✅ Pushed to GitHub  

---

**Kiro đã ghi nhớ toàn bộ nội dung app NearMatch của bạn!** 🧠✨

Bất cứ khi nào bạn cần tôi sẽ có thể:
- Giải thích bất kỳ phần nào của app
- Tìm kiếm code trong codebase
- Thêm tính năng mới
- Sửa bugs
- Viết tests
- Cập nhật documentation

