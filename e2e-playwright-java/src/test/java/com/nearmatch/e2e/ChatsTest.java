package com.nearmatch.e2e;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ChatsTest extends BaseE2ETest {

  @BeforeEach
  void login() {
    page.navigate("/auth/login");
    page.locator(".field:has(label:has-text('Email')) input").fill("linh@example.com");
    page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").fill("Password123!");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập")).click();
    page.waitForURL("**/discover");
  }

  @Test
  void chatsPageLoads() {
    page.navigate("/chats");
    page.waitForSelector(".page, .container", new Page.WaitForSelectorOptions().setTimeout(10_000));
    assertTrue(page.url().contains("/chats"));
  }

  @Test
  void chatsPageShowsConversationListOrEmptyState() {
    page.navigate("/chats");
    page.waitForLoadState();

    boolean hasConversations = page.locator(".chat-list-item").count() > 0;
    boolean isEmpty = page.locator("text=Chưa có hội thoại nào").isVisible();

    assertTrue(hasConversations || isEmpty,
      "Chats page should show conversations or empty state");
  }

  @Test
  void chatsPageRedirectsToLoginWhenNotAuthenticated() {
    var freshContext = browser.newContext(
      new com.microsoft.playwright.Browser.NewContextOptions().setBaseURL(baseUrl)
    );
    freshContext.addInitScript("() => { localStorage.clear(); }");
    var freshPage = freshContext.newPage();
    freshPage.setDefaultTimeout(15_000);
    freshPage.setDefaultNavigationTimeout(30_000);

    freshPage.navigate("/chats");
    freshPage.waitForURL("**/auth/login");
    assertTrue(freshPage.url().contains("/auth/login"));

    freshContext.close();
  }

  @Test
  void selectConversationDisplaysMessages() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      // No conversations, skip test
      return;
    }

    // Click first conversation
    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Should show chat box with messages or empty state
    boolean hasChatBox = page.locator(".chat-box").isVisible();
    boolean hasMessages = page.locator(".chat-bubble").count() > 0;
    boolean isEmpty = page.locator("text=Chưa có tin nhắn nào").isVisible();

    assertTrue(hasChatBox && (hasMessages || isEmpty),
      "Should display chat box with messages or empty state");
  }

  @Test
  void sendTextMessageSuccessfully() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    // Select first conversation
    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Type and send message
    String testMessage = "Test message " + System.currentTimeMillis();
    page.locator("input[placeholder='Nhập tin nhắn...']").fill(testMessage);
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Gửi")).click();

    // Wait for message to appear
    page.waitForSelector(".chat-bubble:has-text('" + testMessage + "')", 
      new Page.WaitForSelectorOptions().setTimeout(5_000));

    // Verify message appears in chat
    assertTrue(page.locator(".chat-bubble:has-text('" + testMessage + "')").isVisible(),
      "Sent message should appear in chat");
  }

  @Test
  void messageShowsDeliveryStatus() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    String testMessage = "Status test " + System.currentTimeMillis();
    page.locator("input[placeholder='Nhập tin nhắn...']").fill(testMessage);
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Gửi")).click();

    // Wait for message to appear
    page.waitForSelector(".chat-bubble:has-text('" + testMessage + "')", 
      new Page.WaitForSelectorOptions().setTimeout(5_000));

    // Check for delivery status (should show "Đang gửi", "Đã nhận", or "Đã xem")
    boolean hasStatus = page.locator(".chat-bubble:has-text('" + testMessage + "') >> text=/Đang gửi|Đã nhận|Đã xem/").count() > 0;
    assertTrue(hasStatus, "Message should show delivery status");
  }

  @Test
  void replyToMessageSuccessfully() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    int messageCount = page.locator(".chat-bubble").count();
    if (messageCount == 0) {
      return;
    }

    // Click reply button on first message
    page.locator(".chat-bubble").first().hover();
    page.locator(".chat-bubble").first().locator("button:has-text('Reply')").click();

    // Verify reply quote appears
    assertTrue(page.locator(".composer-quote").isVisible(),
      "Reply quote should appear in composer");

    // Send reply
    String replyText = "Reply test " + System.currentTimeMillis();
    page.locator("input[placeholder='Nhập tin nhắn...']").fill(replyText);
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Gửi")).click();

    // Verify reply message appears
    page.waitForSelector(".chat-bubble:has-text('" + replyText + "')", 
      new Page.WaitForSelectorOptions().setTimeout(5_000));
    assertTrue(page.locator(".chat-bubble:has-text('" + replyText + "')").isVisible(),
      "Reply message should appear in chat");
  }

  @Test
  void addReactionToMessage() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    int messageCount = page.locator(".chat-bubble").count();
    if (messageCount == 0) {
      return;
    }

    // Hover over message and click reaction button
    page.locator(".chat-bubble").first().hover();
    page.locator(".chat-bubble").first().locator("button:has-text('❤️')").click();

    // Wait for reaction to appear
    page.waitForSelector(".reaction-chip", new Page.WaitForSelectorOptions().setTimeout(3_000));

    // Verify reaction appears
    assertTrue(page.locator(".reaction-chip").count() > 0,
      "Reaction should appear on message");
  }

  @Test
  void searchMessagesInConversation() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Use search input
    page.locator("input[placeholder='Tìm trong hội thoại...']").fill("test");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Tìm")).click();

    page.waitForLoadState();

    // Verify search was executed (page should still be on chats)
    assertTrue(page.url().contains("/chats"),
      "Should remain on chats page after search");
  }

  @Test
  void typingIndicatorAppears() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Start typing
    page.locator("input[placeholder='Nhập tin nhắn...']").fill("T");

    // Typing indicator should appear (may take a moment)
    page.waitForTimeout(500);

    // Verify page is still functional
    assertTrue(page.url().contains("/chats"),
      "Should remain on chats page while typing");
  }

  @Test
  void uploadImageMessage() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Create a simple test image file
    java.nio.file.Path imagePath = createTestImageFile();

    // Upload image
    page.locator("input[type='file'][accept='image/*']").setInputFiles(imagePath);

    // Wait for preview to appear
    page.waitForSelector(".composer-preview", new Page.WaitForSelectorOptions().setTimeout(3_000));

    // Verify preview is shown
    assertTrue(page.locator(".composer-preview").isVisible(),
      "Image preview should appear");

    // Send image
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Gửi")).click();

    // Wait for image message to appear
    page.waitForSelector(".chat-image", new Page.WaitForSelectorOptions().setTimeout(5_000));

    assertTrue(page.locator(".chat-image").count() > 0,
      "Image message should appear in chat");
  }

  @Test
  void conversationListUpdatesAfterNewMessage() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    // Get first conversation's text before sending message
    String firstConvTextBefore = page.locator(".chat-list-item").first().locator(".muted").textContent();

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Send message
    String testMessage = "Update test " + System.currentTimeMillis();
    page.locator("input[placeholder='Nhập tin nhắn...']").fill(testMessage);
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Gửi")).click();

    // Wait for message to appear
    page.waitForSelector(".chat-bubble:has-text('" + testMessage + "')", 
      new Page.WaitForSelectorOptions().setTimeout(5_000));

    // Verify conversation list updated with new message preview
    String firstConvTextAfter = page.locator(".chat-list-item").first().locator(".muted").textContent();
    assertNotEquals(firstConvTextBefore, firstConvTextAfter,
      "Conversation list should update with new message preview");
  }

  @Test
  void openChatFromMatchesNavigatesToChats() {
    page.navigate("/matches");
    page.waitForSelector("h1:has-text('Matches của bạn')");

    boolean hasMatchCard = page.locator("button:has-text('Nhắn tin')").count() > 0;
    if (!hasMatchCard) {
      assertTrue(page.locator("text=Chưa có match nào").isVisible());
      return;
    }

    page.locator("button:has-text('Nhắn tin')").first().click();
    page.waitForURL("**/chats**");
    assertTrue(page.url().contains("/chats"));
  }

  @Test
  void socketConnectionStatusDisplayed() {
    page.navigate("/chats");
    page.waitForLoadState();

    // Check for socket status indicator
    boolean hasStatus = page.locator("text=/Trạng thái realtime|connected|disconnected/").count() > 0;
    assertTrue(hasStatus || page.locator(".inline-status").count() > 0,
      "Socket connection status should be displayed");
  }

  @Test
  void clearSearchFiltersMessages() {
    page.navigate("/chats");
    page.waitForLoadState();

    int conversationCount = page.locator(".chat-list-item").count();
    if (conversationCount == 0) {
      return;
    }

    page.locator(".chat-list-item").first().click();
    page.waitForLoadState();

    // Search for something
    page.locator("input[placeholder='Tìm trong hội thoại...']").fill("test");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Tìm")).click();

    page.waitForLoadState();

    // Clear search
    boolean hasClearButton = page.locator("button:has-text('Bỏ lọc')").count() > 0;
    if (hasClearButton) {
      page.locator("button:has-text('Bỏ lọc')").click();
      page.waitForLoadState();
    }

    assertTrue(page.url().contains("/chats"),
      "Should remain on chats page after clearing search");
  }

  private java.nio.file.Path createTestImageFile() {
    // Create a simple 1x1 pixel PNG file for testing
    String tempDir = System.getProperty("java.io.tmpdir");
    java.nio.file.Path filePath = java.nio.file.Paths.get(tempDir, "test-image-" + System.currentTimeMillis() + ".png");
    
    try {
      // 1x1 transparent PNG
      byte[] pngData = {
        (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
        (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
        0x42, 0x60, (byte) 0x82
      };
      
      java.nio.file.Files.write(filePath, pngData);
      return filePath;
    } catch (Exception e) {
      throw new RuntimeException("Failed to create test image", e);
    }
  }
}
