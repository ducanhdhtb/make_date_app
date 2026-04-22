# Hướng dẫn cấu hình Jenkins CI — NearMatch E2E

## Thông tin

| | URL |
|---|---|
| GitHub repo | https://github.com/ducanhdhtb/make_date_app |
| Jenkins | http://localhost:8080/job/nearmatch-e2e/ |
| Email nhận kết quả | ducanhdhtb@gmail.com |

---

## Luồng hoạt động

```
Dev push code
     │
     ▼
  GitHub nhận push
     │
     │  GitHub gửi HTTP POST đến Jenkins
     │  POST http://<jenkins-host>/github-webhook/
     │  Body: { repo, branch, commits, ... }
     ▼
  Jenkins nhận webhook
     │
     │  Jenkins kiểm tra: job nào đang
     │  watch repo này + branch này?
     ▼
  Jenkins tìm thấy job "nearmatch-e2e"
     │  (vì job đã config SCM = repo đó)
     │  (vì job tick "GitHub hook trigger")
     ▼
  Jenkins tự động chạy pipeline
     │
     ├── Checkout code mới nhất
     ├── Cài Chromium (Playwright)
     ├── Chạy 104 test (E2E UI + API)
     ├── Generate Allure report
     └── Gửi email kết quả → ducanhdhtb@gmail.com
```

---

## BƯỚC 1 — Cài Plugin Jenkins

Vào **http://localhost:8080 → Manage Jenkins → Plugins → Available plugins**

Tìm và cài 4 plugin sau:

| Plugin | Dùng để |
|---|---|
| **GitHub Integration Plugin** | Nhận webhook từ GitHub |
| **Allure Jenkins Plugin** | Hiển thị Allure report trong Jenkins |
| **Email Extension Plugin** | Gửi email HTML có pass/fail/trace |
| **Pipeline** | Chạy Jenkinsfile (thường đã có sẵn) |

Sau khi cài → **Restart Jenkins**.

---

## BƯỚC 2 — Cấu hình Maven và JDK

Vào **Manage Jenkins → Tools**

### Maven
```
Maven installations → Add Maven
  Name:                  maven3        ← phải đúng tên này
  Install automatically: ✅
  Version:               3.9.6
```

### JDK
```
JDK installations → Add JDK
  Name:                  jdk17         ← phải đúng tên này
  Install automatically: ✅
  Version:               17
```

Bấm **Save**.

---

## BƯỚC 3 — Kết nối Jenkins với GitHub

### 3.1 Tạo GitHub Personal Access Token

1. Vào https://github.com/settings/tokens → **Generate new token (classic)**
2. Đặt tên: `jenkins-nearmatch`
3. Chọn scope: ✅ `repo` + ✅ `admin:repo_hook`
4. Bấm **Generate token** → copy token (chỉ hiện 1 lần)

### 3.2 Thêm token vào Jenkins

Vào **Manage Jenkins → System → GitHub section**

```
GitHub Servers → Add GitHub Server
  Name:        GitHub
  API URL:     https://api.github.com
  Credentials: Add → Jenkins
               Kind: Secret text
               Secret: <dán token vừa tạo>
               ID: github-token
  ✅ Manage hooks   ← Jenkins tự tạo webhook trên GitHub
```

Bấm **Test connection** → phải thấy **"Credentials verified"**

Bấm **Save**.

---

## BƯỚC 4 — Cấu hình Email (SMTP)

Vào **Manage Jenkins → System → Extended E-mail Notification**

```
SMTP server:     smtp.gmail.com
SMTP Port:       465
✅ Use SSL

Credentials → Add:
  Kind:     Username with password
  Username: ducanhdhtb@gmail.com
  Password: <App Password của Gmail>  ← xem hướng dẫn bên dưới
```

> **Tạo Gmail App Password:**
> 1. Vào https://myaccount.google.com/security
> 2. Bật **2-Step Verification** (nếu chưa bật)
> 3. Vào **App passwords** → chọn app: Mail, device: Other → đặt tên "Jenkins"
> 4. Copy 16 ký tự → dán vào Password ở trên

