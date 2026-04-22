# 🏗️ NearMatch Architecture Diagrams

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend (Port 3002)                │   │
│  │  - React Components                                      │   │
│  │  - TypeScript                                            │   │
│  │  - Tailwind CSS                                          │   │
│  │  - Socket.IO Client                                      │   │
│  │  - localStorage (auth tokens)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                    ↕ HTTP + WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           NestJS Backend (Port 3001)                     │   │
│  │                                                          │   │
│  │  REST API:                                               │   │
│  │  ├── /auth (Login, Register)                             │   │
│  │  ├── /users (Profile, Discovery)                         │   │
│  │  ├── /likes (Like system)                                │   │
│  │  ├── /matches (Match system)                             │   │
│  │  ├── /conversations (Chat)                               │   │
│  │  ├── /stories (Stories)                                  │   │
│  │  ├── /notifications (Notifications)                      │   │
│  │  ├── /blocks (Block users)                               │   │
│  │  └── /reports (Report users)                             │   │
│  │                                                          │   │
│  │  WebSocket Gateway:                                      │   │
│  │  ├── /realtime (Socket.IO namespace)                     │   │
│  │  ├── Events: message.new, typing.start, etc              │   │
│  │  └── Real-time updates                                   │   │
│  │                                                          │   │
│  │  Services:                                               │   │
│  │  ├── AuthService (JWT, bcrypt)                           │   │
│  │  ├── UsersService (Profile, Discovery)                   │   │
│  │  ├── ConversationsService (Chat logic)                   │   │
│  │  ├── StoriesService (Stories)                            │   │
│  │  ├── NotificationsService (Notifications)                │   │
│  │  └── RealtimeGateway (WebSocket)                         │   │
│  │                                                          │   │
│  │  External Services:                                      │   │
│  │  └── Cloudinary (Image upload)                           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      PostgreSQL Database (Port 5432)                     │   │
│  │                                                          │   │
│  │  Tables:                                                 │   │
│  │  ├── User (15 fields)                                    │   │
│  │  ├── UserPhoto, UserInterest                             │   │
│  │  ├── Like, Match                                         │   │
│  │  ├── Story, Share                                        │   │
│  │  ├── Block, Report                                       │   │
│  │  ├── Conversation, ConversationParticipant               │   │
│  │  ├── Message, MessageReceipt, MessageReaction            │   │
│  │  └── Notification                                        │   │
│  │                                                          │   │
│  │  Indexes:                                                │   │
│  │  ├── (latitude, longitude) - Geo search                  │   │
│  │  ├── (conversationId, createdAt) - Messages              │   │
│  │  ├── (userId, isRead, createdAt) - Notifications         │   │
│  │  └── (userId, expiresAt) - Stories                       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ┌──────────────┐
   │ Home Page    │
   └──────┬───────┘
          │
          ├─→ Login ──→ JWT Token ──→ localStorage
          │
          └─→ Register ──→ Create User ──→ JWT Token ──→ localStorage

2. DISCOVERY
   ┌──────────────────┐
   │ Discover Page    │
   │ (Geolocation)    │
   └──────┬───────────┘
          │
          ├─→ Filter by: radius, gender, age
          │
          ├─→ Show nearby users
          │
          └─→ Like user ──→ Check if mutual ──→ Create Match

3. MATCHING
   ┌──────────────────┐
   │ Matches Page     │
   └──────┬───────────┘
          │
          ├─→ Show all matches
          │
          ├─→ Click "Nhắn tin" ──→ Create Conversation
          │
          └─→ Unmatched / Block

4. CHAT
   ┌──────────────────┐
   │ Chats Page       │
   └──────┬───────────┘
          │
          ├─→ Select conversation
          │
          ├─→ Send message (text, image, file, audio)
          │
          ├─→ WebSocket: message.new ──→ Realtime update
          │
          ├─→ Reply / Quote / Forward
          │
          ├─→ Add reactions (❤️, 👍, 😂, 😍, 😮)
          │
          ├─→ Pin / Recall / Delete
          │
          └─→ Typing indicators

5. STORIES
   ┌──────────────────┐
   │ Stories Page     │
   └──────┬───────────┘
          │
          ├─→ View active stories (24h)
          │
          ├─→ Upload story (image or text)
          │
          ├─→ Add reactions
          │
          └─→ Auto-expire after 24h

6. NOTIFICATIONS
   ┌──────────────────┐
   │ Notifications    │
   └──────┬───────────┘
          │
          ├─→ Match created
          │
          ├─→ New message
          │
          ├─→ New like
          │
          ├─→ Story reaction
          │
          └─→ Mark as read

7. SAFETY
   ┌──────────────────┐
   │ Safety Actions   │
   └──────┬───────────┘
          │
          ├─→ Block user
          │
          └─→ Report user / message / story
