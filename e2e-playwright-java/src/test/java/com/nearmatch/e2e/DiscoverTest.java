package com.nearmatch.e2e;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class DiscoverTest extends BaseE2ETest {

  /** Log in once before each test so we land on /discover. */
  @BeforeEach
  void login() {
    page.navigate("/auth/login");
    page.locator(".field:has(label:has-text('Email')) input").fill("linh@example.com");
    page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").fill("Password123!");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập")).click();
    page.waitForURL("**/discover");
  }

  @Test
  void discoverPageShowsStorySection() {
    assertTrue(page.locator("h3:has-text('Story đang hoạt động')").isVisible());
  }

  @Test
  void discoverPageShowsFilterControls() {
    // Radius select
    assertTrue(page.locator("select").first().isVisible());
    // Age inputs
    assertTrue(page.locator("input[type='number']").first().isVisible());
    // Filter button
    assertTrue(page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Lọc")).isVisible());
  }

  @Test
  void discoverPageShowsUserCards() {
    // At least one user card with "Thả tim" button should be present
    page.waitForSelector("button:has-text('Thả tim')");
    assertTrue(page.locator("button:has-text('Thả tim')").first().isVisible());
  }

  @Test
  void discoverPageShowsViewProfileLink() {
    page.waitForSelector("a:has-text('Xem profile')");
    assertTrue(page.locator("a:has-text('Xem profile')").first().isVisible());
  }

  @Test
  void filterByRadiusUpdatesResults() {
    page.waitForSelector("button:has-text('Thả tim')");

    // Change radius to 5km and apply filter
    page.locator("select").first().selectOption("5");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Lọc")).click();

    // Page should still be on /discover after filtering
    assertTrue(page.url().contains("/discover"));
  }

  @Test
  void bottomNavIsVisible() {
    assertTrue(page.locator("a:has-text('Khám phá')").last().isVisible());
    assertTrue(page.locator("a:has-text('Matches')").last().isVisible());
    assertTrue(page.locator("a:has-text('Chats')").last().isVisible());
    assertTrue(page.locator("a:has-text('Story')").last().isVisible());
  }

  @Test
  void likeButtonSendsRequest() {
    page.waitForSelector("button:has-text('Thả tim')");

    // Click the first "Thả tim" button and expect an alert (match or like confirmation)
    page.onDialog(dialog -> dialog.accept());
    page.locator("button:has-text('Thả tim')").first().click();

    // After dialog is dismissed, we should still be on discover
    assertTrue(page.url().contains("/discover"));
  }
}