```
Default user e-mail suffix: @gmail.com
Default Content Type:       HTML (text/html)
```

Bấm **Save**.

---

## BƯỚC 5 — Tạo Jenkins Job

Vào **http://localhost:8080 → New Item**

```
Item name: nearmatch-e2e
Type:      Pipeline
→ OK
```

### Tab General
```
✅ GitHub project
   Project url: https://github.com/ducanhdhtb/make_date_app
```

### Tab Build Triggers
```
✅ GitHub hook trigger for GITScm polling   ← QUAN TRỌNG
```

### Tab Pipeline
```
Definition:   Pipeline script from SCM
SCM:          Git
Repository URL: https://github.com/ducanhdhtb/make_date_app.git
Credentials:  github-token  (token đã tạo ở Bước 3)
Branch:       */main
Script Path:  Jenkinsfile
```

Bấm **Save**.

---

## BƯỚC 6 — Cấu hình GitHub Webhook

Jenkins đã tick **"Manage hooks"** ở Bước 3 nên sẽ **tự tạo webhook**.

Kiểm tra tại:
**https://github.com/ducanhdhtb/make_date_app → Settings → Webhooks**

Phải thấy webhook với:
```
Payload URL:  http://<jenkins-host>/github-webhook/
Content type: application/json
Events:       push
Status:       ✅ green tick
```

> ⚠️ **Nếu Jenkins chạy local (localhost:8080)**, GitHub không gọi được vào.
> Dùng **ngrok** để expose ra ngoài:
>
> ```bash
> # Cài ngrok: https://ngrok.com/download
> ngrok http 8080
> # → Forwarding: https://abc123.ngrok.io
> ```
>
> Sau đó vào GitHub → Settings → Webhooks → sửa Payload URL thành:
> `https://abc123.ngrok.io/github-webhook/`

---

## BƯỚC 7 — Test toàn bộ luồng

1. Vào **http://localhost:8080/job/nearmatch-e2e/** → **Build Now** (chạy thử lần đầu)
2. Xem **Console Output** — phải thấy Maven chạy test
3. Sau khi xong → xem **Allure Report** (link trên trang build)
4. Kiểm tra email tại `ducanhdhtb@gmail.com`

Sau đó test webhook:
```bash
# Tạo 1 commit nhỏ bất kỳ và push
git commit --allow-empty -m "test: trigger CI"
git push
```
→ Jenkins phải tự động chạy trong vài giây.

---

## Email nhận được trông như thế nào

```
Subject: [NearMatch E2E] SUCCESS — Build #5 | ✅98 ❌4 ⚠️2

Nội dung:
- Bảng: Build number, Branch, Duration, Status
- Bảng: Passed / Failed / Skipped / Total
- Bảng Failed Tests: tên test + error message + trace
- Link: Allure Report (xem trace chi tiết từng test)
- Link: Jenkins Build, Console Output, Test Report
```

---

## Cấu trúc file trong repo

```
make_date_app/
├── Jenkinsfile                          ← Pipeline CI
├── JENKINS_SETUP.md                     ← File này
├── docker-compose.yml
├── apps/
│   ├── api/                             ← NestJS backend
│   └── web/                             ← Next.js frontend
├── e2e-playwright-java/
│   ├── pom.xml                          ← Maven + Allure config
│   ├── TEST_PLAN.md                     ← 104 test cases
│   └── src/test/java/com/nearmatch/e2e/
│       ├── api/                         ← 57 API tests
│       └── *.java                       ← 47 E2E UI tests
└── docs/
```

---

## Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `mvn: command not found` | Chưa cấu hình Maven tool | Bước 2 |
| `getRawBuild not permitted` | Script Security | Manage Jenkins → In-process Script Approval → Approve |
| Webhook không trigger | Jenkins không accessible từ internet | Dùng ngrok (Bước 6) |
| Email không gửi được | SMTP sai hoặc chưa có App Password | Bước 4 |
| `Credentials verified` fail | Token sai hoặc thiếu scope | Tạo lại token với scope `repo` + `admin:repo_hook` |
| Allure report trống | Test chưa chạy hoặc allure-results rỗng | Xem Console Output để tìm lỗi |
