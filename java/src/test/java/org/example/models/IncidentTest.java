package org.example.models;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class IncidentTest {

    @Test
    public void testIncidentCreation() {
        Incident incident = new Incident(
            "123",
            "Test Title",
            "Description",
            "Cat",
            "open",
            "user1",
            "nghb1",
            "2023-10-10T10:00:00Z",
            null,
            1
        );

        assertEquals("123", incident.getId());
        assertEquals("Test Title", incident.getTitle());
        assertEquals("open", incident.getStatus());
        assertEquals(1, incident.getIsDirty());
    }

    @Test
    public void testIncidentMutation() {
        Incident incident = new Incident();
        incident.setId("456");
        incident.setStatus("resolved");
        incident.setIsDirty(0);

        assertEquals("456", incident.getId());
        assertEquals("resolved", incident.getStatus());
        assertEquals(0, incident.getIsDirty());
    }
}