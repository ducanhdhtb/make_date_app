package com.nearmatch.e2e;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.BrowserContext;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

public abstract class BaseE2ETest {
  protected static String baseUrl;
  private static Playwright playwright;
  protected static Browser browser;

  protected BrowserContext context;
  protected Page page;

  @BeforeAll
  static void beforeAll() {
    baseUrl = firstNonBlank(
      System.getProperty("baseUrl"),
      System.getenv("BASE_URL"),
      "http://localhost:3002"
    );

    boolean headless = Boolean.parseBoolean(firstNonBlank(
      System.getProperty("headless"),
      System.getenv("HEADLESS"),
      "true"
    ));

    playwright = Playwright.create();
    browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(headless));
  }

  @AfterAll
  static void afterAll() {
    if (browser != null) browser.close();
    if (playwright != null) playwright.close();
  }

  @BeforeEach
  void beforeEach() {
    context = browser.newContext(new Browser.NewContextOptions().setBaseURL(baseUrl));

    // Ensure tests are isolated (no leftover auth/session across tests).
    context.addInitScript("() => { localStorage.clear(); }");

    page = context.newPage();
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
  }

  @AfterEach
  void afterEach() {
    if (context != null) context.close();
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.trim().isEmpty()) return value.trim();
    }
    return null;
  }
}

