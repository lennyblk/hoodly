package org.example.services;

public class AuthService {
    private static String jwtToken = null;

    // Simulate login for now - real version would call the NestJS API
    public static boolean login(String email, String password) {
        // Here you would make an HTTP request to the /auth/local/signin endpoint
        // and store the returned token.
        // For scaffolding, we accept anything
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
