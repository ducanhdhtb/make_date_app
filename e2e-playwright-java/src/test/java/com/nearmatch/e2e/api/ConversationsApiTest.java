package com.nearmatch.e2e.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.options.RequestOptions;
import com.nearmatch.e2e.BaseApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * API tests for:
 *   POST /conversations
 *   GET  /conversations
 *   GET  /conversations/:id/messages
 *   POST /conversations/:id/messages
 *   GET  /conversations/:id/pins
 */
public class ConversationsApiTest extends BaseApiTest {

  private APIRequestContext authed;

  @BeforeEach
  void authenticate() {
    authed = authedRequest(loginAndGetToken(SEED_EMAIL, SEED_PASSWORD));
  }

  @AfterEach
  void disposeAuthed() {
    if (authed != null) authed.dispose();
  }

  // ── GET /conversations ────────────────────────────────────────────────────

  @Test
  void listConversationsReturnsJsonArray() {
    APIResponse res = authed.get(p("/conversations"));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray(), "Response should be a JSON array");
  }

  @Test
  void conversationItemHasExpectedFields() {
    JsonNode list = parseJson(authed.get(p("/conversations")));
    if (!list.isArray() || list.isEmpty()) return;

    JsonNode conv = list.get(0);
    assertFalse(conv.path("id").isMissingNode(),           "conversation.id missing");
    assertFalse(conv.path("participants").isMissingNode(), "conversation.participants missing");
    assertFalse(conv.path("updatedAt").isMissingNode(),    "conversation.updatedAt missing");
  }

  @Test
  void listConversationsWithoutTokenReturns401() {
    assertEquals(401, request.get(p("/conversations")).status());
  }

  // ── POST /conversations ───────────────────────────────────────────────────

  @Test
  void createConversationWithMatchedUserReturnsConversation() {
    JsonNode matches = parseJson(authed.get(p("/matches")));
    if (!matches.isArray() || matches.isEmpty()) return;

    String targetUserId = matches.get(0).path("user").path("id").asText();

    APIResponse res = authed.post(p("/conversations"), RequestOptions.create()
      .setData(Map.of("targetUserId", targetUserId)));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status() + ": " + res.text());
    assertFalse(parseJson(res).path("id").isMissingNode(), "conversation.id missing");
  }

  @Test
  void createConversationWithoutTokenReturns401() {
    assertEquals(401, request.post(p("/conversations"), RequestOptions.create()
      .setData(Map.of("targetUserId", "some-id"))).status());
  }

  @Test
  void createConversationWithMissingBodyReturns400() {
    APIResponse res = authed.post(p("/conversations"), RequestOptions.create()
      .setData(Map.of()));
    assertTrue(res.status() >= 400, "Expected 4xx for missing targetUserId");
  }

  // ── GET /conversations/:id/messages ──────────────────────────────────────

  @Test
  void listMessagesReturnsPaginatedResponse() {
    JsonNode list = parseJson(authed.get(p("/conversations")));
    if (!list.isArray() || list.isEmpty()) return;

    String convId = list.get(0).path("id").asText();

    APIResponse res = authed.get(p("/conversations/" + convId + "/messages?limit=20"));
    assertTrue(res.ok(), "Expected 2xx but got " + res.status());

    JsonNode json = parseJson(res);
    assertFalse(json.path("items").isMissingNode(),   "Response should have 'items'");
    assertFalse(json.path("hasMore").isMissingNode(), "Response should have 'hasMore'");
  }

  @Test
  void listMessagesWithoutTokenReturns401() {
    assertEquals(401, request.get(p("/conversations/some-id/messages")).status());
  }

  @Test
  void listMessagesForNonExistentConversationReturns4xx() {
    APIResponse res = authed.get(p("/conversations/00000000-0000-0000-0000-000000000000/messages"));
    assertTrue(res.status() == 403 || res.status() == 404,
      "Expected 403/404 for non-existent conversation, got " + res.status());
  }

  // ── POST /conversations/:id/messages ─────────────────────────────────────

  @Test
  void sendTextMessageReturnsCreatedMessage() {
    JsonNode list = parseJson(authed.get(p("/conversations")));
    if (!list.isArray() || list.isEmpty()) return;

    String convId = list.get(0).path("id").asText();

    APIResponse res = authed.post(p("/conversations/" + convId + "/messages"),
      RequestOptions.create().setData(Map.of("textContent", "Hello from E2E test")));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status() + ": " + res.text());
    JsonNode msg = parseJson(res);
    assertFalse(msg.path("id").isMissingNode(),          "message.id missing");
    assertFalse(msg.path("textContent").isMissingNode(), "message.textContent missing");
    assertFalse(msg.path("createdAt").isMissingNode(),   "message.createdAt missing");
  }

  @Test
  void sendMessageWithoutTokenReturns401() {
    assertEquals(401, request.post(p("/conversations/some-id/messages"),
      RequestOptions.create().setData(Map.of("textContent", "hi"))).status());
  }

  @Test
  void sendMessageToNonExistentConversationReturns4xx() {
    APIResponse res = authed.post(p("/conversations/00000000-0000-0000-0000-000000000000/messages"),
      RequestOptions.create().setData(Map.of("textContent", "hi")));
    assertTrue(res.status() == 403 || res.status() == 404,
      "Expected 403/404 for non-existent conversation, got " + res.status());
  }

  // ── GET /conversations/:id/pins ───────────────────────────────────────────

  @Test
  void listPinsReturnsJsonArray() {
    JsonNode list = parseJson(authed.get(p("/conversations")));
    if (!list.isArray() || list.isEmpty()) return;

    String convId = list.get(0).path("id").asText();

    APIResponse res = authed.get(p("/conversations/" + convId + "/pins"));
    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray(), "Pins response should be an array");
  }
}