```

---

## Database Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                               │
└─────────────────────────────────────────────────────────────────┘

                              ┌─────────┐
                              │  User   │
                              └────┬────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ UserPhoto    │ │ UserInterest │ │ Story        │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ Like         │ │ Match        │ │ Block        │
            │ (A→B)        │ │ (A↔B)        │ │ (A→B)        │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ Share        │ │ Report       │ │ Conversation │
            └──────────────┘ └──────────────┘ └──────┬───────┘
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    │                 │                 │
                                    ▼                 ▼                 ▼
                            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                            │ Participant  │ │ Message      │ │ Notification │
                            └──────────────┘ └──────┬───────┘ └──────────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                │                │
                                    ▼                ▼                ▼
                            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                            │ MessageReceipt│ │ MessageReact │ │ Message      │
                            │ (delivered,  │ │ (emoji)      │ │ (reply/fwd)  │
                            │  seen)       │ └──────────────┘ └──────────────┘
                            └──────────────┘
```

---

## Chat Message Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

USER A (Sender)                          USER B (Receiver)
    │                                           │
    │ 1. Type message                           │
    │ ─────────────────────────────────────────→│
    │    (typing.start event)                   │
    │                                           │
    │ 2. Click Send                             │
    │ ─────────────────────────────────────────→│
    │    POST /conversations/:id/messages       │
    │                                           │
    │ 3. Message created (status: pending)      │
    │    ─────────────────────────────────────→│
    │    WebSocket: message.new                 │
    │                                           │
    │ 4. Message delivered                      │
    │    ─────────────────────────────────────→│
    │    WebSocket: message.delivered           │
    │    (MessageReceipt.deliveredAt set)       │
    │                                           │
    │ 5. User B opens chat                      │
    │    ─────────────────────────────────────→│
    │    Message marked as seen                 │
    │    WebSocket: message.seen                │
    │    (MessageReceipt.seenAt set)            │
    │                                           │
    │ 6. User B adds reaction                   │
    │    ←─────────────────────────────────────│
    │    POST /reactions                        │
    │    WebSocket: message.reaction_updated    │
    │                                           │
    │ 7. User A replies                         │
    │ ─────────────────────────────────────────→│
    │    POST /messages (parentMessageId set)   │
    │    WebSocket: message.new                 │
    │                                           │
    │ 8. User A recalls message                 │
    │ ─────────────────────────────────────────→│
    │    PATCH /messages/:id/recall             │
    │    WebSocket: message.updated             │
    │    (recalledAt set)                       │
    │                                           │
    └─────────────────────────────────────────────────────────────┘

Message Status Timeline:
pending → delivered → seen
   ↓
 failed (retry)
   ↓
recalled / deleted
```

---

## Like & Match Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIKE & MATCH FLOW                             │
└─────────────────────────────────────────────────────────────────┘

USER A                                  USER B
    │                                       │
    │ 1. View User B in Discover            │
    │                                       │
    │ 2. Click "Thả tim"                    │
    │ ─────────────────────────────────────→│
    │    POST /likes                         │
    │    Create Like(A→B)                    │
    │                                       │
    │ 3. Check if B already liked A         │
    │    ─────────────────────────────────→│
    │    Query Like(B→A)                     │
    │                                       │
    │ 4a. If B liked A:                     │
    │    ─────────────────────────────────→│
    │    Create Match(A↔B)                   │
    │    Send notification to both           │
    │    Create Conversation                 │
    │                                       │
    │ 4b. If B didn't like A:               │
    │    ─────────────────────────────────→│
    │    Send notification to B              │
    │    (new_like)                          │
    │                                       │
    │ 5. User B views notification          │
    │    ←─────────────────────────────────│
    │    GET /notifications                  │
    │                                       │
    │ 6. User B clicks "Thả tim" back       │
    │    ←─────────────────────────────────│
    │    POST /likes                         │
    │    Create Like(B→A)                    │
    │                                       │
    │ 7. Match created!                     │
    │    ←─────────────────────────────────│
    │    Create Match(A↔B)                   │
    │    Send notification to A              │
    │    (match_created)                     │
    │                                       │
    │ 8. Both can now chat                  │
    │    ←─────────────────────────────────│
    │    GET /conversations                  │
    │    POST /conversations/:id/messages    │
    │                                       │
    └─────────────────────────────────────────────────────────────┘

Match Status:
active → unmatched (hủy match)
      → blocked (chặn user)
```

---

## Discovery Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISCOVERY ALGORITHM                           │
└─────────────────────────────────────────────────────────────────┘

GET /users/discover?radius=5&gender=female&ageMin=20&ageMax=30

1. Get current user location
   └─→ latitude, longitude

