# Hướng dẫn chi tiết: Tạo GitHub Personal Access Token + Kết nối Jenkins

## Phần 1 — Tạo GitHub Personal Access Token

### Bước 1: Vào trang Settings của GitHub

1. Đăng nhập GitHub với tài khoản `ducanhdhtb`
2. Click vào **avatar góc phải trên** → chọn **Settings**
3. Hoặc truy cập trực tiếp: https://github.com/settings/profile

---

### Bước 2: Vào Developer settings

1. Scroll xuống sidebar bên trái
2. Click **Developer settings** (mục cuối cùng)
3. Hoặc truy cập: https://github.com/settings/apps

---

### Bước 3: Tạo Personal Access Token (Classic)

1. Sidebar trái → click **Personal access tokens** → **Tokens (classic)**
2. Click nút **Generate new token** → chọn **Generate new token (classic)**
3. Hoặc truy cập: https://github.com/settings/tokens/new

---

### Bước 4: Điền thông tin token

```
Note (tên token):
  jenkins-nearmatch-ci
  
Expiration:
  No expiration  (hoặc chọn 90 days nếu muốn bảo mật hơn)

Select scopes (quyền):
  ✅ repo                    ← QUAN TRỌNG: toàn bộ quyền repo
     ✅ repo:status
     ✅ repo_deployment
     ✅ public_repo
     ✅ repo:invite
     ✅ security_events
  
  ✅ admin:repo_hook         ← QUAN TRỌNG: quản lý webhook
     ✅ write:repo_hook
     ✅ read:repo_hook
```

**Giải thích:**
- `repo`: Jenkins cần đọc code, xem commit, branch
- `admin:repo_hook`: Jenkins tự tạo/xóa webhook trên repo

---

### Bước 5: Generate và copy token

1. Scroll xuống → click **Generate token** (nút xanh)
2. Token hiện ra dạng: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **QUAN TRỌNG:** Copy token ngay (chỉ hiện 1 lần duy nhất)
4. Lưu vào notepad tạm thời

> ⚠️ **Nếu mất token:** Không thể xem lại, phải tạo token mới.

---

## Phần 2 — Thêm Token vào Jenkins

### Bước 1: Vào Jenkins System Configuration

1. Mở Jenkins: http://localhost:8080
2. Đăng nhập với tài khoản admin
3. Click **Manage Jenkins** (sidebar trái)
4. Click **System** (hoặc **Configure System**)

---

### Bước 2: Tìm GitHub section

1. Scroll xuống tìm section **GitHub**
2. Nếu không thấy → cài plugin **GitHub Integration** trước:
   - Manage Jenkins → Plugins → Available
   - Tìm "GitHub Integration Plugin" → Install
   - Restart Jenkins

---

### Bước 3: Add GitHub Server

Click **Add GitHub Server** → chọn **GitHub Server**

```
Name:
  GitHub
  
API URL:
  https://api.github.com
  (giữ nguyên, không đổi)

Credentials:
  → Click "Add" → chọn "Jenkins"
```

---

### Bước 4: Tạo Credential mới

Popup hiện ra, điền:

```
Domain:
  Global credentials (unrestricted)

Kind:
  Secret text                    ← QUAN TRỌNG: chọn đúng loại này

Scope:
  Global

Secret:
  ghp_xxxxxxxxxxxxxxxxxxxx       ← DÁN TOKEN VỪA COPY TỪ GITHUB

ID:
  github-token                   ← tên để nhận diện, dùng sau này

Description:
  GitHub Personal Access Token for nearmatch-e2e
```

Click **Add**.

---

### Bước 5: Chọn Credential vừa tạo

Quay lại form GitHub Server:

```
Credentials:
  github-token                   ← chọn credential vừa tạo

✅ Manage hooks                  ← TICK VÀO ĐÂY
   (Jenkins sẽ tự tạo webhook trên GitHub repo)
```

---

### Bước 6: Test connection

1. Click nút **Test connection**
2. Phải thấy thông báo:
   ```
   Credentials verified for user ducanhdhtb, rate limit: 4999
   ```
3. Nếu lỗi → kiểm tra lại token có đúng scope không

---

### Bước 7: Save

Click **Save** ở cuối trang.

---

## Phần 3 — Sử dụng Token trong Jenkins Job

### Khi tạo Pipeline job

```
Pipeline → Pipeline script from SCM
  SCM: Git
  Repository URL: https://github.com/ducanhdhtb/make_date_app.git
  
  Credentials: github-token      ← chọn credential đã tạo
  
  Branch: */main
  Script Path: Jenkinsfile
```

