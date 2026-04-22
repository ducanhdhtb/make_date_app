# Test Plan — NearMatch Dating App MVP

**Dự án:** NearMatch  
**Phiên bản:** v13  
**Công nghệ test:** Playwright Java 1.46 + JUnit 5 + Jackson  
**Môi trường:** http://localhost:3002 (web) · http://localhost:3001/api (API)  
**Ngày tạo:** 2026-04-22

---

## 1. Phạm vi kiểm thử

| Layer | Công cụ | Mục tiêu |
|---|---|---|
| **E2E UI** | Playwright Java (Chromium headless) | Luồng người dùng thực tế qua trình duyệt |
| **API** | Playwright `APIRequestContext` + Jackson | Hợp đồng REST, xác thực, mã lỗi |

Ngoài phạm vi: unit test backend, kiểm thử hiệu năng, kiểm thử bảo mật chuyên sâu, upload file thực tế lên Cloudinary.

---

## 2. Môi trường & Điều kiện tiên quyết

```
docker compose up -d          # khởi động web + api + postgres
mvn test -Dheadless=true      # chạy toàn bộ suite
mvn test -Dheadless=false     # chạy có giao diện trình duyệt
mvn test -DapiUrl=http://host/api/   # override API URL
mvn test -DbaseUrl=http://host:3002  # override Web URL
```

**Tài khoản seed mặc định:** `linh@example.com` / `Password123!`

---

## 3. Chiến lược kiểm thử

### 3.1 E2E UI Tests (`com.nearmatch.e2e`)

Mỗi test class mở một `BrowserContext` sạch (localStorage cleared) để đảm bảo isolation. Các test cần đăng nhập sẽ thực hiện login thật qua UI trong `@BeforeEach`.

### 3.2 API Tests (`com.nearmatch.e2e.api`)

Dùng `APIRequestContext` gọi thẳng backend, không qua trình duyệt. Mỗi test class tạo một context riêng với/không có Bearer token. Không mock — test trên dữ liệu thật từ seed.

---

## 4. Test Cases

### 4.1 Trang chủ — `HomePageTest` (7 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| HP-01 | `homePageRendersHeroHeading` | Trang `/` hiển thị heading chính | Heading "Tìm người phù hợp" visible |
| HP-02 | `homePageHasLoginAndRegisterLinks` | Có link đăng nhập và đăng ký | Cả 2 link visible |
| HP-03 | `homePageHasFeatureCards` | Hiển thị 5 feature card | Tất cả card visible |
| HP-04 | `homePageLoginLinkNavigatesToLoginPage` | Click "Đăng nhập" → `/auth/login` | URL chứa `/auth/login` |
| HP-05 | `homePageRegisterLinkNavigatesToRegisterPage` | Click "Tạo tài khoản" → `/auth/register` | URL chứa `/auth/register` |
| HP-06 | `homePageTitleIsNearMatch` | Page title đúng | Title chứa "NearMatch" |
| HP-07 | `navbarBrandLinkIsVisible` | Logo NearMatch visible | Link brand visible |

---

### 4.2 Xác thực — `LoginTest` + `RegisterTest` + `AuthRedirectTest`

#### LoginTest (1 case)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| LG-01 | `loginWithSeedAccountNavigatesToDiscover` | Đăng nhập với tài khoản seed | Redirect sang `/discover`, thấy "Story đang hoạt động" |

#### RegisterTest (4 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| RG-01 | `registerPageRendersAllFields` | Form đăng ký có đủ các trường | Tất cả input/select visible |
| RG-02 | `registerPageHasLinkBackToLogin` | Link "Đã có tài khoản" hoạt động | Redirect sang `/auth/login` |
| RG-03 | `registerWithDuplicateEmailShowsError` | Đăng ký email đã tồn tại | Ở lại trang register, hiện lỗi |
| RG-04 | `genderDropdownHasExpectedOptions` | Dropdown giới tính có 3 option | female/male/other đều có |

#### AuthRedirectTest (1 case)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| AR-01 | `discoverRedirectsToLoginWhenNotAuthenticated` | Truy cập `/discover` không có session | Redirect sang `/auth/login` |

---

### 4.3 Khám phá — `DiscoverTest` (7 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| DC-01 | `discoverPageShowsStorySection` | Section "Story đang hoạt động" visible | Heading visible |
| DC-02 | `discoverPageShowsFilterControls` | Bộ lọc radius/gender/age hiển thị | Select và input visible |
| DC-03 | `discoverPageShowsUserCards` | Có ít nhất 1 user card với nút "Thả tim" | Button visible |
| DC-04 | `discoverPageShowsViewProfileLink` | Có link "Xem profile" | Link visible |
| DC-05 | `filterByRadiusUpdatesResults` | Đổi radius 5km và bấm Lọc | Vẫn ở `/discover` |
| DC-06 | `bottomNavIsVisible` | Bottom navigation hiển thị | Các link nav visible |
| DC-07 | `likeButtonSendsRequest` | Bấm "Thả tim" → alert xuất hiện | Alert được dismiss, ở lại `/discover` |

