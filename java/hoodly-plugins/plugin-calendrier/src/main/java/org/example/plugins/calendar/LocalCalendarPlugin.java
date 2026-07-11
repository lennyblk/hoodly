package org.example.plugins.calendar;

import org.example.plugin.api.IncidentRecord;
import org.example.plugin.api.Plugin;
import org.example.plugin.api.PluginContext;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class LocalCalendarPlugin implements Plugin {

    @Override
    public String getName() {
        return "Calendrier local";
    }

    @Override
    public String getDescription() {
        return "Exporte la répartition des incidents jour par jour dans un fichier CSV.";
    }

    @Override
    public String execute(PluginContext context) throws Exception {
        List<IncidentRecord> incidents = context.getIncidents();

        DateTimeFormatter display = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        ZoneId zone = ZoneId.systemDefault();

        Map<LocalDate, List<IncidentRecord>> byDay = incidents.stream()
                .filter(i -> i.reportedAt() != null)
                .collect(Collectors.groupingBy(i -> {
                    try {
                        return Instant.parse(i.reportedAt()).atZone(zone).toLocalDate();
                    } catch (Exception e) {
                        return LocalDate.EPOCH;
                    }
                }));

        byDay.remove(LocalDate.EPOCH);

        if (byDay.isEmpty()) {
            return "Aucune date d'incident exploitable.";
        }

        String filename = "calendrier_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

        try (PrintWriter w = new PrintWriter(new FileWriter(filename))) {
            w.println("# Calendrier local des incidents");
            w.println("# Généré le : " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            w.println("# Total jours : " + byDay.size() + " | Total incidents : " + incidents.size());
            w.println();
            w.println("Date,Nombre,ID,Titre,Catégorie,Statut");

            byDay.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(e -> {
                        String date = e.getKey().format(display);
                        for (IncidentRecord inc : e.getValue()) {
                            w.printf("\"%s\",%d,\"%s\",\"%s\",\"%s\",\"%s\"%n",
                                    date, e.getValue().size(),
                                    safe(inc.id()), safe(inc.title()),
                                    safe(inc.category()), safe(inc.status()));
                        }
                    });
        }

        return "Calendrier exporté : " + filename;
    }

    private String safe(String v) { return v != null ? v : ""; }
}
