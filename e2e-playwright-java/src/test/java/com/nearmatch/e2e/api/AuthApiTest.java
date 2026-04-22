package com.nearmatch.e2e.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.options.RequestOptions;
import com.nearmatch.e2e.BaseApiTest;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * API tests for POST /auth/register, POST /auth/login, GET /auth/me
 */
public class AuthApiTest extends BaseApiTest {

  // ── POST /auth/login ──────────────────────────────────────────────────────

  @Test
  void loginWithValidCredentialsReturns2xxAndToken() {
    APIResponse res = request.post(p("/auth/login"), RequestOptions.create()
      .setData(Map.of("email", SEED_EMAIL, "password", SEED_PASSWORD)));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    JsonNode json = parseJson(res);
    assertFalse(json.path("accessToken").isMissingNode(), "accessToken must be present");
    assertFalse(json.path("user").isMissingNode(),        "user object must be present");
  }

  @Test
  void loginReturnsUserWithExpectedFields() {
    APIResponse res = request.post(p("/auth/login"), RequestOptions.create()
      .setData(Map.of("email", SEED_EMAIL, "password", SEED_PASSWORD)));

    assertTrue(res.ok());
    JsonNode user = parseJson(res).path("user");
    assertFalse(user.isMissingNode(),                    "user object missing");
    assertFalse(user.path("id").isMissingNode(),          "user.id missing");
    assertFalse(user.path("email").isMissingNode(),       "user.email missing");
    assertFalse(user.path("displayName").isMissingNode(), "user.displayName missing");
  }

  @Test
  void loginWithWrongPasswordReturns401() {
    APIResponse res = request.post(p("/auth/login"), RequestOptions.create()
      .setData(Map.of("email", SEED_EMAIL, "password", "WrongPass999!")));

    assertEquals(401, res.status(), "Expected 401 for wrong password");
  }

  @Test
  void loginWithUnknownEmailReturns401() {
    APIResponse res = request.post(p("/auth/login"), RequestOptions.create()
      .setData(Map.of("email", "nobody@nowhere.com", "password", "Password123!")));

    assertEquals(401, res.status(), "Expected 401 for unknown email");
  }

  @Test
  void loginWithMissingBodyReturns400() {
    APIResponse res = request.post(p("/auth/login"), RequestOptions.create()
      .setData(Map.of()));

    assertTrue(res.status() >= 400, "Expected 4xx for empty body, got " + res.status());
  }

  // ── POST /auth/register ───────────────────────────────────────────────────

  @Test
  void registerWithValidDataReturns2xxAndToken() {
    String uniqueEmail = "e2e_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

    APIResponse res = request.post(p("/auth/register"), RequestOptions.create()
      .setData(Map.of(
        "email",        uniqueEmail,
        "password",     "Password123!",
        "displayName",  "E2E User",
        "birthDate",    "1995-06-15",
        "gender",       "female",
        "interestedIn", "everyone"
      )));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status() + ": " + res.text());
    JsonNode json = parseJson(res);
    assertFalse(json.path("accessToken").isMissingNode(), "accessToken must be present after register");
  }

  @Test
  void registerWithDuplicateEmailReturns409Or400() {
    APIResponse res = request.post(p("/auth/register"), RequestOptions.create()
      .setData(Map.of(
        "email",        SEED_EMAIL,
        "password",     "Password123!",
        "displayName",  "Duplicate",
        "birthDate",    "1995-06-15",
        "gender",       "female",
        "interestedIn", "everyone"
      )));

    assertTrue(res.status() == 409 || res.status() == 400,
      "Expected 409/400 for duplicate email, got " + res.status());
  }

  @Test
  void registerWithMissingRequiredFieldsReturns400() {
    APIResponse res = request.post(p("/auth/register"), RequestOptions.create()
      .setData(Map.of("email", "incomplete@test.com")));

    assertEquals(400, res.status(), "Expected 400 for missing required fields");
  }

  // ── GET /auth/me ──────────────────────────────────────────────────────────

  @Test
  void getMeWithValidTokenReturnsCurrentUser() {
    String token = loginAndGetToken(SEED_EMAIL, SEED_PASSWORD);
    APIRequestContext authed = authedRequest(token);

    APIResponse res = authed.get(p("/auth/me"));

    assertTrue(res.ok(), "Expected 2xx but got " + res.status());
    JsonNode json = parseJson(res);
    assertFalse(json.path("id").isMissingNode(),          "me.id missing");
    assertFalse(json.path("email").isMissingNode(),       "me.email missing");
    assertFalse(json.path("displayName").isMissingNode(), "me.displayName missing");

    authed.dispose();
  }

  @Test
  void getMeWithoutTokenReturns401() {
    APIResponse res = request.get(p("/auth/me"));
    assertEquals(401, res.status(), "Expected 401 without token");
  }

  @Test
  void getMeWithInvalidTokenReturns401() {
    APIRequestContext authed = authedRequest("invalid.token.here");
    APIResponse res = authed.get(p("/auth/me"));
    assertEquals(401, res.status(), "Expected 401 for invalid token");
    authed.dispose();
  }
}