---

### 4.4 Matches — `MatchesTest` (4 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| MT-01 | `matchesPageRendersHeading` | Heading "Matches của bạn" visible | Heading visible |
| MT-02 | `matchesPageShowsEmptyStateOrMatchList` | Hiển thị danh sách hoặc empty state | Một trong hai visible |
| MT-03 | `matchesPageRedirectsToLoginWhenNotAuthenticated` | Không có session → redirect | URL chứa `/auth/login` |
| MT-04 | `bottomNavIsVisible` | Bottom nav visible | Link "Matches" visible |

---

### 4.5 Chats — `ChatsTest` (5 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| CH-01 | `chatsPageLoads` | Trang `/chats` load thành công | URL chứa `/chats` |
| CH-02 | `chatsPageShowsConversationListOrEmptyState` | Hiển thị hội thoại hoặc loading | Một trong các trạng thái visible |
| CH-03 | `chatsPageRedirectsToLoginWhenNotAuthenticated` | Không có session → redirect | URL chứa `/auth/login` |
| CH-04 | `openChatFromMatchesNavigatesToChats` | Bấm "Nhắn tin" từ Matches | Redirect sang `/chats?conversationId=...` |
| CH-05 | `chatSearchInputIsPresent` | Trang chat load đúng | URL chứa `/chats` |

---

### 4.6 Story — `StoriesTest` (6 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| ST-01 | `storiesPageRendersHeading` | Heading "Story" visible | Heading visible |
| ST-02 | `storiesPageShowsPostForm` | Form đăng story visible | Form và button visible |
| ST-03 | `storyTypeDropdownHasTextAndImageOptions` | Dropdown có option text/image | Cả 2 option có |
| ST-04 | `postTextStoryShowsConfirmationOrError` | Đăng story text → phản hồi | Ở lại `/stories` |
| ST-05 | `switchingToImageTypeShowsFileInput` | Chọn type=image → file input xuất hiện | Input file visible |
| ST-06 | `storiesPageRedirectsToLoginWhenNotAuthenticated` | Không có session → redirect | URL chứa `/auth/login` |

---

### 4.7 Thông báo — `NotificationsTest` (6 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| NT-01 | `notificationsPageRendersHeading` | Heading "Thông báo" visible | Heading visible |
| NT-02 | `notificationsPageHasReloadAndMarkReadButtons` | Có nút "Tải lại" và "Đánh dấu đã đọc" | Cả 2 button visible |
| NT-03 | `notificationsPageShowsItemsOrEmptyState` | Hiển thị thông báo hoặc empty state | Một trong hai visible |
| NT-04 | `markAllReadButtonWorks` | Bấm "Đánh dấu đã đọc" | Ở lại `/notifications` |
| NT-05 | `notificationsPageRedirectsToLoginWhenNotAuthenticated` | Không có session → redirect | URL chứa `/auth/login` |
| NT-06 | `notificationBadgeVisibleInNavbar` | Navbar có button thông báo | Button text chứa "Thông báo" |

---

### 4.8 Hồ sơ — `ProfileEditTest` (6 cases)

| ID | Tên test | Mô tả | Kết quả mong đợi |
|---|---|---|---|
| PE-01 | `editProfilePageRendersHeading` | Heading "Hồ sơ của tôi" visible | Heading visible |
| PE-02 | `editProfilePageLoadsCurrentUserData` | Form được điền dữ liệu từ API | displayName không rỗng |
| PE-03 | `editProfilePageHasAllFormFields` | Tất cả trường form visible | Các input/textarea/select visible |
| PE-04 | `saveProfileShowsSuccessMessage` | Lưu hồ sơ → thông báo thành công | Message màu xanh xuất hiện |
| PE-05 | `avatarUploadInputIsPresent` | Input upload avatar visible | Input file visible |
| PE-06 | `editProfileRedirectsToLoginWhenNotAuthenticated` | Không có session → redirect | URL chứa `/auth/login` |

---

### 4.9 API — Auth (`AuthApiTest`, 11 cases)

