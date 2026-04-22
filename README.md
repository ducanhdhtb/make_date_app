# NearMatch Dating App - Full Stack MVP

**NearMatch** là ứng dụng hẹn hò giúp kết nối những người phù hợp xung quanh bạn.

## 📚 Tài liệu

- **[USER_GUIDE.md](USER_GUIDE.md)** - Hướng dẫn sử dụng app cho người dùng cuối
- **[TEST_PLAN.md](e2e-playwright-java/TEST_PLAN.md)** - Kế hoạch kiểm thử E2E (104 test cases)
- **[JENKINS_SETUP.md](JENKINS_SETUP.md)** - Hướng dẫn setup Jenkins CI/CD
- **[GITHUB_TOKEN_JENKINS.md](docs/GITHUB_TOKEN_JENKINS.md)** - Hướng dẫn tạo GitHub token cho Jenkins

---

## 🚀 Chạy local nhanh

```bash
# Clone repo
git clone https://github.com/ducanhdhtb/make_date_app.git
cd make_date_app

# Chạy toàn bộ stack (web + api + postgres)
docker compose up -d

# Chờ services khởi động (30-60 giây)
# Kiểm tra logs
docker compose logs -f
```

**Sau khi chạy:**
- 🌐 **Web**: http://localhost:3002
- 🔌 **API**: http://localhost:3001/api
- 🗄️ **PostgreSQL**: localhost:5432

**Tài khoản demo:**
- Email: `linh@example.com`
- Password: `Password123!`

---

## 🏗️ Kiến trúc

```
make_date_app/
├── apps/
│   ├── api/              # NestJS backend (TypeScript)
│   │   ├── src/
│   │   │   ├── auth/     # Authentication (JWT)
│   │   │   ├── users/    # User management
│   │   │   ├── likes/    # Like/Match system
│   │   │   ├── conversations/  # Chat
│   │   │   ├── stories/  # Story feature
│   │   │   ├── notifications/  # Notifications
│   │   │   └── realtime/ # WebSocket (Socket.IO)
│   │   └── prisma/       # Database schema & seed
│   │
│   └── web/              # Next.js frontend (TypeScript + React)
│       └── app/          # App Router
│           ├── auth/     # Login/Register pages
│           ├── discover/ # Discover users
│           ├── matches/  # Matches list
│           ├── chats/    # Chat interface
│           ├── stories/  # Story feed
│           ├── notifications/  # Notifications
│           └── profile/  # User profile
│
├── e2e-playwright-java/  # E2E test suite (Playwright Java + JUnit 5)
│   ├── src/test/java/
│   │   └── com/nearmatch/e2e/
│   │       ├── api/      # 57 API tests
│   │       └── *.java    # 47 UI tests
│   └── TEST_PLAN.md      # Test documentation
│
├── docker-compose.yml    # Docker orchestration
├── Jenkinsfile           # CI/CD pipeline
└── README.md             # File này
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL 15 + Prisma ORM
- **Authentication**: JWT (Passport.js)
- **Realtime**: Socket.IO
- **File Upload**: Cloudinary
- **Validation**: class-validator

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18 + Fomantic UI
- **State**: React Context + Hooks
- **HTTP Client**: Axios
- **Realtime**: Socket.IO Client

### Testing & CI/CD
- **E2E Testing**: Playwright Java 1.46 + JUnit 5
- **API Testing**: Playwright APIRequestContext
- **Reporting**: Allure 2.27
- **CI/CD**: Jenkins + GitHub Webhooks
- **Total Tests**: 104 (47 UI + 57 API)

---

## 📦 Cài đặt Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Java 17+ (cho E2E tests)
- Maven 3.9+ (cho E2E tests)

### 1. Setup Backend

```bash
cd apps/api

# Install dependencies
npm install

# Setup database
cp .env.example .env
# Sửa DATABASE_URL trong .env nếu cần

# Run migrations & seed
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run start:dev
# API chạy tại http://localhost:3001
```

### 2. Setup Frontend

```bash
cd apps/web

# Install dependencies
npm install

# Setup env
cp .env.example .env
# Sửa NEXT_PUBLIC_API_URL nếu cần

