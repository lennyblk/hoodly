package org.example.plugins.exportstats;

import org.example.plugin.api.IncidentRecord;
import org.example.plugin.api.Plugin;
import org.example.plugin.api.PluginContext;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

public class ExportStatsPlugin implements Plugin {

    @Override
    public String getName() {
        return "Export statistiques";
    }

    @Override
    public String getDescription() {
        return "Exporte les incidents (statut, catégorie, liste complète) dans un fichier CSV.";
    }

    @Override
    public String execute(PluginContext context) throws Exception {
        List<IncidentRecord> incidents = context.getIncidents();

        String filename = "stats_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

        try (PrintWriter w = new PrintWriter(new FileWriter(filename))) {
            w.println("Statut,Nombre");
            incidents.stream()
                    .collect(Collectors.groupingBy(i -> i.status() != null ? i.status() : "inconnu", Collectors.counting()))
                    .forEach((s, n) -> w.println(s + "," + n));

            w.println();
            w.println("Catégorie,Nombre");
            incidents.stream()
                    .collect(Collectors.groupingBy(i -> i.category() != null ? i.category() : "non classé", Collectors.counting()))
                    .forEach((c, n) -> w.println(c + "," + n));

            w.println();
            w.println("ID,Titre,Catégorie,Statut,Signalé par,Date");
            for (IncidentRecord inc : incidents) {
                w.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        safe(inc.id()), safe(inc.title()), safe(inc.category()),
                        safe(inc.status()), safe(inc.reportedBy()), safe(inc.reportedAt()));
            }
        }

        return "Export généré : " + filename;
    }

    private String safe(String v) { return v != null ? v : ""; }
}