2. Filter users:
   ├─→ NOT current user
   ├─→ NOT already liked
   ├─→ NOT already matched
   ├─→ NOT blocked by current user
   ├─→ NOT blocking current user
   ├─→ gender = filter (or interestedIn matches)
   ├─→ age between ageMin and ageMax
   ├─→ location NOT null (has location)
   └─→ distance <= radius (using Haversine formula)

3. Sort by:
   ├─→ Distance (nearest first)
   └─→ lastActiveAt (most active first)

4. Paginate:
   └─→ limit 20 per page

5. Return:
   ├─→ User profile
   ├─→ Photos
   ├─→ Interests
   ├─→ Distance
   └─→ Like status

Geolocation Query:
SELECT * FROM "User"
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND id != :currentUserId
  AND gender = :gender
  AND EXTRACT(YEAR FROM AGE(birthDate)) BETWEEN :ageMin AND :ageMax
  AND (
    6371 * acos(
      cos(radians(:latitude)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(:longitude)) +
      sin(radians(:latitude)) * sin(radians(latitude))
    )
  ) <= :radius
ORDER BY distance ASC, lastActiveAt DESC
LIMIT 20;
```

---

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                               │
└─────────────────────────────────────────────────────────────────┘

                            ▲
                           ╱ ╲
                          ╱   ╲
                         ╱ E2E ╲         57 UI Tests
                        ╱       ╲        (Playwright)
                       ╱─────────╲
                      ╱           ╲
                     ╱   API Tests  ╲    62 API Tests
                    ╱               ╲   (REST endpoints)
                   ╱─────────────────╲
                  ╱                   ╲
                 ╱   Unit Tests        ╲  (Not included)
                ╱_____________________╲

E2E UI Tests (57):
├── HomePage (7)
├── Auth (6)
├── Discover (7)
├── Matches (4)
├── Chats (15) ✨ NEW!
├── Stories (6)
├── Notifications (6)
└── ProfileEdit (6)

API Tests (62):
├── Auth (11)
├── Users (10)
├── Likes (8)
├── Conversations (13)
├── Stories (9)
└── Notifications (6)

Total: 119 tests
```

---

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    JENKINS PIPELINE                              │
└─────────────────────────────────────────────────────────────────┘

GitHub Push
    │
    ├─→ Webhook Trigger
    │
    ▼
┌──────────────────────────────────────────┐
│ Stage 1: Checkout                        │
│ - Clone repo from GitHub                 │
│ - Checkout main branch                   │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ Stage 2: Install Browsers                │
│ - Download Playwright browsers           │
│ - Chromium, Firefox, WebKit              │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ Stage 3: Run Tests                       │
│ - mvn test -Dheadless=true               │
│ - E2E UI tests (57)                      │
│ - API tests (62)                         │
│ - Total: 119 tests                       │
└──────────────────────────────────────────┘
    │
    ├─→ All Pass ──→ Continue
    │
    └─→ Some Fail ──→ Parse Results
                      └─→ Generate Report
    │
    ▼
┌──────────────────────────────────────────┐
│ Stage 4: Generate Allure Report          │
│ - mvn allure:report                      │
│ - Create HTML report                     │
│ - Upload to Jenkins                      │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ Stage 5: Send Email                      │
│ - To: ducanhdhtb@gmail.com               │
│ - Format: HTML                           │
│ - Content:                               │
│   ├── Pass/Fail/Skip counts              │
│   ├── Failed tests table                 │
│   ├── Error traces                       │
│   └── Allure report link                 │
└──────────────────────────────────────────┘
    │
    ▼
Build Complete
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                                │
└─────────────────────────────────────────────────────────────────┘

docker-compose.yml
    │
    ├─→ Service: web
    │   ├── Image: node:18-alpine
    │   ├── Build: apps/web/Dockerfile
    │   ├── Port: 3002:3000
    │   ├── Env:
    │   │   └── NEXT_PUBLIC_API_URL=http://api:3001/api
    │   └── Depends on: api
    │
    ├─→ Service: api
    │   ├── Image: node:18-alpine
    │   ├── Build: apps/api/Dockerfile
    │   ├── Port: 3001:3001
    │   ├── Env:
    │   │   ├── DATABASE_URL=postgresql://...
    │   │   ├── JWT_ACCESS_SECRET=...
    │   │   └── CLOUDINARY_*=...
    │   └── Depends on: postgres
    │
    └─→ Service: postgres
        ├── Image: postgres:15-alpine
        ├── Port: 5432:5432
        ├── Env:
        │   ├── POSTGRES_USER=nearmatch
        │   ├── POSTGRES_PASSWORD=...
        │   └── POSTGRES_DB=nearmatch
        └── Volume: postgres_data

Network: nearmatch-network
├── web ↔ api (HTTP + WebSocket)
└── api ↔ postgres (SQL)

Volumes:
└── postgres_data (persistent database)
```

---

**Tất cả diagrams được tạo bằng ASCII art để dễ đọc và hiểu!** 📊

