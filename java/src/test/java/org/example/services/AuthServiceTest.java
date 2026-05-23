package org.example.services;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthServiceTest {

    @AfterEach
    public void teardown() {
        AuthService.logout();
    }

    // @Test
    // public void testLoginAndAuthentication() {
    //     assertFalse(AuthService.isAuthenticated());
    //
    //     String loginResult = AuthService.login("test@test.com", "password");
    //
    //     assertNull(loginResult);
    //     assertTrue(AuthService.isAuthenticated());
    //     assertNotNull(AuthService.getJwtToken());
    // }
    //
    // @Test
    // public void testLogout() {
    //     AuthService.login("test@test.com", "password");
    //     assertTrue(AuthService.isAuthenticated());
    //
    //     AuthService.logout();
    //
    //     assertFalse(AuthService.isAuthenticated());
    //     assertNull(AuthService.getJwtToken());
    // }
}