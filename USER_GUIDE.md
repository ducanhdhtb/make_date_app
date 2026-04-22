# Hướng dẫn sử dụng NearMatch Dating App

**NearMatch** là ứng dụng hẹn hò giúp bạn tìm kiếm và kết nối với những người phù hợp xung quanh.

---

## 📱 Tính năng chính

| Tính năng | Mô tả |
|---|---|
| **Đăng ký / Đăng nhập** | Tạo tài khoản mới hoặc đăng nhập với email |
| **Khám phá (Discover)** | Xem danh sách người dùng gần bạn, lọc theo tuổi/giới tính/khoảng cách |
| **Thả tim (Like)** | Thích người khác, nếu họ cũng thích bạn → Match! |
| **Matches** | Xem danh sách những người đã match với bạn |
| **Chat** | Nhắn tin với những người đã match |
| **Story** | Đăng story (text/hình ảnh) để chia sẻ khoảnh khắc |
| **Thông báo** | Nhận thông báo khi có match mới, tin nhắn, hoặc ai đó thích bạn |
| **Hồ sơ** | Chỉnh sửa thông tin cá nhân, ảnh đại diện, sở thích |

---

## 🚀 Bắt đầu

### 1. Đăng ký tài khoản

1. Mở app tại: **http://localhost:3002**
2. Click **"Tạo tài khoản"**
3. Điền thông tin:
   - **Email**: địa chỉ email của bạn
   - **Mật khẩu**: tối thiểu 8 ký tự
   - **Tên hiển thị**: tên bạn muốn hiển thị
   - **Ngày sinh**: để tính tuổi
   - **Giới tính**: Nam / Nữ / Khác
   - **Vị trí**: Latitude, Longitude (hoặc để mặc định)
4. Click **"Đăng ký"**
5. Bạn sẽ được chuyển đến trang **Khám phá**

### 2. Đăng nhập

1. Click **"Đăng nhập"** từ trang chủ
2. Nhập **Email** và **Mật khẩu**
3. Click **"Đăng nhập"**

**Tài khoản demo có sẵn:**
- Email: `linh@example.com`
- Mật khẩu: `Password123!`

---

## 🔍 Khám phá người dùng

### Trang Discover

Sau khi đăng nhập, bạn sẽ thấy:

#### Story đang hoạt động
- Xem story của những người xung quanh
- Click vào avatar để xem story chi tiết

#### Bộ lọc
- **Khoảng cách (km)**: Tìm người trong bán kính bao nhiêu km
- **Giới tính**: Lọc theo giới tính mong muốn
- **Độ tuổi**: Từ tuổi → đến tuổi
- Click **"Lọc"** để áp dụng

#### Danh sách người dùng
Mỗi card hiển thị:
- Ảnh đại diện
- Tên, tuổi
- Khoảng cách (km)
- Sở thích
- Nút **"Thả tim"** ❤️
- Link **"Xem profile"**

### Thả tim

1. Click nút **"Thả tim"** trên card người bạn thích
2. Nếu người đó cũng đã thích bạn → **Match!** 🎉
3. Bạn sẽ nhận thông báo và có thể nhắn tin ngay

---

## 💬 Matches & Chat

### Trang Matches

1. Click **"Matches"** ở bottom navigation
2. Xem danh sách những người đã match với bạn
3. Mỗi match hiển thị:
   - Ảnh, tên, tuổi
   - Thời gian match
   - Nút **"Nhắn tin"**

### Trang Chat

1. Click **"Nhắn tin"** từ trang Matches
2. Hoặc click **"Chats"** ở bottom navigation
3. Chọn cuộc hội thoại từ danh sách
4. Gửi tin nhắn:
   - Nhập text vào ô chat
   - Click **"Gửi"** hoặc nhấn Enter
5. Tính năng:
   - Gửi tin nhắn text
   - Upload hình ảnh (click icon 📎)
   - Xem lịch sử tin nhắn
   - Realtime chat (tin nhắn hiện ngay lập tức)

---

## 📖 Story

### Xem Story

1. Ở trang **Discover**, phần **"Story đang hoạt động"**
2. Click vào avatar người dùng
3. Story sẽ tự động chuyển sau vài giây
4. Story tồn tại 24 giờ rồi tự động xóa

### Đăng Story

1. Click **"Stories"** ở bottom navigation
2. Chọn loại story:
   - **Text**: Viết nội dung text
   - **Image**: Upload hình ảnh
3. Nhập nội dung
4. Click **"Đăng Story"**
5. Story của bạn sẽ hiển thị cho người khác trong 24 giờ

---

## 🔔 Thông báo

### Xem thông báo

1. Click **"Thông báo"** ở bottom navigation
2. Các loại thông báo:
   - 💖 **Match mới**: Ai đó đã match với bạn
   - 💬 **Tin nhắn mới**: Có tin nhắn chưa đọc
   - ❤️ **Được thích**: Ai đó đã thả tim cho bạn
   - 📖 **Story mới**: Người bạn quan tâm đăng story

