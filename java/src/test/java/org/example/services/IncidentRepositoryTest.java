package org.example.services;

import org.example.models.Incident;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class IncidentRepositoryTest {
    
    private IncidentRepository repository;

    @BeforeEach
    public void setup() {
        repository = new IncidentRepository();
    }

    @AfterEach
    public void teardown() {
        try (java.sql.Connection conn = DatabaseService.getConnection();
             java.sql.Statement stmt = conn.createStatement()) {
             stmt.execute("DELETE FROM incidents");
        } catch(java.sql.SQLException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testInsertAndGetAll() {
        Incident incident = new Incident(
            UUID.randomUUID().toString(),
            "Title1",
            "Desc1",
            "Cat",
            "open",
            "U1",
            "N1",
            "2023-11-11",
            null,
            1
        );

        repository.insertOrUpdateIncident(incident);
        List<Incident> incidents = repository.getAllIncidents();
        
        assertFalse(incidents.isEmpty());
        assertEquals("Title1", incidents.get(0).getTitle());
    }

    @Test
    public void testGetUnsyncedIncidents() {
        Incident incidentDirty = new Incident();
        incidentDirty.setId(UUID.randomUUID().toString());
        incidentDirty.setTitle("DirtyTitle");
        incidentDirty.setIsDirty(1);

        Incident incidentClean = new Incident();
        incidentClean.setId(UUID.randomUUID().toString());
        incidentClean.setTitle("CleanTitle");
        incidentClean.setIsDirty(0);

        repository.insertOrUpdateIncident(incidentDirty);
        repository.insertOrUpdateIncident(incidentClean);

        List<Incident> unsynced = repository.getUnsyncedIncidents();
        assertFalse(unsynced.isEmpty());
        assertEquals(1, unsynced.get(0).getIsDirty());
    }
}