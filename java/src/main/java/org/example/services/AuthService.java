package org.example.services;

import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;

public class AuthService {

    private static final String API_URL = "http://localhost:3000";
    private static final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(java.net.http.HttpClient.Version.HTTP_1_1)
            .build();

    private static String accessToken = null;
    private static String refreshToken = null;
    private static String userId = null;
    private static String userRole = null;
    private static String userEmail = null;

    public static String login(String email, String password) {
        try {
            JSONObject body = new JSONObject();
            body.put("email", email);
            body.put("password", password);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + "/auth/signin"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            System.out.println("DEBUG signin status=" + resp.statusCode() + " body=" + resp.body());
            JSONObject json = new JSONObject(resp.body());

            if (resp.statusCode() == 200 || resp.statusCode() == 201) {
                if (json.has("otpToken")) {
                    return "OTP_REQUIRED:" + json.getString("otpToken");
                }
                storeTokens(json);
                return null;
            } else {
                String msg = json.optString("message", "Identifiants invalides");
                return "ERROR:" + msg;
            }
        } catch (Exception e) {
            return "ERROR:Impossible de joindre le serveur : " + e.getMessage();
        }
    }

    public static String verifyOtp(String otpToken, String otpCode) {
        try {
            JSONObject body = new JSONObject();
            body.put("otp", otpCode);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + "/auth/otp/verify"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + otpToken)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            JSONObject json = new JSONObject(resp.body());

            if (resp.statusCode() == 200 || resp.statusCode() == 201) {
                storeTokens(json);
                return null;
            } else {
                String msg = json.optString("message", "Code OTP invalide");
                return "ERROR:" + msg;
            }
        } catch (Exception e) {
            return "ERROR:Erreur vérification OTP : " + e.getMessage();
        }
    }

    public static boolean refreshAccessToken() {
        if (refreshToken == null) return false;
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + "/auth/refresh"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + refreshToken)
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200 || resp.statusCode() == 201) {
                JSONObject json = new JSONObject(resp.body());
                storeTokens(json);
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    public static String getJwtToken() { return accessToken; }
    public static boolean isAuthenticated() { return accessToken != null && !accessToken.isEmpty(); }
    public static String getUserId() { return userId; }
    public static String getUserRole() { return userRole; }
    public static String getUserEmail() { return userEmail; }

    public static void logout() {
        accessToken = null;
        refreshToken = null;
        userId = null;
        userRole = null;
        userEmail = null;
    }

    private static void storeTokens(JSONObject json) {
        accessToken = json.optString("access_token",
                      json.optString("accessToken", null));
        refreshToken = json.optString("refresh_token",
                       json.optString("refreshToken", null));

        if (json.has("user")) {
            JSONObject user = json.getJSONObject("user");
            userId = user.optString("_id", user.optString("id", null));
            userRole = user.optString("role", null);
            userEmail = user.optString("email", null);
        }

        if ((userId == null || userEmail == null) && accessToken != null) {
            decodeJwtPayload(accessToken);
        }
    }

    private static void decodeJwtPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return;
            String payload = parts[1];
            int mod = payload.length() % 4;
            if (mod != 0) payload += "=".repeat(4 - mod);
            String decoded = new String(Base64.getUrlDecoder().decode(payload));
            JSONObject claims = new JSONObject(decoded);
            System.out.println("DEBUG JWT payload: " + decoded);
            if (userId == null) userId = claims.optString("userId", null);
            if (userEmail == null) userEmail = claims.optString("email", null);
        } catch (Exception e) {
            System.err.println("JWT decode failed: " + e.getMessage());
        }
    }
}
