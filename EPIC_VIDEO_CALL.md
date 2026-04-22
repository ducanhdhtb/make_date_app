# 📋 EPIC-002: Video Call & Voice Call

**Epic ID:** EPIC-002  
**Tên:** Video Call & Voice Call Feature  
**Mô tả:** Tính năng gọi video/voice giữa 2 người đã match  
**Trạng thái:** In Progress  
**Ưu tiên:** Critical  
**Ngày tạo:** 2026-04-22  
**Người tạo:** Kiro AI  

---

## 🎯 Mục Tiêu

Cho phép người dùng:
- ✅ Gọi video cho match
- ✅ Gọi voice cho match
- ✅ Nhận cuộc gọi đến
- ✅ Trả lời/Từ chối cuộc gọi
- ✅ Xem lịch sử cuộc gọi
- ✅ Mute/Unmute microphone
- ✅ Bật/Tắt camera
- ✅ Chuyển camera trước/sau

---

## 📊 Scope

### Trong Scope (MVP)
- ✅ Video call 1-1
- ✅ Voice call 1-1
- ✅ Call history
- ✅ Missed call notification
- ✅ Basic call controls

### Ngoài Scope (Future)
- ❌ Group video call
- ❌ Screen sharing
- ❌ Video filters
- ❌ Call recording
- ❌ Virtual backgrounds

---

## 💾 Database Changes

### Bảng Mới

#### 1. **Call**
```sql
CREATE TABLE "Call" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversationId UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
  callerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  receiverId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  callType VARCHAR(20) NOT NULL, -- 'video' | 'voice'
  status VARCHAR(20) NOT NULL, -- 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected'
  startedAt TIMESTAMP,
  endedAt TIMESTAMP,
  durationSeconds INT,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_conversation FOREIGN KEY (conversationId) REFERENCES "Conversation"(id),
  CONSTRAINT fk_caller FOREIGN KEY (callerId) REFERENCES "User"(id),
  CONSTRAINT fk_receiver FOREIGN KEY (receiverId) REFERENCES "User"(id)
);

CREATE INDEX idx_call_conversation ON "Call"(conversationId);
CREATE INDEX idx_call_caller ON "Call"(callerId);
CREATE INDEX idx_call_receiver ON "Call"(receiverId);
CREATE INDEX idx_call_status ON "Call"(status);
CREATE INDEX idx_call_created ON "Call"(createdAt);
```

---

## 🏗️ Backend Architecture

### Modules Mới

#### 1. **Calls Module**
```
apps/api/src/calls/
├── calls.controller.ts
├── calls.service.ts
├── calls.module.ts
├── calls.gateway.ts (WebRTC signaling)
└── dto/
    ├── create-call.dto.ts
    ├── update-call.dto.ts
    └── list-calls.query.dto.ts
```

**Endpoints:**
- `POST /calls` - Tạo cuộc gọi mới
- `GET /calls` - Lịch sử cuộc gọi
- `GET /calls/:id` - Chi tiết cuộc gọi
- `PATCH /calls/:id` - Cập nhật trạng thái
- `POST /calls/:id/end` - Kết thúc cuộc gọi

---

## 🔌 WebSocket Events

### Client → Server

```typescript
// Initiate call
socket.emit('call.initiate', { 
  conversationId: string,
  receiverId: string,
  callType: 'video' | 'voice'
})

// Answer call
socket.emit('call.answer', { 
  callId: string 
})

// Reject call
socket.emit('call.reject', { 
  callId: string 
})

// End call
socket.emit('call.end', { 
  callId: string 
})

// WebRTC signaling
socket.emit('call.sdp_offer', { 
  callId: string,
  sdp: RTCSessionDescriptionInit 
})

socket.emit('call.sdp_answer', { 
  callId: string,
  sdp: RTCSessionDescriptionInit 
})

socket.emit('call.ice_candidate', { 
  callId: string,
  candidate: RTCIceCandidateInit 
})
```

### Server → Client

```typescript
// Incoming call
socket.on('call.incoming', {
  callId: string,
  caller: User,
  callType: 'video' | 'voice',
  conversationId: string
})

// Call answered
socket.on('call.answered', {
  callId: string,
  call: Call
})

// Call rejected
socket.on('call.rejected', {
  callId: string,
  reason: string
})

// Call ended
socket.on('call.ended', {
  callId: string,
  duration: number
})

// WebRTC signaling
socket.on('call.sdp_offer', {
  callId: string,
  sdp: RTCSessionDescriptionInit
})

socket.on('call.sdp_answer', {
  callId: string,
  sdp: RTCSessionDescriptionInit
})

socket.on('call.ice_candidate', {
  callId: string,
  candidate: RTCIceCandidateInit
})
```

