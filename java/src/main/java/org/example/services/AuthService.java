package org.example.services;

public class AuthService {
    private static String jwtToken = null;

    public static boolean login(String email, String password) {
        if (email != null && !email.isEmpty() && password != null && !password.isEmpty()) {
            jwtToken = "fake-jwt-token-for-sso";
            return true;
        }
        return false;
    }

    public static String getJwtToken() {
        return jwtToken;
    }

    public static boolean isAuthenticated() {
        return jwtToken != null && !jwtToken.isEmpty();
    }

    public static void logout() {
        jwtToken = null;
    }
}
