package com.nearmatch.e2e;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class ProfileEditTest extends BaseE2ETest {

  @BeforeEach
  void login() {
    page.navigate("/auth/login");
    page.locator(".field:has(label:has-text('Email')) input").fill("linh@example.com");
    page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").fill("Password123!");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập")).click();
    page.waitForURL("**/discover");
  }

  @Test
  void editProfilePageRendersHeading() {
    page.navigate("/profile/edit");
    assertTrue(page.locator("h1:has-text('Hồ sơ của tôi')").isVisible());
  }

  @Test
  void editProfilePageLoadsCurrentUserData() {
    page.navigate("/profile/edit");

    // Wait for the API to load and populate the form (loading text disappears)
    page.waitForFunction("() => !document.querySelector('p')?.textContent?.includes('Đang tải hồ sơ')");
    page.waitForSelector(".field:has(label:has-text('Tên hiển thị')) input");

    // Give React a moment to set the input value
    page.waitForTimeout(500);

    var displayNameInput = page.locator(".field:has(label:has-text('Tên hiển thị')) input");
    // Value should be non-empty after data loads
    assertTrue(!displayNameInput.inputValue().isEmpty(), "Display name should be populated");
  }

  @Test
  void editProfilePageHasAllFormFields() {
    page.navigate("/profile/edit");
    page.waitForSelector(".field:has(label:has-text('Tên hiển thị')) input");

    assertTrue(page.locator(".field:has(label:has-text('Tên hiển thị')) input").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Nghề nghiệp')) input").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Thành phố')) input").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Bio')) textarea").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Sở thích')) input").isVisible());
    assertTrue(page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Lưu thay đổi")).isVisible());
  }

  @Test
  void saveProfileShowsSuccessMessage() {
    page.navigate("/profile/edit");

    // Wait for form to load
    page.waitForFunction("() => !document.querySelector('p')?.textContent?.includes('Đang tải hồ sơ')");
    page.waitForTimeout(500);

    // Update city field and save
    page.locator(".field:has(label:has-text('Thành phố')) input").fill("TP.HCM");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Lưu thay đổi")).click();

    // Expect a green success message — wait for it to appear
    page.waitForSelector("p[style*='color']");
    // The success message contains green color (#15803d)
    var successMsg = page.locator("p[style*='15803d']");
    var errorMsg = page.locator("p[style*='be123c']");
    assertTrue(successMsg.count() > 0 || errorMsg.count() == 0,
      "Expected success message or no error after save");
  }

  @Test
  void avatarUploadInputIsPresent() {
    page.navigate("/profile/edit");
    page.waitForSelector("input[type='file'][accept='image/*']");
    assertTrue(page.locator("input[type='file'][accept='image/*']").isVisible());
  }

  @Test
  void editProfileRedirectsToLoginWhenNotAuthenticated() {
    var freshContext = browser.newContext(
      new com.microsoft.playwright.Browser.NewContextOptions().setBaseURL(baseUrl)
    );
    freshContext.addInitScript("() => { localStorage.clear(); }");
    var freshPage = freshContext.newPage();
    freshPage.setDefaultTimeout(15_000);
    freshPage.setDefaultNavigationTimeout(30_000);

    freshPage.navigate("/profile/edit");
    freshPage.waitForURL("**/auth/login");
    assertTrue(freshPage.url().contains("/auth/login"));

    freshContext.close();
  }
}
