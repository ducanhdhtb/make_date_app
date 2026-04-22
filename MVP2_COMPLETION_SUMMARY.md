# 🎉 MVP-2: Video Call & Voice Call - Hoàn Thành

**Ngày hoàn thành:** 2026-04-23  
**Commit:** 324d8e6  
**Branch:** main  

---

## 📋 Tổng Quan

MVP-2 bổ sung tính năng gọi Video và Voice Call giữa các người dùng đã match, cho phép giao tiếp thời gian thực qua WebRTC.

---

## ✅ Tính Năng Đã Triển Khai

### 1. Video Call
- ✅ Gọi video 1-1 giữa người dùng đã match
- ✅ Hiển thị video local (picture-in-picture)
- ✅ Hiển thị video remote (full screen)
- ✅ Bật/tắt camera
- ✅ Chuyển camera trước/sau

### 2. Voice Call
- ✅ Gọi thoại 1-1
- ✅ Mute/unmute microphone
- ✅ Hiển thị trạng thái cuộc gọi

### 3. Call Management
- ✅ Incoming call modal với answer/reject
- ✅ Outgoing call modal với trạng thái ringing
- ✅ Active call screen với controls
- ✅ End call từ cả 2 phía

### 4. Call History
- ✅ Trang lịch sử cuộc gọi `/calls`
- ✅ Lọc theo loại (video/voice)
- ✅ Hiển thị trạng thái (missed, rejected, ended)
- ✅ Hiển thị thời lượng cuộc gọi

### 5. Realtime Signaling
- ✅ WebRTC SDP offer/answer exchange
- ✅ ICE candidate exchange
- ✅ Call state synchronization qua WebSocket

---

## 🏗️ Kiến Trúc

### Backend (NestJS)

```
apps/api/src/calls/
├── calls.controller.ts    # REST API endpoints
├── calls.service.ts       # Business logic
├── calls.module.ts        # Module definition
└── dto/
    └── create-call.dto.ts # Data transfer objects
```

**API Endpoints:**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/calls` | Tạo cuộc gọi mới |
| GET | `/calls` | Lịch sử cuộc gọi |
| GET | `/calls/:id` | Chi tiết cuộc gọi |
| PATCH | `/calls/:id` | Cập nhật trạng thái |
| POST | `/calls/:id/end` | Kết thúc cuộc gọi |

**WebSocket Events:**
| Event | Direction | Mô tả |
|-------|-----------|-------|
| `call.incoming` | Server → Client | Thông báo cuộc gọi đến |
| `call.answered` | Server → Client | Cuộc gọi được trả lời |
| `call.rejected` | Server → Client | Cuộc gọi bị từ chối |
| `call.ended` | Server → Client | Cuộc gọi kết thúc |
| `call.sdp_offer` | Bidirectional | WebRTC SDP offer |
| `call.sdp_answer` | Bidirectional | WebRTC SDP answer |
| `call.ice_candidate` | Bidirectional | WebRTC ICE candidate |

### Frontend (Next.js)

```
apps/web/
├── app/calls/page.tsx              # Call history page
├── components/
│   ├── active-call-screen.tsx      # Active call UI
│   ├── incoming-call-modal.tsx     # Incoming call modal
│   └── outgoing-call-modal.tsx     # Outgoing call modal
└── lib/
    ├── webrtc.ts                   # WebRTC hook
    ├── call-context.tsx            # Call state management
    └── types.ts                    # Call types
```

### Database Schema

```prisma
enum CallType {
  video
  voice
}

enum CallStatus {
  ringing
  connected
  ended
  missed
  rejected
}

model Call {
  id              String     @id @default(uuid())
  conversationId  String
  callerId        String
  receiverId      String
  callType        CallType
  status          CallStatus @default(ringing)
  startedAt       DateTime?
  endedAt         DateTime?
  durationSeconds Int?
  createdAt       DateTime   @default(now())
  
  // Relations
  conversation    Conversation @relation(...)
  caller          User         @relation("CallCaller", ...)
  receiver        User         @relation("CallReceiver", ...)
}
```

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Thực hiện cuộc gọi

1. Vào trang **Chats** (`/chats`)
2. Chọn một hội thoại với người đã match
3. Nhấn nút **📞** (gọi thoại) hoặc **📹** (gọi video) ở header
4. Chờ người nhận trả lời

### 2. Nhận cuộc gọi

1. Khi có cuộc gọi đến, modal hiện lên với thông tin người gọi
2. Nhấn **✓** (xanh) để trả lời
3. Nhấn **✗** (đỏ) để từ chối

### 3. Trong cuộc gọi

- **Mute/Unmute**: Nhấn nút micro
- **Bật/Tắt camera**: Nhấn nút camera (chỉ video call)
- **Chuyển camera**: Nhấn nút xoay (chỉ video call)
- **Kết thúc**: Nhấn nút đỏ

### 4. Xem lịch sử cuộc gọi

1. Vào trang **Calls** (`/calls`)
2. Xem danh sách cuộc gọi
3. Lọc theo loại (video/voice)
4. Nhấn nút gọi để gọi lại

---

## 🔧 Cấu Hình Kỹ Thuật

### WebRTC Configuration

```typescript
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
```

### Required Permissions

- **Camera**: Cần cho video call
- **Microphone**: Cần cho cả video và voice call

---

## 📊 Thống Kê Code

| Loại | Số file | Số dòng |
|------|---------|---------|
| Backend | 4 | ~300 |
| Frontend | 7 | ~800 |
| Database | 1 | ~30 |
| **Total** | **12** | **~1130** |

---

## 🔒 Bảo Mật

- ✅ JWT authentication cho API endpoints
- ✅ Socket authentication cho WebSocket events
- ✅ Chỉ caller/receiver có thể xem/truy cập cuộc gọi
- ✅ WebRTC encryption (SRTP)

---

## 📝 Known Limitations (MVP)

- ❌ Không hỗ trợ group video call
- ❌ Không có screen sharing
- ❌ Không có video filters
- ❌ Không có call recording
- ❌ Không có virtual backgrounds

---

## 🔮 Future Improvements

1. **Group Video Call** - Hỗ trợ gọi video nhóm
2. **Screen Sharing** - Chia sẻ màn hình
3. **Call Recording** - Ghi âm cuộc gọi
4. **Virtual Backgrounds** - Background ảo
5. **Video Filters** - Bộ lọc video
6. **Push Notifications** - Thông báo push cho incoming calls

---

## 📚 Tài Liệu Liên Quan

- [EPIC_VIDEO_CALL.md](./EPIC_VIDEO_CALL.md) - Chi tiết epic
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema database
- [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md) - Kiến trúc app

---

**Tạo bởi:** Kiro AI  
**Ngày tạo:** 2026-04-23
