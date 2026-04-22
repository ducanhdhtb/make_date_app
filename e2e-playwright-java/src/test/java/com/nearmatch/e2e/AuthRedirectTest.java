package com.nearmatch.e2e;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AuthRedirectTest extends BaseE2ETest {
  @Test
  void discoverRedirectsToLoginWhenNotAuthenticated() {
    page.navigate("/discover");
    page.waitForURL("**/auth/login");
    assertTrue(page.url().contains("/auth/login"));
  }
}