### Quản lý thông báo

- Click **"Tải lại"** để refresh danh sách
- Click **"Đánh dấu đã đọc"** để đánh dấu tất cả là đã đọc
- Click vào thông báo để xem chi tiết

---

## 👤 Hồ sơ cá nhân

### Chỉnh sửa hồ sơ

1. Click **"Hồ sơ"** ở bottom navigation
2. Chỉnh sửa thông tin:
   - **Tên hiển thị**
   - **Bio**: Giới thiệu bản thân
   - **Sở thích**: Các hoạt động yêu thích
   - **Ảnh đại diện**: Upload ảnh mới
   - **Ảnh khác**: Thêm nhiều ảnh (tối đa 6 ảnh)
3. Click **"Lưu"** để cập nhật

### Xem profile người khác

1. Từ trang **Discover**, click **"Xem profile"**
2. Xem thông tin:
   - Ảnh
   - Tên, tuổi, khoảng cách
   - Bio
   - Sở thích
   - Ảnh khác

---

## 🎯 Tips sử dụng hiệu quả

### Tăng cơ hội Match

✅ **Hoàn thiện hồ sơ**
- Upload ảnh đại diện rõ mặt
- Viết bio thú vị, chân thật
- Thêm nhiều sở thích

✅ **Thả tim chọn lọc**
- Đọc kỹ profile trước khi thả tim
- Tìm người có sở thích chung

✅ **Đăng Story thường xuyên**
- Chia sẻ khoảnh khắc hàng ngày
- Giúp người khác hiểu bạn hơn

### Chat hiệu quả

💬 **Mở đầu cuộc trò chuyện**
- Chào hỏi thân thiện
- Đề cập đến sở thích chung
- Đặt câu hỏi mở

💬 **Duy trì cuộc trò chuyện**
- Trả lời nhanh chóng
- Chia sẻ về bản thân
- Lắng nghe và quan tâm

---

## ⚙️ Cài đặt & Bảo mật

### Đổi mật khẩu

1. Vào **Hồ sơ**
2. Click **"Cài đặt"**
3. Chọn **"Đổi mật khẩu"**
4. Nhập mật khẩu cũ và mật khẩu mới

### Quyền riêng tư

- **Vị trí**: Chỉ hiển thị khoảng cách gần đúng, không hiển thị vị trí chính xác
- **Thông tin cá nhân**: Chỉ người match mới xem được thông tin chi tiết
- **Tin nhắn**: Chỉ người match mới nhắn tin được

### Báo cáo & Chặn

**Báo cáo người dùng vi phạm:**
1. Vào profile người đó
2. Click **"Báo cáo"**
3. Chọn lý do: Spam, Nội dung không phù hợp, Giả mạo, v.v.
4. Gửi báo cáo

**Chặn người dùng:**
1. Vào profile người đó
2. Click **"Chặn"**
3. Người đó sẽ không thể xem profile hoặc nhắn tin cho bạn

---

## 🆘 Khắc phục sự cố

### Không thấy người dùng nào

**Nguyên nhân:**
- Bộ lọc quá hẹp (khoảng cách, độ tuổi)
- Chưa có người dùng trong khu vực

**Giải pháp:**
- Tăng bán kính tìm kiếm
- Mở rộng độ tuổi
- Thử lại sau

### Không nhận được thông báo

**Kiểm tra:**
- Đã bật thông báo trong trình duyệt chưa?
- Kiểm tra tab **Thông báo** trong app

### Tin nhắn không gửi được

**Kiểm tra:**
- Kết nối internet
- Đã match với người đó chưa?
- Thử tải lại trang

### Không đăng nhập được

**Kiểm tra:**
- Email và mật khẩu có đúng không?
- Thử reset mật khẩu
- Xóa cache trình duyệt

---

## 📞 Hỗ trợ

**Gặp vấn đề?**
- Email: support@nearmatch.com
- GitHub Issues: https://github.com/ducanhdhtb/make_date_app/issues

**Góp ý tính năng mới?**
- Tạo issue trên GitHub
- Hoặc gửi email cho chúng tôi

---

## 🔐 Chính sách

### Quy tắc cộng đồng

❌ **Không được phép:**
- Spam, quấy rối
- Nội dung khiêu dâm, bạo lực
- Giả mạo danh tính
- Lừa đảo, xin tiền

✅ **Khuyến khích:**
- Tôn trọng người khác
- Trung thực, chân thật
- Giao tiếp lịch sự
- Báo cáo hành vi vi phạm

### Bảo mật thông tin

- Mật khẩu được mã hóa
- Thông tin cá nhân được bảo vệ
- Không chia sẻ dữ liệu với bên thứ ba
- Tuân thủ GDPR

---

## 🎉 Chúc bạn tìm được người phù hợp!

**NearMatch** - Kết nối những trái tim gần nhau ❤️

---

*Phiên bản: 1.0.0*  
*Cập nhật: 2026-04-22*
