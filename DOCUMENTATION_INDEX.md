# 📚 NearMatch Documentation Index

**Ngày cập nhật:** 2026-04-22  
**Trạng thái:** Complete Documentation Set

---

## 📖 Tài Liệu Chính

### 1. **MEMORY_SUMMARY.md** ⭐ START HERE
   - **Mục đích:** Tóm tắt nhanh toàn bộ app
   - **Nội dung:**
     - App overview
     - Core features
     - Database summary
     - API endpoints
     - WebSocket events
     - Testing summary
     - CI/CD pipeline
   - **Dùng khi:** Cần hiểu nhanh app là gì

### 2. **DATABASE_SCHEMA.md** 🗄️
   - **Mục đích:** Tài liệu chi tiết về database
   - **Nội dung:**
     - 15 bảng chính
     - 8 enums
     - Mối quan hệ (relationships)
     - Indexes
     - Constraints
     - Cascade delete
   - **Dùng khi:** Cần hiểu cấu trúc database

### 3. **APP_ARCHITECTURE.md** 🏗️
   - **Mục đích:** Kiến trúc toàn bộ hệ thống
   - **Nội dung:**
     - Tech stack
     - Cấu trúc thư mục
     - Xác thực (Auth)
     - Quản lý người dùng
     - Like/Match system
     - Chat realtime
     - Stories
     - Notifications
     - Block & Report
     - Testing
     - CI/CD
     - Docker setup
   - **Dùng khi:** Cần hiểu toàn bộ kiến trúc

### 4. **ARCHITECTURE_DIAGRAM.md** 📊
   - **Mục đích:** Diagrams trực quan
   - **Nội dung:**
     - System architecture
     - User flow
     - Database relationships
     - Chat message flow
     - Like & match flow
     - Discovery algorithm
     - Testing pyramid
     - CI/CD pipeline
     - Deployment architecture
   - **Dùng khi:** Cần hình ảnh trực quan

### 5. **README.md** 📝
   - **Mục đích:** Project overview
   - **Nội dung:**
     - Project description
     - Tech stack
     - Setup instructions
     - API endpoints
     - Database schema
   - **Dùng khi:** Cần giới thiệu project

### 6. **USER_GUIDE.md** 👥
   - **Mục đích:** Hướng dẫn sử dụng app
   - **Nội dung:**
     - Cách đăng nhập
     - Cách khám phá
     - Cách chat
     - Cách xem stories
     - Cách block/report
   - **Dùng khi:** Cần hướng dẫn người dùng

### 7. **JENKINS_SETUP.md** 🚀
   - **Mục đích:** Hướng dẫn setup Jenkins
   - **Nội dung:**
     - 7 bước setup
     - GitHub token
     - Webhook configuration
     - Troubleshooting
   - **Dùng khi:** Cần setup CI/CD

### 8. **TEST_PLAN.md** 🧪
   - **Mục đích:** Kế hoạch kiểm thử
   - **Nội dung:**
     - 119 test cases
     - Test strategy
     - Test execution
     - Allure reporting
   - **Dùng khi:** Cần chạy tests

---

## 🗂️ Cấu Trúc Tài Liệu

```
make_date_app/
├── 📚 DOCUMENTATION_INDEX.md (bạn đang đọc)
├── ⭐ MEMORY_SUMMARY.md (START HERE)
├── 🗄️ DATABASE_SCHEMA.md
├── 🏗️ APP_ARCHITECTURE.md
├── 📊 ARCHITECTURE_DIAGRAM.md
├── 📝 README.md
├── 👥 USER_GUIDE.md
├── 🚀 JENKINS_SETUP.md
├── 🧪 TEST_PLAN.md
│
├── apps/
│   ├── api/
│   │   ├── prisma/schema.prisma (Database schema)
│   │   ├── src/
│   │   │   ├── auth/ (Login/Register)
│   │   │   ├── users/ (User management)
│   │   │   ├── conversations/ (Chat)
│   │   │   ├── realtime/ (WebSocket)
│   │   │   └── ...
│   │   └── Dockerfile
│   │
│   └── web/
│       ├── app/
│       │   ├── page.tsx (Home)
│       │   ├── auth/ (Login/Register)
│       │   ├── discover/ (Discovery)
│       │   ├── chats/ (Chat)
│       │   ├── stories/ (Stories)
│       │   └── ...
│       ├── lib/
│       │   ├── api.ts (API client)
│       │   ├── socket.ts (WebSocket)
│       │   └── ...
│       └── Dockerfile
│
├── e2e-playwright-java/
│   ├── src/test/java/com/nearmatch/e2e/
│   │   ├── ChatsTest.java (15 tests)
│   │   ├── DiscoverTest.java (7 tests)
│   │   └── ...
│   ├── TEST_PLAN.md
│   └── pom.xml
│
├── Jenkinsfile (CI/CD)
├── docker-compose.yml (Docker setup)
└── .gitignore
```