| ID | Tên test | Endpoint | Kết quả mong đợi |
|---|---|---|---|
| AA-01 | `loginWithValidCredentialsReturns2xxAndToken` | POST /auth/login | 2xx + accessToken |
| AA-02 | `loginReturnsUserWithExpectedFields` | POST /auth/login | user.id, email, displayName |
| AA-03 | `loginWithWrongPasswordReturns401` | POST /auth/login | 401 |
| AA-04 | `loginWithUnknownEmailReturns401` | POST /auth/login | 401 |
| AA-05 | `loginWithMissingBodyReturns400` | POST /auth/login | 4xx |
| AA-06 | `registerWithValidDataReturns2xxAndToken` | POST /auth/register | 2xx + accessToken |
| AA-07 | `registerWithDuplicateEmailReturns409Or400` | POST /auth/register | 409 hoặc 400 |
| AA-08 | `registerWithMissingRequiredFieldsReturns400` | POST /auth/register | 400 |
| AA-09 | `getMeWithValidTokenReturnsCurrentUser` | GET /auth/me | 2xx + id, email, displayName |
| AA-10 | `getMeWithoutTokenReturns401` | GET /auth/me | 401 |
| AA-11 | `getMeWithInvalidTokenReturns401` | GET /auth/me | 401 |

---

### 4.10 API — Users (`UsersApiTest`, 9 cases)

| ID | Tên test | Endpoint | Kết quả mong đợi |
|---|---|---|---|
| UA-01 | `discoverReturnsJsonArray` | GET /users/discover | 2xx + array |
| UA-02 | `discoverUserHasExpectedFields` | GET /users/discover | id, displayName |
| UA-03 | `discoverWithoutTokenReturns401` | GET /users/discover | 401 |
| UA-04 | `discoverWithAgeBoundsReturnsArray` | GET /users/discover?ageFrom&ageTo | 2xx + array |
| UA-05 | `discoverWithGenderFilterReturnsArray` | GET /users/discover?gender | 2xx + array |
| UA-06 | `getUserProfileByIdReturnsProfile` | GET /users/:id | id, displayName, photos, interests |
| UA-07 | `getUserProfileWithInvalidIdReturns404` | GET /users/00000000... | 404 |
| UA-08 | `getUserProfileWithoutTokenReturns401` | GET /users/:id | 401 |
| UA-09 | `updateProfileReturnsSuccessMessage` | PUT /users/me | 2xx + message + user |
| UA-10 | `updateProfileWithoutTokenReturns401` | PUT /users/me | 401 |

---

### 4.11 API — Likes & Matches (`LikesAndMatchesApiTest`, 8 cases)

| ID | Tên test | Endpoint | Kết quả mong đợi |
|---|---|---|---|
| LM-01 | `likeADiscoveredUserReturns2xxOr409` | POST /likes | 2xx hoặc 409 (already liked) |
| LM-02 | `likeResponseContainsMatchedFieldOrAlreadyLiked` | POST /likes | matched field hoặc 409 |
| LM-03 | `likeWithInvalidTargetIdReturns404Or400` | POST /likes | 404 hoặc 400 |
| LM-04 | `likeWithoutTokenReturns401` | POST /likes | 401 |
| LM-05 | `likeWithMissingBodyReturns400` | POST /likes | 4xx |
| LM-06 | `getMatchesReturnsJsonArray` | GET /matches | 2xx + array |
| LM-07 | `matchItemHasExpectedFields` | GET /matches | id, matchedAt, user |
| LM-08 | `getMatchesWithoutTokenReturns401` | GET /matches | 401 |

---

### 4.12 API — Conversations (`ConversationsApiTest`, 13 cases)

| ID | Tên test | Endpoint | Kết quả mong đợi |
|---|---|---|---|
| CA-01 | `listConversationsReturnsJsonArray` | GET /conversations | 2xx + array |
| CA-02 | `conversationItemHasExpectedFields` | GET /conversations | id, participants, updatedAt |
| CA-03 | `listConversationsWithoutTokenReturns401` | GET /conversations | 401 |
| CA-04 | `createConversationWithMatchedUserReturnsConversation` | POST /conversations | 2xx + id |
| CA-05 | `createConversationWithoutTokenReturns401` | POST /conversations | 401 |
| CA-06 | `createConversationWithMissingBodyReturns400` | POST /conversations | 4xx |
| CA-07 | `listMessagesReturnsPaginatedResponse` | GET /conversations/:id/messages | items + hasMore |
| CA-08 | `listMessagesWithoutTokenReturns401` | GET /conversations/:id/messages | 401 |
| CA-09 | `listMessagesForNonExistentConversationReturns4xx` | GET /conversations/00000000.../messages | 403 hoặc 404 |
| CA-10 | `sendTextMessageReturnsCreatedMessage` | POST /conversations/:id/messages | id, textContent, createdAt |
| CA-11 | `sendMessageWithoutTokenReturns401` | POST /conversations/:id/messages | 401 |
| CA-12 | `sendMessageToNonExistentConversationReturns4xx` | POST /conversations/00000000.../messages | 403 hoặc 404 |
| CA-13 | `listPinsReturnsJsonArray` | GET /conversations/:id/pins | 2xx + array |

