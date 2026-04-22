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
 *   GET    /stories/feed
 *   POST   /stories
 *   DELETE /stories/:id
 */
public class StoriesApiTest extends BaseApiTest {

  private APIRequestContext authed;

  @BeforeEach
  void authenticate() {
    authed = authedRequest(loginAndGetToken(SEED_EMAIL, SEED_PASSWORD));
  }

  @AfterEach
  void disposeAuthed() {
    if (authed != null) authed.dispose();
  }

  // ── GET /stories/feed ─────────────────────────────────────────────────────

  @Test
  void storiesFeedReturnsJsonArray() {
    APIResponse res = authed.get(p("/stories/feed"));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray(), "Feed should be a JSON array");
  }

  @Test
  void storyItemHasExpectedFields() {
    JsonNode list = parseJson(authed.get(p("/stories/feed")));
    if (!list.isArray() || list.isEmpty()) return;

    JsonNode story = list.get(0);
    assertFalse(story.path("id").isMissingNode(),        "story.id missing");
    assertFalse(story.path("mediaType").isMissingNode(), "story.mediaType missing");
    assertFalse(story.path("createdAt").isMissingNode(), "story.createdAt missing");
    assertFalse(story.path("expiresAt").isMissingNode(), "story.expiresAt missing");
  }

  @Test
  void storiesFeedWithoutTokenReturns401() {
    assertEquals(401, request.get(p("/stories/feed")).status());
  }

  // ── POST /stories ─────────────────────────────────────────────────────────

  @Test
  void createTextStoryReturnsCreatedStory() {
    APIResponse res = authed.post(p("/stories"), RequestOptions.create()
      .setData(Map.of(
        "mediaType",   "text",
        "textContent", "E2E test story " + System.currentTimeMillis(),
        "caption",     "E2E caption"
      )));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status() + ": " + res.text());
    JsonNode json = parseJson(res);
    assertFalse(json.path("id").isMissingNode(),        "story.id missing");
    assertFalse(json.path("mediaType").isMissingNode(), "story.mediaType missing");
    assertEquals("text", json.path("mediaType").asText());
  }

  @Test
  void createStoryWithoutTokenReturns401() {
    assertEquals(401, request.post(p("/stories"), RequestOptions.create()
      .setData(Map.of("mediaType", "text", "textContent", "test"))).status());
  }

  @Test
  void createStoryWithMissingMediaTypeReturns400() {
    APIResponse res = authed.post(p("/stories"), RequestOptions.create()
      .setData(Map.of("textContent", "no media type")));
    assertTrue(res.status() >= 400, "Expected 4xx for missing mediaType");
  }

  // ── DELETE /stories/:id ───────────────────────────────────────────────────

  @Test
  void deleteOwnStoryReturns2xx() {
    APIResponse createRes = authed.post(p("/stories"), RequestOptions.create()
      .setData(Map.of(
        "mediaType",   "text",
        "textContent", "Story to delete " + System.currentTimeMillis()
      )));
    assertTrue(createRes.ok(), "Story creation failed: " + createRes.text());

    String storyId = parseJson(createRes).path("id").asText();

    APIResponse deleteRes = authed.delete(p("/stories/" + storyId));
    assertTrue(deleteRes.ok(), "Expected 2xx on delete but got " + deleteRes.status());
  }

  @Test
  void deleteNonExistentStoryReturns404() {
    APIResponse res = authed.delete(p("/stories/00000000-0000-0000-0000-000000000000"));
    assertEquals(404, res.status(), "Expected 404 for non-existent story");
  }

  @Test
  void deleteStoryWithoutTokenReturns401() {
    assertEquals(401, request.delete(p("/stories/some-id")).status());
  }
}
