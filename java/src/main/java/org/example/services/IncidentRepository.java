package org.example.services;

import org.example.models.Incident;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class IncidentRepository {

    public List<Incident> getAllIncidents() {
        List<Incident> incidents = new ArrayList<>();
        String query = "SELECT * FROM incidents ORDER BY reported_at DESC";

        try (Connection conn = DatabaseService.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            while (rs.next()) {
                incidents.add(extractIncident(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error fetching incidents: " + e.getMessage());
        }
        return incidents;
    }

    public List<Incident> getUnsyncedIncidents() {
        List<Incident> incidents = new ArrayList<>();
        String query = "SELECT * FROM incidents WHERE is_dirty = 1";

        try (Connection conn = DatabaseService.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            while (rs.next()) {
                incidents.add(extractIncident(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error fetching unsynced incidents: " + e.getMessage());
        }
        return incidents;
    }

    public void insertOrUpdateIncident(Incident incident) {
        String query = "INSERT INTO incidents (id, title, description, category, status, reported_by, neighborhood_id, reported_at, synced_at, is_dirty) " +
                       "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                       "ON CONFLICT(id) DO UPDATE SET " +
                       "title=excluded.title, description=excluded.description, category=excluded.category, " +
                       "status=excluded.status, synced_at=excluded.synced_at, is_dirty=excluded.is_dirty";

        try (Connection conn = DatabaseService.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(query)) {

            pstmt.setString(1, incident.getId());
            pstmt.setString(2, incident.getTitle());
            pstmt.setString(3, incident.getDescription());
            pstmt.setString(4, incident.getCategory());
            pstmt.setString(5, incident.getStatus());
            pstmt.setString(6, incident.getReportedBy());
            pstmt.setString(7, incident.getNeighborhoodId());
            pstmt.setString(8, incident.getReportedAt());
            pstmt.setString(9, incident.getSyncedAt());
            pstmt.setInt(10, incident.getIsDirty());

            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error saving incident: " + e.getMessage());
        }
    }

    public void markAsSynced(String id, String syncedAtDate) {
        String query = "UPDATE incidents SET is_dirty = 0, synced_at = ? WHERE id = ?";
        try (Connection conn = DatabaseService.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(query)) {
            pstmt.setString(1, syncedAtDate);
            pstmt.setString(2, id);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error marking incident as synced: " + e.getMessage());
        }
    }

    private Incident extractIncident(ResultSet rs) throws SQLException {
        return new Incident(
                rs.getString("id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("category"),
                rs.getString("status"),
                rs.getString("reported_by"),
                rs.getString("neighborhood_id"),
                rs.getString("reported_at"),
                rs.getString("synced_at"),
                rs.getInt("is_dirty")
        );
    }
}
