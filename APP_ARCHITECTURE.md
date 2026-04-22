# NearMatch Dating App - Kiến Trúc & Nội Dung Toàn Bộ

**Ngày tạo:** 2026-04-22  
**Phiên bản:** v13  
**Trạng thái:** Production-ready MVP  
**Ngôn ngữ:** Vietnamese

---

## 📱 Tổng Quan App

**NearMatch** là ứng dụng dating hiện đại với các tính năng:
- ✅ Xác thực người dùng (Login/Register)
- ✅ Khám phá người dùng gần đó (Discover)
- ✅ Hệ thống Like/Match
- ✅ Chat realtime với WebSocket
- ✅ Stories (tương tự Instagram)
- ✅ Notifications
- ✅ Block/Report users
- ✅ E2E testing với Playwright Java
- ✅ CI/CD với Jenkins

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  apps/web - React + TypeScript + Tailwind CSS               │
│  - Pages: Home, Auth, Discover, Matches, Chats, Stories     │
│  - Realtime: Socket.IO client                               │
│  - State: React hooks + localStorage                        │
└─────────────────────────────────────────────────────────────┘
                            ↕ (HTTP + WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                           │
│  apps/api - Node.js + TypeScript + NestJS                   │
│  - REST API: /api/auth, /users, /conversations, etc         │
│  - WebSocket: /realtime (Socket.IO)                         │
│  - Database: PostgreSQL + Prisma ORM                        │
│  - Upload: Cloudinary                                       │
└─────────────────────────────────────────────────────────────┘
                            ↕ (SQL)
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
│  - 15 bảng chính                                            │
│  - 30+ foreign keys                                         │
│  - Indexes tối ưu cho tìm kiếm địa lý                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu Trúc Thư Mục

```
make_date_app/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/                 # Xác thực (Login/Register)
│   │   │   ├── users/                # Quản lý người dùng
│   │   │   ├── blocks/               # Chặn người dùng
│   │   │   ├── likes/                # Hệ thống like
│   │   │   ├── matches/              # Hệ thống match
│   │   │   ├── conversations/        # Chat
│   │   │   ├── messages/             # Tin nhắn
│   │   │   ├── stories/              # Stories
│   │   │   ├── notifications/        # Thông báo
│   │   │   ├── reports/              # Báo cáo
│   │   │   ├── shares/               # Chia sẻ
│   │   │   ├── realtime/             # WebSocket
│   │   │   ├── upload/               # Upload Cloudinary
│   │   │   ├── prisma/               # Database
│   │   │   ├── common/               # Auth guards, decorators
│   │   │   └── app.module.ts         # Root module
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   └── seed.ts               # Seed data
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── web/                          # Frontend Next.js
│       ├── app/
│       │   ├── page.tsx              # Trang chủ
│       │   ├── auth/
│       │   │   ├── login/page.tsx    # Đăng nhập
│       │   │   └── register/page.tsx # Đăng ký
│       │   ├── discover/page.tsx     # Khám phá
│       │   ├── matches/page.tsx      # Matches
│       │   ├── chats/page.tsx        # Chat
│       │   ├── stories/page.tsx      # Stories
│       │   ├── notifications/page.tsx # Thông báo
│       │   ├── profile/page.tsx      # Hồ sơ
│       │   └── layout.tsx            # Root layout
│       ├── components/
│       │   ├── layout/               # AppShell, BottomNav
│       │   ├── safety-actions/       # Block, Report
│       │   └── ...
│       ├── lib/
│       │   ├── api.ts                # API client
│       │   ├── auth.ts               # Auth helpers
│       │   ├── socket.ts             # Socket.IO client
│       │   ├── types.ts              # TypeScript types
│       │   └── ...
│       ├── package.json
│       └── Dockerfile
│
├── e2e-playwright-java/              # E2E Tests
│   ├── src/test/java/com/nearmatch/e2e/
│   │   ├── HomePageTest.java         # 7 tests
│   │   ├── LoginTest.java            # 1 test
│   │   ├── RegisterTest.java         # 4 tests
│   │   ├── AuthRedirectTest.java     # 1 test
│   │   ├── DiscoverTest.java         # 7 tests
│   │   ├── MatchesTest.java          # 4 tests
│   │   ├── ChatsTest.java            # 15 tests (NEW!)
│   │   ├── StoriesTest.java          # 6 tests
│   │   ├── NotificationsTest.java    # 6 tests
│   │   ├── ProfileEditTest.java      # 6 tests
│   │   ├── api/
│   │   │   ├── AuthApiTest.java      # 11 tests
│   │   │   ├── UsersApiTest.java     # 10 tests
│   │   │   ├── LikesApiTest.java     # 8 tests
│   │   │   ├── ConversationsApiTest.java # 13 tests
│   │   │   ├── StoriesApiTest.java   # 9 tests
│   │   │   └── NotificationsApiTest.java # 6 tests
│   │   └── BaseE2ETest.java          # Base class
│   ├── pom.xml                       # Maven config
│   ├── TEST_PLAN.md                  # Test documentation
│   └── parse-test-results.py         # Test result parser
│
├── Jenkinsfile                       # CI/CD pipeline
├── docker-compose.yml                # Docker setup
├── .gitignore
├── README.md                         # Project documentation
├── USER_GUIDE.md                     # User guide
├── JENKINS_SETUP.md                  # Jenkins setup
└── DATABASE_SCHEMA.md                # Database documentation (NEW!)
```

---

## 🔐 Xác Thực (Auth)

### Login Flow
```
1. User nhập email + password
2. Backend xác thực (bcrypt)
3. Tạo JWT token (access + refresh)
4. Lưu token vào localStorage
5. Redirect sang /discover
```

**Endpoints:**
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `POST /auth/refresh` - Làm mới token

**JWT:**
- Access token: 15 phút
- Refresh token: 7 ngày
- Secret: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`

---

## 👥 Quản Lý Người Dùng (Users)

### Thông Tin Người Dùng
```typescript
{
  id: UUID,
  email: string,
  displayName: string,
  gender: "male" | "female" | "other",
  interestedIn: "male" | "female" | "everyone",
  birthDate: Date,
  bio?: string,
  jobTitle?: string,
  avatarUrl?: string,
  city?: string,
  latitude?: number,
  longitude?: number,
  isLocationPrecise: boolean,
  isStoryPublic: boolean,
  photos: UserPhoto[],
  interests: string[],
  lastActiveAt?: Date
}
```

### Endpoints
- `GET /users/me` - Lấy thông tin hiện tại
- `PUT /users/me` - Cập nhật hồ sơ
- `GET /users/:id` - Lấy thông tin user khác
- `GET /users/discover` - Khám phá người dùng gần đó
- `POST /users/me/photos` - Upload ảnh
- `DELETE /users/me/photos/:photoId` - Xóa ảnh

---

## 💕 Hệ Thống Like/Match

### Like Flow
```
1. User A click "Thả tim" trên User B
2. Tạo Like record (fromUserId=A, toUserId=B)
3. Nếu User B đã like User A → tạo Match
4. Gửi notification cho cả 2
```

### Match Status
- `active` - Đang hoạt động
- `unmatched` - Hủy match
- `blocked` - Bị chặn

### Endpoints
- `POST /likes` - Like user
- `GET /likes/sent` - Danh sách like đã gửi
- `GET /likes/received` - Danh sách like nhận được
- `GET /matches` - Danh sách match
- `PATCH /matches/:matchId` - Cập nhật match (unmatched/blocked)

---

## 💬 Chat Realtime

### Conversation Flow
```
1. User A và User B match
2. Tạo Conversation (direct message)
3. User A gửi tin nhắn
4. WebSocket emit 'message.new' → User B
5. User B xem tin nhắn → emit 'message.seen'
```

### Message Types
- `text` - Văn bản
- `image` - Ảnh (upload Cloudinary)
- `file` - Tệp (PDF, Doc, etc)
- `audio` - Âm thanh

### Message Features
- ✅ Reply/Quote tin nhắn
- ✅ Forward tin nhắn
- ✅ Emoji reactions (❤️, 👍, 😂, 😍, 😮)
- ✅ Pin tin nhắn
- ✅ Recall/Delete tin nhắn
- ✅ Typing indicators
- ✅ Delivery status (pending, delivered, seen)
- ✅ Upload progress

### Endpoints
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

### WebSocket Events
**Client → Server:**
- `conversation.join` - Tham gia hội thoại
- `conversation.leave` - Rời hội thoại
- `typing.start` - Bắt đầu gõ
- `typing.stop` - Dừng gõ

**Server → Client:**
- `message.new` - Tin nhắn mới
- `message.updated` - Tin nhắn cập nhật
- `message.delivered` - Tin nhắn đã gửi
- `message.seen` - Tin nhắn đã xem
- `message.reaction_updated` - Reaction cập nhật
- `typing.start` - Người khác gõ
- `typing.stop` - Người khác dừng gõ
- `conversation.read` - Hội thoại đã đọc

---

## 📖 Stories

### Story Features
- ✅ Upload ảnh hoặc text
- ✅ Tự động hết hạn sau 24h
- ✅ Công khai hoặc riêng tư
- ✅ Xem lịch sử người xem

### Endpoints
- `GET /stories` - Danh sách story
- `POST /stories` - Tạo story
- `DELETE /stories/:id` - Xóa story
- `POST /stories/:id/reactions` - Thêm reaction
- `DELETE /stories/:id/reactions/:emoji` - Xóa reaction

---

## 🔔 Thông Báo (Notifications)

### Notification Types
- `match_created` - Match mới
- `new_message` - Tin nhắn mới
- `new_like` - Like mới
- `story_reaction` - Reaction story
- `system` - Hệ thống

### Endpoints
- `GET /notifications` - Danh sách thông báo
- `POST /notifications/read-all` - Đánh dấu tất cả đã đọc
- `PATCH /notifications/:id` - Đánh dấu đã đọc

---

## 🚫 Block & Report

### Block Flow
```
1. User A block User B
2. User B không thể nhìn thấy User A
3. Hội thoại bị ẩn
4. Có thể unblock sau
```

### Report Flow
```
1. User A report User B (hoặc message, story)
2. Tạo Report record
3. Admin xem xét
4. Status: open → reviewed → rejected/actioned
```

### Endpoints
- `POST /blocks` - Chặn user
- `DELETE /blocks/:userId` - Bỏ chặn
- `GET /blocks` - Danh sách chặn
- `POST /reports` - Báo cáo
- `GET /reports` - Danh sách báo cáo (admin)

---

## 🧪 Testing

### E2E Tests (Playwright Java)
**Tổng:** 119 test cases

| Loại | Số test | Mô tả |
|---|---|---|
| HomePage | 7 | Trang chủ |
| Auth | 6 | Login/Register |
| Discover | 7 | Khám phá |
| Matches | 4 | Matches |
| **Chats** | **15** | Chat realtime (NEW!) |
| Stories | 6 | Stories |
| Notifications | 6 | Thông báo |
| ProfileEdit | 6 | Hồ sơ |
| API Auth | 11 | API xác thực |
| API Users | 10 | API người dùng |
| API Likes | 8 | API like/match |
| API Conversations | 13 | API chat |
| API Stories | 9 | API stories |
| API Notifications | 6 | API thông báo |

### Chat Tests (NEW!)
```
✅ CH-01: chatsPageLoads
✅ CH-02: chatsPageShowsConversationListOrEmptyState
✅ CH-03: chatsPageRedirectsToLoginWhenNotAuthenticated
✅ CH-04: selectConversationDisplaysMessages
✅ CH-05: sendTextMessageSuccessfully
✅ CH-06: messageShowsDeliveryStatus
✅ CH-07: replyToMessageSuccessfully
✅ CH-08: addReactionToMessage
✅ CH-09: searchMessagesInConversation
✅ CH-10: typingIndicatorAppears
✅ CH-11: uploadImageMessage
✅ CH-12: conversationListUpdatesAfterNewMessage
✅ CH-13: openChatFromMatchesNavigatesToChats
✅ CH-14: socketConnectionStatusDisplayed
✅ CH-15: clearSearchFiltersMessages
```

### Test Execution
```bash
# Chạy tất cả test
mvn test -Dheadless=true

# Chạy E2E UI tests
mvn test -Dtest="HomePageTest,LoginTest,RegisterTest,AuthRedirectTest,DiscoverTest,MatchesTest,ChatsTest,StoriesTest,NotificationsTest,ProfileEditTest"

# Chạy API tests
mvn test -Dtest="AuthApiTest,UsersApiTest,LikesApiTest,ConversationsApiTest,StoriesApiTest,NotificationsApiTest"

# Chạy chat tests
mvn test -Dtest="ChatsTest"

# Chạy với giao diện
mvn test -Dheadless=false
```

---

## 🚀 CI/CD Pipeline (Jenkins)

### Stages
1. **Checkout** - Clone repo từ GitHub
2. **Install Browsers** - Cài Playwright browsers
3. **Run Tests** - Chạy E2E + API tests
4. **Generate Report** - Tạo Allure report
5. **Send Email** - Gửi kết quả qua email

### Email Notification
- **To:** ducanhdhtb@gmail.com
- **Format:** HTML
- **Nội dung:**
  - Pass/Fail/Skip counts
  - Failed test table với error traces
  - Allure report link
  - Build duration

### Trigger
- Tự động khi push lên GitHub
- Webhook: `https://github.com/ducanhdhtb/make_date_app`

---

## 🐳 Docker Setup

### Services
```yaml
web:
  - Next.js frontend
  - Port: 3002
  - Env: NEXT_PUBLIC_API_URL=http://localhost:3001/api

api:
  - NestJS backend
  - Port: 3001
  - Env: DATABASE_URL, JWT_SECRET, CLOUDINARY_*

postgres:
  - PostgreSQL database
  - Port: 5432
  - Database: nearmatch
```

### Commands
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop services
docker compose down

# Reset database
docker compose down -v
docker compose up -d
```

---

## 📊 Database Schema

**15 bảng chính:**
1. User - Người dùng
2. UserPhoto - Ảnh người dùng
3. UserInterest - Sở thích
4. Like - Thích
5. Match - Match
6. Story - Story
7. Share - Chia sẻ
8. Block - Chặn
9. Report - Báo cáo
10. Conversation - Hội thoại
11. ConversationParticipant - Thành viên
12. Message - Tin nhắn
13. MessageReceipt - Biên nhận
14. MessageReaction - Reaction
15. Notification - Thông báo

**Xem chi tiết:** `DATABASE_SCHEMA.md`

---

## 🔑 Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/nearmatch
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📝 Ghi Chú Quan Trọng

### Realtime Features
- ✅ WebSocket (Socket.IO) cho chat realtime
- ✅ Typing indicators
- ✅ Delivery status (pending, delivered, seen)
- ✅ Emoji reactions
- ✅ Message receipts

### Tối ưu hóa
- ✅ Indexes cho tìm kiếm địa lý
- ✅ Pagination cho tin nhắn
- ✅ Virtual scrolling cho chat
- ✅ Image compression
- ✅ Lazy loading

### Bảo mật
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS enabled
- ✅ Input validation
- ✅ Rate limiting (có thể thêm)

### Tính năng Chưa Implement
- ❌ Video call
- ❌ Voice call
- ❌ Group chat
- ❌ Payment integration
- ❌ Admin dashboard
- ❌ Analytics

---

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- ✅ Auth
- ✅ Discover
- ✅ Like/Match
- ✅ Chat
- ✅ Stories
- ✅ Notifications
- ✅ E2E Testing

### Phase 2 (Future)
- 🔄 Video/Voice call
- 🔄 Group chat
- 🔄 Advanced filters
- 🔄 Icebreaker questions
- 🔄 Verification badges

### Phase 3 (Future)
- 🔄 Premium features
- 🔄 Payment integration
- 🔄 Admin dashboard
- 🔄 Analytics
- 🔄 Mobile app (React Native)

---

## 📞 Support

**GitHub:** https://github.com/ducanhdhtb/make_date_app  
**Jenkins:** http://localhost:8080/job/nearmatch-e2e/  
**Documentation:** README.md, USER_GUIDE.md, JENKINS_SETUP.md

---

**Tạo bởi:** Kiro AI  
**Ngôn ngữ:** Vietnamese  
**Cập nhật lần cuối:** 2026-04-22

