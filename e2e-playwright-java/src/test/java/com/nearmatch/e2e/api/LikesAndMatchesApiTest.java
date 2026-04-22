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
 *   POST /likes
 *   GET  /matches
 */
public class LikesAndMatchesApiTest extends BaseApiTest {

  private APIRequestContext authed;

  @BeforeEach
  void authenticate() {
    authed = authedRequest(loginAndGetToken(SEED_EMAIL, SEED_PASSWORD));
  }

  @AfterEach
  void disposeAuthed() {
    if (authed != null) authed.dispose();
  }

  // ── POST /likes ───────────────────────────────────────────────────────────

  @Test
  void likeADiscoveredUserReturns2xxOr409() {
    JsonNode list = parseJson(authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=50")));
    if (!list.isArray() || list.isEmpty()) return;

    String targetId = list.get(0).path("id").asText();

    APIResponse res = authed.post(p("/likes"), RequestOptions.create()
      .setData(Map.of("targetUserId", targetId)));

    // 201 new like, 200 match, or 409 already liked — all are valid outcomes
    assertTrue(res.ok() || res.status() == 409,
      "Expected 2xx or 409 but got " + res.status() + ": " + res.text());
  }

  @Test
  void likeResponseContainsMatchedFieldOrAlreadyLiked() {
    JsonNode list = parseJson(authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=50")));
    if (!list.isArray() || list.isEmpty()) return;

    String targetId = list.get(0).path("id").asText();

    APIResponse res = authed.post(p("/likes"), RequestOptions.create()
      .setData(Map.of("targetUserId", targetId)));

    if (res.status() == 409) return; // already liked — skip field check

    assertTrue(res.ok());
    JsonNode json = parseJson(res);
    assertFalse(json.path("matched").isMissingNode(), "Response should contain 'matched' boolean");
  }

  @Test
  void likeWithInvalidTargetIdReturns404Or400() {
    APIResponse res = authed.post(p("/likes"), RequestOptions.create()
      .setData(Map.of("targetUserId", "00000000-0000-0000-0000-000000000000")));

    assertTrue(res.status() == 404 || res.status() == 400,
      "Expected 404/400 for non-existent target, got " + res.status());
  }

  @Test
  void likeWithoutTokenReturns401() {
    APIResponse res = request.post(p("/likes"), RequestOptions.create()
      .setData(Map.of("targetUserId", "some-id")));
    assertEquals(401, res.status());
  }

  @Test
  void likeWithMissingBodyReturns400() {
    APIResponse res = authed.post(p("/likes"), RequestOptions.create()
      .setData(Map.of()));
    assertTrue(res.status() >= 400, "Expected 4xx for missing targetUserId");
  }

  // ── GET /matches ──────────────────────────────────────────────────────────

  @Test
  void getMatchesReturnsJsonArray() {
    APIResponse res = authed.get(p("/matches"));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray(), "Response should be a JSON array");
  }

  @Test
  void matchItemHasExpectedFields() {
    JsonNode list = parseJson(authed.get(p("/matches")));
    if (!list.isArray() || list.isEmpty()) return;

    JsonNode match = list.get(0);
    assertFalse(match.path("id").isMissingNode(),        "match.id missing");
    assertFalse(match.path("matchedAt").isMissingNode(), "match.matchedAt missing");
    assertFalse(match.path("user").isMissingNode(),      "match.user missing");
  }

  @Test
  void getMatchesWithoutTokenReturns401() {
    APIResponse res = request.get(p("/matches"));
    assertEquals(401, res.status());
  }
}
