# 📋 EPIC-003: Push Notifications & Real-time Alerts

**Epic ID:** EPIC-003  
**Tên:** Push Notifications & Real-time Alerts  
**Mô tả:** Hệ thống thông báo đẩy cho mobile và web  
**Trạng thái:** In Progress  
**Ưu tiên:** High  
**Ngày tạo:** 2026-04-23  
**Người tạo:** Kiro AI  

---

## 🎯 Mục Tiêu

Cho phép người dùng:
- ✅ Nhận thông báo khi có match mới
- ✅ Nhận thông báo khi có tin nhắn mới
- ✅ Nhận thông báo khi có cuộc gọi đến
- ✅ Nhận thông báo khi có like mới
- ✅ Quản lý cài đặt thông báo
- ✅ Xem danh sách thông báo
- ✅ Đánh dấu đã đọc

---

## 📊 Scope

### Trong Scope (MVP)
- ✅ In-app notifications (đã có)
- ✅ Browser push notifications (Web Push API)
- ✅ Notification preferences
- ✅ Notification history
- ✅ Mark as read/unread
- ✅ Notification sounds

### Ngoài Scope (Future)
- ❌ Mobile push (FCM/APNs)
- ❌ Email notifications
- ❌ SMS notifications
- ❌ Scheduled notifications
- ❌ Rich media notifications

---

## 🏗️ Backend Architecture

### Modules Mới

```
apps/api/src/notifications/
├── notifications.controller.ts
├── notifications.service.ts
├── notifications.module.ts
├── push.service.ts          # Web Push service
└── dto/
    ├── create-notification.dto.ts
    ├── update-notification.dto.ts
    └── notification-preferences.dto.ts
```

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/notifications` | Danh sách thông báo |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc |
| POST | `/notifications/:id/read` | Đánh dấu đã đọc |
| POST | `/notifications/read-all` | Đánh dấu tất cả đã đọc |
| GET | `/notifications/preferences` | Lấy cài đặt thông báo |
| PUT | `/notifications/preferences` | Cập nhật cài đặt |
| POST | `/notifications/subscribe` | Đăng ký push notification |
| DELETE | `/notifications/subscribe` | Hủy đăng ký |

---

## 💾 Database Changes

### Bảng Mới

#### 1. **NotificationPreferences**
```prisma
model NotificationPreferences {
  id                String   @id @default(uuid())
  userId            String   @unique
  newMatch          Boolean  @default(true)
  newMessage        Boolean  @default(true)
  newLike           Boolean  @default(true)
  incomingCall      Boolean  @default(true)
  missedCall        Boolean  @default(true)
  storyReaction     Boolean  @default(true)
  emailEnabled      Boolean  @default(false)
  pushEnabled       Boolean  @default(true)
  soundEnabled      Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### 2. **PushSubscription**
```prisma
model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  endpoint  String
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint])
  @@index([userId])
}
```

---

## 📋 Tasks

### Phase 1: Backend Infrastructure (8h)

#### TASK-001: Database Schema (2h)
- Thêm NotificationPreferences model
- Thêm PushSubscription model
- Run migration

#### TASK-002: Notification Preferences API (3h)
- CRUD cho notification preferences
- Default preferences cho user mới

#### TASK-003: Web Push Service (3h)
- Tích hợp web-push library
- VAPID keys generation
- Subscribe/Unsubscribe endpoints

---

### Phase 2: Frontend UI (10h)

#### TASK-004: Notification Preferences Page (4h)
- UI cài đặt thông báo
- Toggle switches cho từng loại
- Save preferences

#### TASK-005: Push Notification Integration (4h)
- Service worker registration
- Push subscription flow
- Handle incoming push events

#### TASK-006: Notification Sound & UI Polish (2h)
- Notification sounds
- Toast notifications
- Badge counter

---

### Phase 3: Integration (6h)

#### TASK-007: Integrate with Existing Events (4h)
- New match notification
- New message notification
- Incoming call notification
- New like notification

#### TASK-008: Testing (2h)
- Test push notifications
- Test preferences
- Test notification flow

---

## 📊 Timeline

```
Phase 1: Backend (8h)
├── TASK-001: Database Schema (2h)
├── TASK-002: Preferences API (3h)
└── TASK-003: Web Push Service (3h)

Phase 2: Frontend (10h)
├── TASK-004: Preferences Page (4h)
├── TASK-005: Push Integration (4h)
└── TASK-006: Sound & Polish (2h)

Phase 3: Integration (6h)
├── TASK-007: Event Integration (4h)
└── TASK-008: Testing (2h)

TOTAL: 24 giờ (~3 ngày)
```

---

## 🎯 Success Criteria

- ✅ User có thể đăng ký nhận push notifications
- ✅ User nhận được thông báo khi có match mới
- ✅ User nhận được thông báo khi có tin nhắn mới
- ✅ User có thể tắt/bật từng loại thông báo
- ✅ Notification badge hiển thị đúng số lượng
- ✅ Click notification điều hướng đúng trang
- ✅ Sound notification hoạt động

---

**Tạo bởi:** Kiro AI  
**Ngày tạo:** 2026-04-23
