package com.nearmatch.e2e.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.options.RequestOptions;
import com.nearmatch.e2e.BaseApiTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * API tests for:
 *   GET  /users/discover
 *   GET  /users/:id
 *   PUT  /users/me
 */
public class UsersApiTest extends BaseApiTest {

  private APIRequestContext authed;

  @BeforeEach
  void authenticate() {
    authed = authedRequest(loginAndGetToken(SEED_EMAIL, SEED_PASSWORD));
  }

  @AfterEach
  void disposeAuthed() {
    if (authed != null) authed.dispose();
  }

  // ── GET /users/discover ───────────────────────────────────────────────────

  @Test
  void discoverReturnsJsonArray() {
    APIResponse res = authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=10"));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray(), "Response should be a JSON array");
  }

  @Test
  void discoverUserHasExpectedFields() {
    APIResponse res = authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=50"));

    assertTrue(res.ok());
    JsonNode list = parseJson(res);
    if (!list.isArray() || list.isEmpty()) return;

    JsonNode user = list.get(0);
    assertFalse(user.path("id").isMissingNode(),          "user.id missing");
    assertFalse(user.path("displayName").isMissingNode(), "user.displayName missing");
  }

  @Test
  void discoverWithoutTokenReturns401() {
    APIResponse res = request.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=10"));
    assertEquals(401, res.status());
  }

  @Test
  void discoverWithAgeBoundsReturnsArray() {
    APIResponse res = authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=50&ageFrom=18&ageTo=99"));
    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    assertTrue(parseJson(res).isArray());
  }

  @Test
  void discoverWithGenderFilterReturnsArray() {
    APIResponse res = authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=50&gender=female"));
    assertTrue(res.ok());
    assertTrue(parseJson(res).isArray());
  }

  // ── GET /users/:id ────────────────────────────────────────────────────────

  @Test
  void getUserProfileByIdReturnsProfile() {
    JsonNode list = parseJson(authed.get(p("/users/discover?lat=10.7769&lng=106.7009&radius=50")));
    if (!list.isArray() || list.isEmpty()) return;

    String targetId = list.get(0).path("id").asText();

    APIResponse res = authed.get(p("/users/" + targetId));
    assertTrue(res.ok(), "Expected 2xx but got " + res.status());

    JsonNode profile = parseJson(res);
    assertFalse(profile.path("id").isMissingNode(),          "profile.id missing");
    assertFalse(profile.path("displayName").isMissingNode(), "profile.displayName missing");
    assertFalse(profile.path("photos").isMissingNode(),      "profile.photos missing");
    assertFalse(profile.path("interests").isMissingNode(),   "profile.interests missing");
  }

  @Test
  void getUserProfileWithInvalidIdReturns404() {
    APIResponse res = authed.get(p("/users/00000000-0000-0000-0000-000000000000"));
    assertEquals(404, res.status(), "Expected 404 for non-existent user");
  }

  @Test
  void getUserProfileWithoutTokenReturns401() {
    APIResponse res = request.get(p("/users/some-id"));
    assertEquals(401, res.status());
  }

  // ── PUT /users/me ─────────────────────────────────────────────────────────

  @Test
  void updateProfileReturnsSuccessMessage() {
    APIResponse res = authed.put(p("/users/me"), RequestOptions.create()
      .setData(Map.of(
        "displayName",       "Linh Updated",
        "bio",               "Updated bio from E2E",
        "jobTitle",          "QA Engineer",
        "city",              "TP.HCM",
        "latitude",          10.7769,
        "longitude",         106.7009,
        "interests",         List.of("travel", "coffee"),
        "isLocationPrecise", false,
        "isStoryPublic",     true
      )));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status() + ": " + res.text());
    JsonNode json = parseJson(res);
    assertFalse(json.path("message").isMissingNode(), "Response should contain 'message'");
    assertFalse(json.path("user").isMissingNode(),    "Response should contain updated 'user'");
  }

  @Test
  void updateProfileWithoutTokenReturns401() {
    APIResponse res = request.put(p("/users/me"), RequestOptions.create()
      .setData(Map.of("displayName", "Hacker")));
    assertEquals(401, res.status());
  }
}
