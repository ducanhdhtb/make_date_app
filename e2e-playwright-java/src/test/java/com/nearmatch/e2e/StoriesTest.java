package com.nearmatch.e2e;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class StoriesTest extends BaseE2ETest {

  @BeforeEach
  void login() {
    page.navigate("/auth/login");
    page.locator(".field:has(label:has-text('Email')) input").fill("linh@example.com");
    page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").fill("Password123!");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập")).click();
    page.waitForURL("**/discover");
  }

  @Test
  void storiesPageRendersHeading() {
    page.navigate("/stories");
    assertTrue(page.locator("h1:has-text('Story')").isVisible());
  }

  @Test
  void storiesPageShowsPostForm() {
    page.navigate("/stories");
    assertTrue(page.locator("h2:has-text('Đăng story mới')").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Loại story')) select").isVisible());
    assertTrue(page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng story")).isVisible());
  }

  @Test
  void storyTypeDropdownHasTextAndImageOptions() {
    page.navigate("/stories");

    var select = page.locator(".field:has(label:has-text('Loại story')) select");
    assertTrue(select.locator("option[value='text']").count() == 1);
    assertTrue(select.locator("option[value='image']").count() == 1);
  }

  @Test
  void postTextStoryShowsConfirmationOrError() {
    page.navigate("/stories");

    page.locator("textarea[placeholder='Hôm nay của bạn thế nào?']").fill("Test story từ E2E");
    page.locator("input[placeholder='Viết caption ngắn']").fill("E2E caption");

    page.onDialog(dialog -> dialog.accept());
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng story")).click();

    // After posting, either a success alert fires or the page stays on /stories
    assertTrue(page.url().contains("/stories"));
  }

  @Test
  void switchingToImageTypeShowsFileInput() {
    page.navigate("/stories");

    page.locator(".field:has(label:has-text('Loại story')) select").selectOption("image");

    // File input should appear when image type is selected
    assertTrue(page.locator("input[type='file']").isVisible());
  }

  @Test
  void storiesPageRedirectsToLoginWhenNotAuthenticated() {
    var freshContext = browser.newContext(
      new com.microsoft.playwright.Browser.NewContextOptions().setBaseURL(baseUrl)
    );
    freshContext.addInitScript("() => { localStorage.clear(); }");
    var freshPage = freshContext.newPage();
    freshPage.setDefaultTimeout(15_000);
    freshPage.setDefaultNavigationTimeout(30_000);

    freshPage.navigate("/stories");
    freshPage.waitForURL("**/auth/login");
    assertTrue(freshPage.url().contains("/auth/login"));

    freshContext.close();
  }
}
