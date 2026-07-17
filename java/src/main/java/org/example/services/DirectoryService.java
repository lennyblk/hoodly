package org.example.services;

import org.example.config.ApiConfig;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class DirectoryService {

    private static final String API_BASE = ApiConfig.API_BASE;

    private static final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    private static final Map<String, String> userNames = new ConcurrentHashMap<>();
    private static final Map<String, String> neighbourhoodNames = new ConcurrentHashMap<>();
    private static volatile boolean neighbourhoodsLoaded = false;

    public static String resolveUserName(String userId) {
        if (userId == null || userId.isBlank() || "offline-user".equals(userId)) {
            return "Utilisateur local";
        }
        String cached = userNames.get(userId);
        if (cached != null) return cached;
        try {
            JSONObject obj = new JSONObject(get("/users/" + userId));
            String full = (obj.optString("firstName", "") + " " + obj.optString("lastName", "")).trim();
            if (full.isEmpty()) return userId;
            userNames.put(userId, full);
            return full;
        } catch (Exception e) {
            return userId;
        }
    }

    public static String resolveNeighbourhoodName(String neighbourhoodId) {
        if (neighbourhoodId == null || neighbourhoodId.isBlank()) return "—";
        switch (neighbourhoodId) {
            case "local":
                return "Local (hors ligne)";
            case "hoodly":
                return "Hoodly (direct admins)";
            case "unknown":
            case "FAKE-NEIGHBORHOOD-ID":
                return "—";
            default:
                loadNeighbourhoodsOnce();
                return neighbourhoodNames.getOrDefault(neighbourhoodId, neighbourhoodId);
        }
    }

    private static synchronized void loadNeighbourhoodsOnce() {
        if (neighbourhoodsLoaded) return;
        try {
            JSONArray arr = new JSONArray(get("/neighbourhoods"));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject n = arr.getJSONObject(i);
                String id = n.optString("id", n.optString("_id", ""));
                if (!id.isEmpty()) neighbourhoodNames.put(id, n.optString("name", id));
            }
            neighbourhoodsLoaded = true;
        } catch (Exception ignored) {
            // API indisponible : on retentera au prochain appel
        }
    }

    private static String get(String path) throws Exception {
        HttpResponse<String> res = send(path, AuthService.getJwtToken());
        if (res.statusCode() == 401 && AuthService.refreshAccessToken()) {
            res = send(path, AuthService.getJwtToken());
        }
        if (res.statusCode() != 200) throw new Exception("HTTP " + res.statusCode());
        return res.body();
    }

    private static HttpResponse<String> send(String path, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + path))
                .GET();
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
}