---

## 📋 Tasks

### Phase 1: Backend Infrastructure (20h)

#### TASK-001: Database Schema (4h)
- **Mô tả:** Tạo bảng Call
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ Bảng Call được tạo
  - ✅ Indexes được tạo
  - ✅ Foreign keys được setup
  - ✅ Migration chạy thành công

#### TASK-002: WebRTC Signaling Server (8h)
- **Mô tả:** Implement WebRTC signaling qua WebSocket
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ SDP exchange
  - ✅ ICE candidate exchange
  - ✅ Call state management

#### TASK-003: Call Service (8h)
- **Mô tả:** Implement CallService với CRUD operations
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ Create call
  - ✅ Get call history
  - ✅ Update call status
  - ✅ End call

---

### Phase 2: Frontend UI (25h)

#### TASK-004: Call UI Components (8h)
- **Mô tả:** Tạo UI components cho call
- **Ước tính:** 8 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ Incoming call modal
  - ✅ Outgoing call screen
  - ✅ Active call screen
  - ✅ Call controls

#### TASK-005: Video Call Implementation (10h)
- **Mô tả:** Implement video call với WebRTC
- **Ước tính:** 10 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ Local video preview
  - ✅ Remote video display
  - ✅ Camera switch
  - ✅ Video quality indicator

#### TASK-006: Voice Call Implementation (4h)
- **Mô tả:** Implement voice call
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ Audio stream
  - ✅ Audio controls
  - ✅ Mute toggle

#### TASK-007: Call History Page (3h)
- **Mô tả:** Trang lịch sử cuộc gọi
- **Ước tính:** 3 giờ
- **Độ ưu tiên:** Medium
- **Acceptance Criteria:**
  - ✅ List all calls
  - ✅ Filter by type/status
  - ✅ Call duration display

---

### Phase 3: Realtime & Notifications (10h)

#### TASK-008: Call WebSocket Events (6h)
- **Mô tả:** Implement WebSocket events cho call
- **Ước tính:** 6 giờ
- **Độ ưu tiên:** Critical
- **Acceptance Criteria:**
  - ✅ All call events
  - ✅ WebRTC signaling events

#### TASK-009: Push Notifications (4h)
- **Mô tả:** Push notifications cho call
- **Ước tính:** 4 giờ
- **Độ ưu tiên:** High
- **Acceptance Criteria:**
  - ✅ Incoming call notification
  - ✅ Missed call notification

---

### Phase 4: Testing (5h)

#### TASK-010: API Tests (3h)
- **Mô tả:** API tests cho calls
- **Ước tính:** 3 giờ
- **Độ ưu tiên:** High

#### TASK-011: E2E Tests (2h)
- **Mô tả:** E2E tests cho call UI
- **Ước tính:** 2 giờ
- **Độ ưu tiên:** High

---

## 📊 Timeline

```
Phase 1: Backend (20h)
├── TASK-001: Database Schema (4h)
├── TASK-002: WebRTC Signaling (8h)
└── TASK-003: Call Service (8h)

Phase 2: Frontend (25h)
├── TASK-004: Call UI Components (8h)
├── TASK-005: Video Call (10h)
├── TASK-006: Voice Call (4h)
└── TASK-007: Call History (3h)

Phase 3: Realtime (10h)
├── TASK-008: WebSocket Events (6h)
└── TASK-009: Push Notifications (4h)

Phase 4: Testing (5h)
├── TASK-010: API Tests (3h)
└── TASK-011: E2E Tests (2h)

TOTAL: 60 giờ (~1.5 tuần)
```

---

## 🎯 Success Criteria

- ✅ User có thể gọi video/voice cho match
- ✅ Receiver thấy incoming call
- ✅ Receiver có thể answer/reject
- ✅ Video quality ổn định (720p minimum)
- ✅ Audio quality rõ ràng
- ✅ Call history được lưu
- ✅ Missed call notification
- ✅ Call duration được tính
- ✅ Mute/unmute hoạt động
- ✅ Camera on/off hoạt động
- ✅ Camera switch hoạt động

---

**Tạo bởi:** Kiro AI  
**Ngày tạo:** 2026-04-22  
**Cập nhật lần cuối:** 2026-04-22
