package com.nearmatch.e2e;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class RegisterTest extends BaseE2ETest {

  @Test
  void registerPageRendersAllFields() {
    page.navigate("/auth/register");

    assertTrue(page.locator("h1:has-text('Tạo tài khoản mới')").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Email')) input").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Tên hiển thị')) input").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Ngày sinh')) input[type='date']").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Giới tính')) select").isVisible());
    assertTrue(page.locator(".field:has(label:has-text('Quan tâm tới')) select").isVisible());
    assertTrue(page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng ký")).isVisible());
  }

  @Test
  void registerPageHasLinkBackToLogin() {
    page.navigate("/auth/register");

    page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đã có tài khoản")).click();
    page.waitForURL("**/auth/login");
    assertTrue(page.url().contains("/auth/login"));
  }

  @Test
  void registerWithDuplicateEmailShowsError() {
    page.navigate("/auth/register");

    page.locator(".field:has(label:has-text('Email')) input").fill("linh@example.com");
    page.locator(".field:has(label:has-text('Tên hiển thị')) input").fill("Test User");
    page.locator(".field:has(label:has-text('Mật khẩu')) input[type='password']").fill("Password123!");
    page.locator(".field:has(label:has-text('Ngày sinh')) input[type='date']").fill("1995-06-15");

    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng ký")).click();

    // Should stay on register page and show an error
    page.waitForSelector("p[style*='color']");
    assertTrue(page.url().contains("/auth/register"));
  }

  @Test
  void genderDropdownHasExpectedOptions() {
    page.navigate("/auth/register");

    var genderSelect = page.locator(".field:has(label:has-text('Giới tính')) select");
    assertTrue(genderSelect.locator("option[value='female']").count() == 1);
    assertTrue(genderSelect.locator("option[value='male']").count() == 1);
    assertTrue(genderSelect.locator("option[value='other']").count() == 1);
  }
}