---

## 🎯 Cách Sử Dụng Tài Liệu

### Scenario 1: Bạn là developer mới
1. Đọc **MEMORY_SUMMARY.md** (5 phút)
2. Xem **ARCHITECTURE_DIAGRAM.md** (10 phút)
3. Đọc **APP_ARCHITECTURE.md** (20 phút)
4. Xem code trong `apps/api` và `apps/web`

### Scenario 2: Bạn cần hiểu database
1. Đọc **DATABASE_SCHEMA.md** (30 phút)
2. Xem `apps/api/prisma/schema.prisma`
3. Xem **ARCHITECTURE_DIAGRAM.md** - Database section

### Scenario 3: Bạn cần chạy tests
1. Đọc **TEST_PLAN.md** (15 phút)
2. Chạy: `mvn test -Dheadless=true`
3. Xem Allure report

### Scenario 4: Bạn cần setup Jenkins
1. Đọc **JENKINS_SETUP.md** (20 phút)
2. Follow 7 bước setup
3. Test webhook

### Scenario 5: Bạn cần thêm tính năng
1. Đọc **APP_ARCHITECTURE.md** - relevant section
2. Xem code trong `apps/api/src/` hoặc `apps/web/app/`
3. Thêm tests trong `e2e-playwright-java/`
4. Update documentation

---

## 📊 Quick Reference

### Database
- **15 tables:** User, UserPhoto, UserInterest, Like, Match, Story, Share, Block, Report, Conversation, ConversationParticipant, Message, MessageReceipt, MessageReaction, Notification
- **Key indexes:** (latitude, longitude), (conversationId, createdAt), (userId, isRead, createdAt)
- **Relationships:** 30+ foreign keys

### API
- **Auth:** POST /auth/login, POST /auth/register
- **Users:** GET /users/me, PUT /users/me, GET /users/discover
- **Likes:** POST /likes, GET /likes/sent, GET /likes/received
- **Matches:** GET /matches, PATCH /matches/:id
- **Conversations:** GET /conversations, POST /conversations/:id/messages
- **Stories:** GET /stories, POST /stories
- **Notifications:** GET /notifications, POST /notifications/read-all

### WebSocket
- **Events:** message.new, message.delivered, message.seen, typing.start, typing.stop, conversation.read, notification.new, match.created, user.blocked

### Testing
- **Total:** 119 tests
- **E2E UI:** 57 tests (Playwright Java)
- **API:** 62 tests (REST endpoints)
- **Chat:** 15 tests (NEW!)

### CI/CD
- **Pipeline:** Checkout → Install Browsers → Run Tests → Generate Report → Send Email
- **Trigger:** GitHub webhook
- **Email:** ducanhdhtb@gmail.com

---

## 🔗 Important Links

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
✅ Added ARCHITECTURE_DIAGRAM.md with visual diagrams  
✅ Added MEMORY_SUMMARY.md for quick reference  
✅ Total test count increased from 104 to 119 tests  
✅ All tests compile successfully  
✅ Pushed to GitHub  

---

## 🎓 Learning Path

### Beginner (1-2 hours)
1. MEMORY_SUMMARY.md
2. ARCHITECTURE_DIAGRAM.md
3. USER_GUIDE.md

### Intermediate (3-4 hours)
1. APP_ARCHITECTURE.md
2. DATABASE_SCHEMA.md
3. TEST_PLAN.md

### Advanced (5+ hours)
1. Read all source code in `apps/api/src/`
2. Read all source code in `apps/web/app/`
3. Read all tests in `e2e-playwright-java/`
4. Setup local environment
5. Run tests and debug

---

## 💡 Tips

- **Bookmark MEMORY_SUMMARY.md** - Dùng để tham khảo nhanh
- **Keep ARCHITECTURE_DIAGRAM.md open** - Khi cần hiểu flow
- **Use DATABASE_SCHEMA.md** - Khi làm việc với database
- **Follow TEST_PLAN.md** - Khi chạy tests
- **Check JENKINS_SETUP.md** - Khi setup CI/CD

---

## 🆘 Troubleshooting

### Không hiểu app là gì?
→ Đọc MEMORY_SUMMARY.md

### Không hiểu database?
→ Đọc DATABASE_SCHEMA.md

### Không hiểu kiến trúc?
→ Xem ARCHITECTURE_DIAGRAM.md

### Không biết chạy tests?
→ Đọc TEST_PLAN.md

### Không biết setup Jenkins?
→ Đọc JENKINS_SETUP.md

### Cần thêm tính năng?
→ Đọc APP_ARCHITECTURE.md + xem code

---

**Kiro đã tạo bộ tài liệu hoàn chỉnh cho NearMatch app!** 📚✨

Bất cứ khi nào bạn cần, hãy tham khảo tài liệu này.