---

## Phần 4 — Kiểm tra Webhook đã tạo tự động

### Cách 1: Qua GitHub UI

1. Vào repo: https://github.com/ducanhdhtb/make_date_app
2. Click **Settings** (tab trên cùng)
3. Sidebar trái → **Webhooks**
4. Phải thấy webhook:
   ```
   Payload URL: http://<jenkins-host>/github-webhook/
   Content type: application/json
   Events: push
   Status: ✅ (green tick)
   ```

### Cách 2: Qua Jenkins log

Sau khi Save ở Bước 7, xem Jenkins log:
```
Manage Jenkins → System Log → All Jenkins Logs
```
Tìm dòng:
```
Created GitHub webhook for https://github.com/ducanhdhtb/make_date_app
```

---

## Troubleshooting

### Lỗi 1: "Credentials verified" fail

**Nguyên nhân:**
- Token sai
- Token thiếu scope `repo` hoặc `admin:repo_hook`
- Token đã bị revoke

**Fix:**
1. Vào GitHub → Settings → Developer settings → Tokens
2. Xóa token cũ
3. Tạo token mới với đúng scope
4. Update lại credential trong Jenkins

---

### Lỗi 2: Webhook không tự tạo

**Nguyên nhân:**
- Chưa tick ✅ "Manage hooks"
- Token thiếu scope `admin:repo_hook`
- Jenkins không accessible từ internet (nếu dùng localhost)

**Fix:**
1. Kiểm tra lại scope token
2. Tick lại "Manage hooks" → Save
3. Nếu Jenkins chạy local → dùng ngrok (xem phần dưới)

---

### Lỗi 3: Webhook có nhưng không trigger

**Nguyên nhân:**
- Jenkins chạy localhost, GitHub không gọi được vào
- Firewall block port 8080

**Fix — Dùng ngrok:**

```bash
# 1. Cài ngrok
brew install ngrok
# hoặc tải tại https://ngrok.com/download

# 2. Chạy ngrok
ngrok http 8080

# 3. Copy URL forwarding
# Forwarding: https://abc123.ngrok.io → http://localhost:8080

# 4. Vào GitHub repo → Settings → Webhooks
# Sửa Payload URL thành: https://abc123.ngrok.io/github-webhook/

# 5. Test webhook
# GitHub → Settings → Webhooks → click webhook → Recent Deliveries
# Bấm "Redeliver" → phải thấy Response 200
```

---

## Tóm tắt các bước

| # | Phần | Thao tác |
|---|---|---|
| 1 | GitHub | Settings → Developer settings → Tokens → Generate new token (classic) |
| 2 | GitHub | Chọn scope: `repo` + `admin:repo_hook` → Generate → Copy token |
| 3 | Jenkins | Manage Jenkins → System → GitHub → Add GitHub Server |
| 4 | Jenkins | Credentials → Add → Secret text → dán token → ID: `github-token` |
| 5 | Jenkins | Chọn credential → ✅ Manage hooks → Test connection → Save |
| 6 | GitHub | Settings → Webhooks → kiểm tra webhook đã tạo tự động |
| 7 | Test | Push code → Jenkins tự chạy |

---

## Video hướng dẫn (nếu cần)

Nếu cần video chi tiết hơn, xem:
- GitHub Token: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- Jenkins GitHub Plugin: https://plugins.jenkins.io/github/

---

## Bảo mật Token

✅ **NÊN:**
- Lưu token vào Jenkins Credentials (encrypted)
- Đặt expiration 90 days và renew định kỳ
- Chỉ cấp scope cần thiết

❌ **KHÔNG NÊN:**
- Commit token vào code
- Share token qua email/chat
- Dùng token của người khác
- Cấp scope `admin:org` nếu không cần

---

## Câu hỏi thường gặp

**Q: Token có hết hạn không?**  
A: Tùy chọn khi tạo. Nếu chọn "No expiration" thì dùng mãi mãi (trừ khi revoke).

**Q: Một token dùng cho nhiều repo được không?**  
A: Được. Token có scope `repo` sẽ truy cập tất cả repo của user.

**Q: Mất token thì sao?**  
A: Không xem lại được. Phải tạo token mới và update lại Jenkins.

**Q: Jenkins có thể tự renew token không?**  
A: Không. Phải renew thủ công khi token hết hạn.

**Q: Dùng GitHub App thay vì token được không?**  
A: Được, nhưng phức tạp hơn. Token (classic) đơn giản nhất cho CI/CD.
