package org.example.plugin.api;


public record IncidentRecord(
        String id,
        String title,
        String description,
        String category,
        String status,
        String reportedBy,
        String neighborhoodId,
        String reportedAt,
        boolean synced) {
}