# Start dev server
npm run dev
# Web chạy tại http://localhost:3002
```

### 3. Chạy E2E Tests

```bash
cd e2e-playwright-java

# Install Playwright browsers
mvn generate-test-resources

# Run all tests
mvn test

# Run with UI (không headless)
mvn test -Dheadless=false

# Run specific test class
mvn test -Dtest="AuthApiTest"

# Generate Allure report
mvn allure:serve
```

---

## 🎯 Tính năng chính

### ✅ Đã hoàn thành (v13)

| Tính năng | Mô tả |
|---|---|
| **Authentication** | Đăng ký, đăng nhập, JWT tokens |
| **User Profile** | Chỉnh sửa profile, upload avatar, sở thích |
| **Discover** | Tìm người dùng gần đây, lọc theo tuổi/giới tính/khoảng cách |
| **Like & Match** | Thả tim, match khi cả 2 thích nhau |
| **Chat** | Nhắn tin realtime, upload ảnh, typing indicator |
| **Message Actions** | Reply, forward, pin, recall, delete, emoji reactions |
| **Story** | Đăng story text/image, tự động xóa sau 24h |
| **Notifications** | Thông báo match, tin nhắn, like mới |
| **Block & Report** | Chặn/báo cáo người dùng vi phạm |
| **Realtime** | WebSocket cho chat, notifications, typing |
| **File Upload** | Cloudinary integration cho ảnh/file |

### 🔄 Realtime Features

**WebSocket Events:**
- `message.new` - Tin nhắn mới
- `message.reaction` - Emoji reaction
- `typing.start` / `typing.stop` - Typing indicator
- `conversation.read` - Đánh dấu đã đọc
- `notification.new` - Thông báo mới
- `match.created` - Match mới
- `user.blocked` - Người dùng bị chặn

---

## 🧪 Testing

### Test Coverage

| Loại | Số lượng | Mô tả |
|---|---|---|
| **E2E UI Tests** | 47 | Test luồng người dùng qua trình duyệt |
| **API Tests** | 57 | Test REST API endpoints |
| **Total** | **104** | Full coverage cho MVP |

### Test Suites

**UI Tests:**
- HomePage (7 tests)
- Auth: Login, Register, Redirect (6 tests)
- Discover (7 tests)
- Matches (4 tests)
- Chats (5 tests)
- Stories (6 tests)
- Notifications (6 tests)
- Profile Edit (6 tests)

**API Tests:**
- Auth API (11 tests)
- Users API (10 tests)
- Likes & Matches API (8 tests)
- Conversations API (13 tests)
- Stories API (9 tests)
- Notifications API (6 tests)

### Chạy Tests

```bash
# Toàn bộ suite
cd e2e-playwright-java
mvn test

# Chỉ UI tests
mvn test -Dtest="*Test" -DexcludeGroups="api"

# Chỉ API tests
mvn test -Dtest="*ApiTest"

# Với custom URLs
mvn test -DbaseUrl=http://localhost:3002 -DapiUrl=http://localhost:3001/api/

# Generate Allure report
mvn allure:report
mvn allure:serve
```

---

## 🔄 CI/CD Pipeline

### Jenkins Setup

Pipeline tự động chạy khi push code lên GitHub:

```
GitHub Push → Webhook → Jenkins
  ├── Checkout code
  ├── Install Playwright browsers
  ├── Run 104 tests (E2E + API)
  ├── Generate Allure report
  └── Send email với kết quả
```

**Xem chi tiết:** [JENKINS_SETUP.md](JENKINS_SETUP.md)

### Jenkins Job

- **URL**: http://localhost:8080/job/nearmatch-e2e/
- **Trigger**: GitHub webhook (auto)
- **Email**: ducanhdhtb@gmail.com
- **Reports**: Allure + JUnit

---

## 📝 Database Schema

### Core Models

```prisma
User {
  id, email, passwordHash
  displayName, dateOfBirth, gender
  bio, interests[], photos[]
  latitude, longitude
  createdAt, updatedAt
}

Like {
  id, userId, targetUserId
  createdAt
}

