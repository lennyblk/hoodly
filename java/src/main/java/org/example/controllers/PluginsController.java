package org.example.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import org.example.Main;
import org.example.models.Incident;
import org.example.services.IncidentRepository;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class PluginsController {

    @FXML private Label statusLabel;

    // ─── Export statistiques ──────────────────────────────────────────────────

    @FXML
    private void handleExportStats() {
        try {
            IncidentRepository repo = new IncidentRepository();
            List<Incident> incidents = repo.getAllIncidents();

            String filename = "stats_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

            try (PrintWriter w = new PrintWriter(new FileWriter(filename))) {
                w.println("Statut,Nombre");
                incidents.stream()
                        .collect(Collectors.groupingBy(i -> i.getStatus() != null ? i.getStatus() : "inconnu", Collectors.counting()))
                        .forEach((s, n) -> w.println(s + "," + n));

                w.println();
                w.println("Catégorie,Nombre");
                incidents.stream()
                        .collect(Collectors.groupingBy(i -> i.getCategory() != null ? i.getCategory() : "non classé", Collectors.counting()))
                        .forEach((c, n) -> w.println(c + "," + n));

                w.println();
                w.println("ID,Titre,Catégorie,Statut,Signalé par,Date");
                for (Incident inc : incidents) {
                    w.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                            safe(inc.getId()), safe(inc.getTitle()), safe(inc.getCategory()),
                            safe(inc.getStatus()), safe(inc.getReportedBy()), safe(inc.getReportedAt()));
                }
            }

            statusLabel.setStyle("-fx-text-fill: green;");
            statusLabel.setText("Export généré : " + filename);
        } catch (Exception e) {
            statusLabel.setStyle("-fx-text-fill: red;");
            statusLabel.setText("Erreur export : " + e.getMessage());
        }
    }

    // ─── Analyse sociale ──────────────────────────────────────────────────────

    @FXML
    private void handleSocialAnalysis() {
        javafx.scene.control.TextInputDialog dialog = new javafx.scene.control.TextInputDialog();
        dialog.setTitle("Analyse sociale");
        dialog.setHeaderText("Exporter les signalements d'un utilisateur");
        dialog.setContentText("ID utilisateur :");

        java.util.Optional<String> opt = dialog.showAndWait();
        if (opt.isEmpty() || opt.get().isBlank()) {
            statusLabel.setStyle("-fx-text-fill: orange;");
            statusLabel.setText("Analyse annulée.");
            return;
        }

        String targetUser = opt.get().trim();

        try {
            IncidentRepository repo = new IncidentRepository();
            List<Incident> userIncidents = repo.getAllIncidents().stream()
                    .filter(i -> targetUser.equalsIgnoreCase(i.getReportedBy()))
                    .collect(Collectors.toList());

            if (userIncidents.isEmpty()) {
                statusLabel.setStyle("-fx-text-fill: orange;");
                statusLabel.setText("Aucun incident trouvé pour l'utilisateur : " + targetUser);
                return;
            }

            String filename = "social_" + targetUser.replaceAll("[^a-zA-Z0-9]", "_") + "_"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

            try (PrintWriter w = new PrintWriter(new FileWriter(filename))) {
                w.println("# Analyse sociale — Utilisateur : " + targetUser);
                w.println("# Total signalements : " + userIncidents.size());
                long resolved = userIncidents.stream().filter(i -> "resolved".equalsIgnoreCase(i.getStatus())).count();
                w.println("# Résolus : " + resolved + " | Ouverts : " + (userIncidents.size() - resolved));
                w.println();
                w.println("ID,Titre,Catégorie,Statut,Quartier,Date signalement,Synchronisé");
                for (Incident inc : userIncidents) {
                    w.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                            safe(inc.getId()), safe(inc.getTitle()), safe(inc.getCategory()),
                            safe(inc.getStatus()), safe(inc.getNeighborhoodId()),
                            safe(inc.getReportedAt()), inc.getIsDirty() == 0 ? "oui" : "non");
                }
            }

            statusLabel.setStyle("-fx-text-fill: green;");
            statusLabel.setText("Export généré : " + filename + " (" + userIncidents.size() + " signalement(s))");
        } catch (Exception e) {
            statusLabel.setStyle("-fx-text-fill: red;");
            statusLabel.setText("Erreur analyse : " + e.getMessage());
        }
    }

    // ─── Calendrier local ─────────────────────────────────────────────────────

    @FXML
    private void handleLocalCalendar() {
        try {
            IncidentRepository repo = new IncidentRepository();
            List<Incident> incidents = repo.getAllIncidents();

            DateTimeFormatter display = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            java.time.ZoneId zone = java.time.ZoneId.systemDefault();

            // Group all incidents by day, keep the list (not just count)
            Map<LocalDate, List<Incident>> byDay = incidents.stream()
                    .filter(i -> i.getReportedAt() != null)
                    .collect(Collectors.groupingBy(i -> {
                        try {
                            return java.time.Instant.parse(i.getReportedAt()).atZone(zone).toLocalDate();
                        } catch (Exception e) {
                            return LocalDate.EPOCH;
                        }
                    }));

            byDay.remove(LocalDate.EPOCH);

            if (byDay.isEmpty()) {
                statusLabel.setStyle("-fx-text-fill: orange;");
                statusLabel.setText("Aucune date d'incident exploitable.");
                return;
            }

            String filename = "calendrier_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

            try (PrintWriter w = new PrintWriter(new FileWriter(filename))) {
                w.println("# Calendrier local des incidents");
                w.println("# Généré le : " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                w.println("# Total jours : " + byDay.size() + " | Total incidents : " + incidents.size());
                w.println();
                w.println("Date,Nombre,ID,Titre,Catégorie,Statut");

                byDay.entrySet().stream()
                        .filter(e -> !e.getKey().equals(LocalDate.EPOCH))
                        .sorted(Map.Entry.comparingByKey())
                        .forEach(e -> {
                            String date = e.getKey().format(display);
                            for (Incident inc : e.getValue()) {
                                w.printf("\"%s\",%d,\"%s\",\"%s\",\"%s\",\"%s\"%n",
                                        date, e.getValue().size(),
                                        safe(inc.getId()), safe(inc.getTitle()),
                                        safe(inc.getCategory()), safe(inc.getStatus()));
                            }
                        });
            }

            statusLabel.setStyle("-fx-text-fill: green;");
            statusLabel.setText("Calendrier exporté : " + filename);
        } catch (Exception e) {
            statusLabel.setStyle("-fx-text-fill: red;");
            statusLabel.setText("Erreur calendrier : " + e.getMessage());
        }
    }

    // ─── Navigation ───────────────────────────────────────────────────────────

    @FXML
    private void goBack() {
        try {
            Main.setRoot("views/dashboard.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleToggleTheme() {
        Main.toggleTheme();
    }

    private String safe(String v) { return v != null ? v : ""; }
}
