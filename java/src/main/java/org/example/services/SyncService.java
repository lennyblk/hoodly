package org.example.services;

import org.example.models.Incident;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

public class SyncService {

    private static final String API_BASE = "http://localhost:3000";
    private static final String INCIDENTS_URL = API_BASE + "/incidents";

    private static final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    public static void sync() throws Exception {
        IncidentRepository repo = new IncidentRepository();
        String token = AuthService.getJwtToken();

        pushLocalIncidents(repo, token);
        pullRemoteIncidents(repo, token);
    }

    private static void pushLocalIncidents(IncidentRepository repo, String token) throws Exception {
        List<Incident> unsynced = repo.getUnsyncedIncidents();
        String authenticatedUserId = AuthService.getUserId();

        for (Incident inc : unsynced) {
            String reportedBy = isValidMongoId(inc.getReportedBy())
                    ? inc.getReportedBy()
                    : (authenticatedUserId != null ? authenticatedUserId : inc.getReportedBy());

            String neighborhoodId = isPlaceholder(inc.getNeighborhoodId())
                    ? "unknown"
                    : inc.getNeighborhoodId();

            JSONObject payload = new JSONObject();
            payload.put("id", inc.getId());
            payload.put("title", inc.getTitle());
            payload.put("description", inc.getDescription() != null ? inc.getDescription() : "");
            payload.put("category", inc.getCategory());
            payload.put("status", inc.getStatus());
            payload.put("reportedBy", reportedBy);
            payload.put("neighborhoodId", neighborhoodId);
            payload.put("reportedAt", inc.getReportedAt());

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(INCIDENTS_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()));

            if (token != null) {
                reqBuilder.header("Authorization", "Bearer " + token);
            }

            HttpResponse<String> response = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201 || response.statusCode() == 200 || response.statusCode() == 409) {
                repo.markAsSynced(inc.getId(), Instant.now().toString());
            } else if (response.statusCode() == 401) {
                if (AuthService.refreshAccessToken()) {
                    token = AuthService.getJwtToken();
                } else {
                    throw new Exception("Session expirée. Veuillez vous reconnecter.");
                }
            } else {
                throw new Exception("Erreur push incident " + inc.getId() + " — Code: " + response.statusCode());
            }
        }
    }

    private static void pullRemoteIncidents(IncidentRepository repo, String token) throws Exception {
        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(URI.create(INCIDENTS_URL))
                .GET();

        if (token != null) {
            reqBuilder.header("Authorization", "Bearer " + token);
        }

        HttpResponse<String> response = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 401) {
            if (AuthService.refreshAccessToken()) {
                pullRemoteIncidents(repo, AuthService.getJwtToken());
                return;
            }
            throw new Exception("Session expirée. Veuillez vous reconnecter.");
        }

        if (response.statusCode() != 200) {
            throw new Exception("Erreur pull données — Code: " + response.statusCode());
        }

        JSONArray arr = new JSONArray(response.body());
        List<Incident> localAll = repo.getAllIncidents();

        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj = arr.getJSONObject(i);
            String remoteId = obj.optString("id", obj.optString("_id", ""));
            String remoteReportedAt = obj.optString("reportedAt", Instant.now().toString());

            Incident remoteInc = new Incident(
                    remoteId,
                    obj.optString("title"),
                    obj.optString("description", ""),
                    obj.optString("category"),
                    obj.optString("status"),
                    obj.optString("reportedBy"),
                    obj.optString("neighborhoodId"),
                    remoteReportedAt,
                    obj.optString("syncedAt", Instant.now().toString()),
                    0
            );


            Incident local = findById(localAll, remoteId);
            if (local != null && local.getIsDirty() == 1) {
                boolean localIsNewer = isNewerOrEqual(local.getReportedAt(), remoteReportedAt);
                if (localIsNewer) {
                    continue;
                }
                remoteInc.setIsDirty(0);
            }

            repo.insertOrUpdateIncident(remoteInc);
        }
    }

    static Incident findById(List<Incident> list, String id) {
        for (Incident inc : list) {
            if (id.equals(inc.getId())) return inc;
        }
        return null;
    }

    static boolean isNewerOrEqual(String a, String b) {
        if (a == null) return false;
        if (b == null) return true;
        try {
            return !Instant.parse(a).isBefore(Instant.parse(b));
        } catch (Exception e) {
            return a.compareTo(b) >= 0;
        }
    }

    static boolean isValidMongoId(String id) {
        return id != null && id.matches("[0-9a-fA-F]{24}");
    }

    static boolean isPlaceholder(String value) {
        return value == null || value.isBlank()
                || value.equals("local")
                || value.equals("FAKE-NEIGHBORHOOD-ID")
                || value.equals("unknown");
    }
}