Match {
  id, user1Id, user2Id
  matchedAt
}

Conversation {
  id, participants[]
  createdAt, updatedAt
}

Message {
  id, conversationId, senderId
  textContent, mediaUrl, mediaType
  fileName, mimeType, fileSize
  replyToMessageId, forwardedFromMessageId
  recalledAt, deletedAt, pinnedAt
  deliveredAt, seenAt
  createdAt
}

Story {
  id, userId
  mediaType, mediaUrl, textContent
  createdAt, expiresAt
}

Notification {
  id, userId, type
  title, body, payload
  isRead, createdAt
}

Block {
  id, blockerId, blockedId
  createdAt
}

Report {
  id, reporterId, reportedId
  reason, description
  createdAt
}
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register    # Đăng ký
POST   /api/auth/login       # Đăng nhập
GET    /api/auth/me          # Lấy thông tin user hiện tại
```

### Users
```
GET    /api/users/discover   # Tìm người dùng (có filter)
GET    /api/users/:id        # Xem profile
PUT    /api/users/me         # Cập nhật profile
POST   /api/users/upload     # Upload avatar
```

### Likes & Matches
```
POST   /api/likes            # Thả tim
GET    /api/matches          # Danh sách matches
```

### Conversations & Messages
```
GET    /api/conversations                              # Danh sách hội thoại
POST   /api/conversations                              # Tạo hội thoại mới
GET    /api/conversations/:id/messages                 # Lấy tin nhắn
POST   /api/conversations/:id/messages                 # Gửi tin nhắn
PATCH  /api/conversations/:id/messages/:msgId/recall   # Thu hồi tin nhắn
DELETE /api/conversations/:id/messages/:msgId          # Xóa tin nhắn
POST   /api/conversations/:id/messages/:msgId/reaction # Thêm reaction
GET    /api/conversations/:id/pins                     # Tin nhắn đã pin
```

### Stories
```
GET    /api/stories/feed     # Xem story feed
POST   /api/stories          # Đăng story
DELETE /api/stories/:id      # Xóa story
```

### Notifications
```
GET    /api/notifications           # Danh sách thông báo
POST   /api/notifications/read-all  # Đánh dấu tất cả đã đọc
```

### Block & Report
```
POST   /api/blocks           # Chặn người dùng
POST   /api/reports          # Báo cáo người dùng
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/dating_app"
JWT_SECRET="your-secret-key"
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
```

### Frontend (.env)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

---

## 📊 Version History

### v13 (Current) - 2026-04-22
- ✅ Pin/unpin messages
- ✅ Forward messages
- ✅ File/audio attachments
- ✅ Complete E2E test suite (104 tests)
- ✅ Jenkins CI/CD pipeline
- ✅ Allure reporting

### v12
- Reply/quote messages
- Emoji reactions realtime
- Search in conversation

### v11
- Typing indicator
- Message recall/delete
- Upload progress

### v9-v10
- Image preview before send
- Resend failed messages
- Infinite scroll chat history

### v8
- Delivered/seen status
- Cloudinary image upload
- Socket reconnect UX

### v6-v7
- Block/report modal UX
- Unread count per conversation
- Polling for realtime updates

---

## 🤝 Contributing

1. Fork repo
2. Tạo branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Tạo Pull Request

---

## 📄 License

MIT License - xem file LICENSE

---

## 👥 Team

- **Developer**: ducanhdhtb
- **GitHub**: https://github.com/ducanhdhtb/make_date_app
- **Email**: ducanhdhtb@gmail.com

---

## 🆘 Support

**Gặp vấn đề?**
- Tạo issue: https://github.com/ducanhdhtb/make_date_app/issues
- Email: ducanhdhtb@gmail.com

**Tài liệu:**
- User Guide: [USER_GUIDE.md](USER_GUIDE.md)
- Test Plan: [TEST_PLAN.md](e2e-playwright-java/TEST_PLAN.md)
- Jenkins Setup: [JENKINS_SETUP.md](JENKINS_SETUP.md)

---

**NearMatch** - Kết nối những trái tim gần nhau ❤️
