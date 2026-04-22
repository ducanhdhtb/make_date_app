package com.nearmatch.e2e.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.nearmatch.e2e.BaseApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * API tests for:
 *   GET  /notifications
 *   POST /notifications/read-all
 */
public class NotificationsApiTest extends BaseApiTest {

  private APIRequestContext authed;

  @BeforeEach
  void authenticate() {
    authed = authedRequest(loginAndGetToken(SEED_EMAIL, SEED_PASSWORD));
  }

  @AfterEach
  void disposeAuthed() {
    if (authed != null) authed.dispose();
  }

  // ── GET /notifications ────────────────────────────────────────────────────

  @Test
  void listNotificationsReturnsJsonArray() {
    APIResponse res = authed.get(p("/notifications"));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray(), "Response should be a JSON array");
  }

  @Test
  void notificationItemHasExpectedFields() {
    JsonNode list = parseJson(authed.get(p("/notifications")));
    if (!list.isArray() || list.isEmpty()) return;

    JsonNode item = list.get(0);
    assertFalse(item.path("id").isMissingNode(),        "notification.id missing");
    assertFalse(item.path("type").isMissingNode(),      "notification.type missing");
    assertFalse(item.path("title").isMissingNode(),     "notification.title missing");
    assertFalse(item.path("isRead").isMissingNode(),    "notification.isRead missing");
    assertFalse(item.path("createdAt").isMissingNode(), "notification.createdAt missing");
  }

  @Test
  void listNotificationsWithoutTokenReturns401() {
    assertEquals(401, request.get(p("/notifications")).status());
  }

  // ── POST /notifications/read-all ─────────────────────────────────────────

  @Test
  void markAllReadReturns2xx() {
    APIResponse res = authed.post(p("/notifications/read-all"));
    assertTrue(res.ok(), "Expected 2xx but got " + res.status() + ": " + res.text());
  }

  @Test
  void afterMarkAllReadAllNotificationsAreRead() {
    authed.post(p("/notifications/read-all"));

    JsonNode list = parseJson(authed.get(p("/notifications")));
    assertTrue(list.isArray());

    for (JsonNode item : list) {
      assertTrue(item.path("isRead").asBoolean(),
        "All notifications should be marked as read after read-all");
    }
  }

  @Test
  void markAllReadWithoutTokenReturns401() {
    assertEquals(401, request.post(p("/notifications/read-all")).status());
  }
}
