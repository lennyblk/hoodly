package org.example.services;

import org.example.models.Incident;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;

public class SyncService {

    private static final String API_URL = "http://localhost:3000/incidents";
    private static final HttpClient client = HttpClient.newHttpClient();

    public static void sync() throws Exception {
        IncidentRepository repo = new IncidentRepository();

        // 1. PUSH : Envoi des incidents locaux non synchronisés vers le serveur API
        List<Incident> unsynced = repo.getUnsyncedIncidents();
        
        for (Incident inc : unsynced) {
            JSONObject payload = new JSONObject();
            payload.put("id", inc.getId());
            payload.put("title", inc.getTitle());
            payload.put("description", inc.getDescription());
            payload.put("category", inc.getCategory());
            payload.put("status", inc.getStatus());
            payload.put("reportedBy", inc.getReportedBy()); 
            payload.put("neighborhoodId", inc.getNeighborhoodId());
            payload.put("reportedAt", inc.getReportedAt());

            HttpRequest postReq = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    // .header("Authorization", "Bearer " + AuthService.getJwtToken()) // Disabled as requested
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();

            HttpResponse<String> response = client.send(postReq, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201 || response.statusCode() == 200 || response.statusCode() == 409) { // 409 if already exists
                // Mettre à jour l'état local comme "Synchronisé" (is_dirty = 0)
                String syncedTime = Instant.now().toString();
                repo.markAsSynced(inc.getId(), syncedTime);
            } else {
                throw new Exception("Erreur Push incident " + inc.getId() + " - Code: " + response.statusCode());
            }
        }

        // 2. PULL : Récupération des incidents du serveur pour mettre à jour la base locale
        HttpRequest getReq = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                // .header("Authorization", "Bearer " + AuthService.getJwtToken())
                .GET()
                .build();

        HttpResponse<String> getResponse = client.send(getReq, HttpResponse.BodyHandlers.ofString());

        if (getResponse.statusCode() == 200) {
            JSONArray arr = new JSONArray(getResponse.body());
            
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                
                // Sauvegarder dans la DB locale
                Incident remoteInc = new Incident(
                        obj.optString("id"),
                        obj.optString("title"),
                        obj.optString("description", ""),
                        obj.optString("category"),
                        obj.optString("status"),
                        obj.optString("reportedBy"),
                        obj.optString("neighborhoodId"),
                        obj.optString("reportedAt"),
                        obj.optString("syncedAt", Instant.now().toString()),
                        0 // Directement du serveur = propre
                );
                
                repo.insertOrUpdateIncident(remoteInc);
            }
        } else {
            throw new Exception("Erreur Pull Data - Code: " + getResponse.statusCode());
        }
    }
}
