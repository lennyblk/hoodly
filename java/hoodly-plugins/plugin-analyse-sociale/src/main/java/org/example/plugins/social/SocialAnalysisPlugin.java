package org.example.plugins.social;

import javafx.scene.control.TextInputDialog;
import org.example.plugin.api.IncidentRecord;
import org.example.plugin.api.Plugin;
import org.example.plugin.api.PluginContext;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class SocialAnalysisPlugin implements Plugin {

    @Override
    public String getName() {
        return "Analyse sociale";
    }

    @Override
    public String getDescription() {
        return "Exporte les signalements d'un utilisateur donné dans un fichier CSV.";
    }

    @Override
    public String execute(PluginContext context) throws Exception {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Analyse sociale");
        dialog.setHeaderText("Exporter les signalements d'un utilisateur");
        dialog.setContentText("ID utilisateur :");

        Optional<String> opt = dialog.showAndWait();
        if (opt.isEmpty() || opt.get().isBlank()) {
            return "Analyse annulée.";
        }

        String targetUser = opt.get().trim();

        List<IncidentRecord> userIncidents = context.getIncidents().stream()
                .filter(i -> targetUser.equalsIgnoreCase(i.reportedBy()))
                .collect(Collectors.toList());

        if (userIncidents.isEmpty()) {
            return "Aucun incident trouvé pour l'utilisateur : " + targetUser;
        }

        String filename = "social_" + targetUser.replaceAll("[^a-zA-Z0-9]", "_") + "_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

        try (PrintWriter w = new PrintWriter(new FileWriter(filename))) {
            w.println("# Analyse sociale — Utilisateur : " + targetUser);
            w.println("# Total signalements : " + userIncidents.size());
            long resolved = userIncidents.stream().filter(i -> "resolved".equalsIgnoreCase(i.status())).count();
            w.println("# Résolus : " + resolved + " | Ouverts : " + (userIncidents.size() - resolved));
            w.println();
            w.println("ID,Titre,Catégorie,Statut,Quartier,Date signalement,Synchronisé");
            for (IncidentRecord inc : userIncidents) {
                w.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        safe(inc.id()), safe(inc.title()), safe(inc.category()),
                        safe(inc.status()), safe(inc.neighborhoodId()),
                        safe(inc.reportedAt()), inc.synced() ? "oui" : "non");
            }
        }

        return "Export généré : " + filename + " (" + userIncidents.size() + " signalement(s))";
    }

    private String safe(String v) { return v != null ? v : ""; }
}
