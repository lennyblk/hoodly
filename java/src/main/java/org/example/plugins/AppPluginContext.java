package org.example.plugins;

import org.example.models.Incident;
import org.example.plugin.api.IncidentRecord;
import org.example.plugin.api.PluginContext;
import org.example.services.IncidentRepository;

import java.util.List;
import java.util.stream.Collectors;

public class AppPluginContext implements PluginContext {

    private final IncidentRepository repository = new IncidentRepository();

    @Override
    public List<IncidentRecord> getIncidents() {
        return repository.getAllIncidents().stream()
                .map(AppPluginContext::toRecord)
                .collect(Collectors.toList());
    }

    private static IncidentRecord toRecord(Incident i) {
        return new IncidentRecord(
                i.getId(),
                i.getTitle(),
                i.getDescription(),
                i.getCategory(),
                i.getStatus(),
                i.getReportedBy(),
                i.getNeighborhoodId(),
                i.getReportedAt(),
                i.getIsDirty() == 0);
    }
}
