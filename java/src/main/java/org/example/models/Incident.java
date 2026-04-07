package org.example.models;

public class Incident {
    private String id;
    private String title;
    private String description;
    private String category;
    private String status;
    private String reportedBy;
    private String neighborhoodId;
    private String reportedAt;
    private String syncedAt;
    private int isDirty;

    public Incident() {
    }

    public Incident(String id, String title, String description, String category, String status,
                    String reportedBy, String neighborhoodId, String reportedAt, String syncedAt, int isDirty) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.status = status;
        this.reportedBy = reportedBy;
        this.neighborhoodId = neighborhoodId;
        this.reportedAt = reportedAt;
        this.syncedAt = syncedAt;
        this.isDirty = isDirty;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public String getNeighborhoodId() { return neighborhoodId; }
    public void setNeighborhoodId(String neighborhoodId) { this.neighborhoodId = neighborhoodId; }

    public String getReportedAt() { return reportedAt; }
    public void setReportedAt(String reportedAt) { this.reportedAt = reportedAt; }

    public String getSyncedAt() { return syncedAt; }
    public void setSyncedAt(String syncedAt) { this.syncedAt = syncedAt; }

    public int getIsDirty() { return isDirty; }
    public void setIsDirty(int isDirty) { this.isDirty = isDirty; }
}
