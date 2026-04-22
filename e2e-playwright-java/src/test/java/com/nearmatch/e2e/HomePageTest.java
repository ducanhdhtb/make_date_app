package com.nearmatch.e2e;

import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.Page;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class HomePageTest extends BaseE2ETest {

  @Test
  void homePageRendersHeroHeading() {
    page.navigate("/");
    assertTrue(page.locator("h1:has-text('Tìm người phù hợp')").isVisible());
  }

  @Test
  void homePageHasLoginAndRegisterLinks() {
    page.navigate("/");
    assertTrue(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đăng nhập để bắt đầu")).isVisible());
    assertTrue(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Tạo tài khoản mới")).isVisible());
  }

  @Test
  void homePageHasFeatureCards() {
    page.navigate("/");
    assertTrue(page.locator("h3:has-text('Prisma + PostgreSQL')").isVisible());
    assertTrue(page.locator("h3:has-text('JWT authentication')").isVisible());
    assertTrue(page.locator("h3:has-text('Cloudinary upload')").isVisible());
    assertTrue(page.locator("h3:has-text('Like và match')").isVisible());
    assertTrue(page.locator("h3:has-text('Story 24 giờ')").isVisible());
  }

  @Test
  void homePageLoginLinkNavigatesToLoginPage() {
    page.navigate("/");
    page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đăng nhập để bắt đầu")).click();
    page.waitForURL("**/auth/login");
    assertTrue(page.url().contains("/auth/login"));
  }

  @Test
  void homePageRegisterLinkNavigatesToRegisterPage() {
    page.navigate("/");
    page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Tạo tài khoản mới")).click();
    page.waitForURL("**/auth/register");
    assertTrue(page.url().contains("/auth/register"));
  }

  @Test
  void homePageTitleIsNearMatch() {
    page.navigate("/");
    assertTrue(page.title().contains("NearMatch"));
  }

  @Test
  void navbarBrandLinkIsVisible() {
    page.navigate("/");
    assertTrue(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("NearMatch")).first().isVisible());
  }
}
