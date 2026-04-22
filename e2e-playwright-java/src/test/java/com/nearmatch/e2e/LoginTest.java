package com.nearmatch.e2e;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class LoginTest extends BaseE2ETest {
  @Test
  void loginWithSeedAccountNavigatesToDiscover() {
    page.navigate("/auth/login");

    // The app's labels are not associated with inputs via "for"/id, so use structural selectors.
    page.locator(".field:has(label:has-text('Email')) input").fill("linh@example.com");
    page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").fill("Password123!");

    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập")).click();

    page.waitForURL("**/discover");
    assertTrue(page.url().contains("/discover"));

    // Smoke assertion for the Discover page.
    assertTrue(page.locator("text=Story đang hoạt động").first().isVisible());
  }
}