---

### 4.13 API — Stories (`StoriesApiTest`, 9 cases)

| ID | Tên test | Endpoint | Kết quả mong đợi |
|---|---|---|---|
| SA-01 | `storiesFeedReturnsJsonArray` | GET /stories/feed | 2xx + array |
| SA-02 | `storyItemHasExpectedFields` | GET /stories/feed | id, mediaType, createdAt, expiresAt |
| SA-03 | `storiesFeedWithoutTokenReturns401` | GET /stories/feed | 401 |
| SA-04 | `createTextStoryReturnsCreatedStory` | POST /stories | 2xx + id + mediaType=text |
| SA-05 | `createStoryWithoutTokenReturns401` | POST /stories | 401 |
| SA-06 | `createStoryWithMissingMediaTypeReturns400` | POST /stories | 4xx |
| SA-07 | `deleteOwnStoryReturns2xx` | DELETE /stories/:id | 2xx |
| SA-08 | `deleteNonExistentStoryReturns404` | DELETE /stories/00000000... | 404 |
| SA-09 | `deleteStoryWithoutTokenReturns401` | DELETE /stories/:id | 401 |

---

### 4.14 API — Notifications (`NotificationsApiTest`, 7 cases)

| ID | Tên test | Endpoint | Kết quả mong đợi |
|---|---|---|---|
| NA-01 | `listNotificationsReturnsJsonArray` | GET /notifications | 2xx + array |
| NA-02 | `notificationItemHasExpectedFields` | GET /notifications | id, type, title, isRead, createdAt |
| NA-03 | `listNotificationsWithoutTokenReturns401` | GET /notifications | 401 |
| NA-04 | `markAllReadReturns2xx` | POST /notifications/read-all | 2xx |
| NA-05 | `afterMarkAllReadAllNotificationsAreRead` | POST + GET /notifications | isRead=true cho tất cả |
| NA-06 | `markAllReadWithoutTokenReturns401` | POST /notifications/read-all | 401 |

---

## 5. Tổng hợp

| Nhóm | Số test |
|---|---|
| E2E UI (HomePageTest) | 7 |
| E2E UI (Auth: Login + Register + Redirect) | 6 |
| E2E UI (Discover) | 7 |
| E2E UI (Matches) | 4 |
| E2E UI (Chats) | 5 |
| E2E UI (Stories) | 6 |
| E2E UI (Notifications) | 6 |
| E2E UI (ProfileEdit) | 6 |
| API (Auth) | 11 |
| API (Users) | 10 |
| API (Likes & Matches) | 8 |
| API (Conversations) | 13 |
| API (Stories) | 9 |
| API (Notifications) | 6 |
| **Tổng** | **104** |

---

## 6. Các khu vực chưa được kiểm thử (Out of Scope hiện tại)

| Khu vực | Lý do |
|---|---|
| Upload ảnh chat / avatar / story thực tế | Cần Cloudinary credentials thật |
| WebSocket realtime (typing, seen, reactions) | Cần 2 session đồng thời |
| Block / Report user flow | Cần seed data phù hợp |
| Message recall / delete / pin / forward | Cần conversation có tin nhắn sẵn |
| Infinite scroll chat | Cần nhiều tin nhắn seed |
| Profile page (`/profile?id=`) | Cần user ID từ discover |
| Admin / moderation | Không có trong MVP |

---

## 7. Cách chạy

```bash
# Toàn bộ suite
cd e2e-playwright-java
mvn test

# Chỉ E2E UI
mvn test -Dtest="HomePageTest,LoginTest,RegisterTest,AuthRedirectTest,DiscoverTest,MatchesTest,ChatsTest,StoriesTest,NotificationsTest,ProfileEditTest"

# Chỉ API tests
mvn test -Dtest="AuthApiTest,UsersApiTest,LikesAndMatchesApiTest,ConversationsApiTest,StoriesApiTest,NotificationsApiTest"

# Một class cụ thể
mvn test -Dtest="AuthApiTest"

# Có giao diện trình duyệt
mvn test -Dheadless=false

# Sinh HTML report
mvn test surefire-report:report
# → target/site/surefire-report.html
```
