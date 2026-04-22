package com.nearmatch.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.APIRequest;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Playwright;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

import java.util.HashMap;
import java.util.Map;

/**
 * Base class for API-level tests.
 *
 * Playwright's APIRequestContext resolves paths like a browser:
 *   baseURL = "http://host/api"  +  path "/foo"  →  "http://host/foo"  (WRONG)
 *   baseURL = "http://host/api/" +  path "foo"   →  "http://host/api/foo" (OK)
 *
 * So we set baseURL to "http://localhost:3001/api/" (trailing slash) and
 * every helper strips the leading slash from the path before calling.
 *
 * Default: http://localhost:3001/api/  (override with -DapiUrl=http://host/api/)
 */
public abstract class BaseApiTest {

  protected static String apiUrl;
  private static Playwright playwright;
  protected static final ObjectMapper MAPPER = new ObjectMapper();

  protected APIRequestContext request;

  protected static final String SEED_EMAIL    = "linh@example.com";
  protected static final String SEED_PASSWORD = "Password123!";

  @BeforeAll
  static void beforeAll() {
    String raw = firstNonBlank(
      System.getProperty("apiUrl"),
      System.getenv("API_URL"),
      "http://localhost:3001/api"
    );
    // Ensure trailing slash so Playwright resolves relative paths correctly
    apiUrl = raw.endsWith("/") ? raw : raw + "/";
    playwright = Playwright.create();
  }

  @AfterAll
  static void afterAll() {
    if (playwright != null) playwright.close();
  }

  @BeforeEach
  void beforeEach() {
    request = newContext(null);
  }

  @AfterEach
  void afterEach() {
    if (request != null) request.dispose();
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /** Strip leading slash so paths resolve relative to baseURL. */
  protected static String p(String path) {
    return path.startsWith("/") ? path.substring(1) : path;
  }

  /** Parse response body as a JsonNode. */
  protected JsonNode parseJson(APIResponse res) {
    try {
      return MAPPER.readTree(res.body());
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse JSON: " + res.text(), e);
    }
  }

  /** Log in and return the Bearer token. */
  protected String loginAndGetToken(String email, String password) {
    APIResponse response = request.post(p("/auth/login"),
      com.microsoft.playwright.options.RequestOptions.create()
        .setData(Map.of("email", email, "password", password)));
    if (!response.ok()) {
      throw new RuntimeException("Login failed: " + response.status() + " " + response.text());
    }
    return parseJson(response).get("accessToken").asText();
  }

  /** Return a new APIRequestContext with Authorization header pre-set. */
  protected APIRequestContext authedRequest(String token) {
    Map<String, String> headers = new HashMap<>();
    headers.put("Content-Type", "application/json");
    headers.put("Authorization", "Bearer " + token);
    return newContext(headers);
  }

  private APIRequestContext newContext(Map<String, String> extraHeaders) {
    Map<String, String> headers = new HashMap<>();
    headers.put("Content-Type", "application/json");
    if (extraHeaders != null) headers.putAll(extraHeaders);
    return playwright.request().newContext(
      new APIRequest.NewContextOptions()
        .setBaseURL(apiUrl)
        .setExtraHTTPHeaders(headers)
    );
  }

  private static String firstNonBlank(String... values) {
    for (String v : values) {
      if (v != null && !v.trim().isEmpty()) return v.trim();
    }
    return null;
  }
}
