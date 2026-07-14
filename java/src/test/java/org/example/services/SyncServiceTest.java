package org.example.services;

import org.example.models.Incident;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SyncServiceTest {

    private static Incident incident(String id, String reportedAt, int isDirty) {
        return new Incident(id, "Titre", "Description", "voirie", "open",
                "user-1", "hood-1", reportedAt, null, isDirty);
    }

    // ---- isValidMongoId ----

    @Test
    void validMongoIdIsAccepted() {
        assertTrue(SyncService.isValidMongoId("507f1f77bcf86cd799439011"));
        assertTrue(SyncService.isValidMongoId("ABCDEF0123456789abcdef01"));
    }

    @Test
    void invalidMongoIdIsRejected() {
        assertFalse(SyncService.isValidMongoId(null));
        assertFalse(SyncService.isValidMongoId(""));
        assertFalse(SyncService.isValidMongoId("123"));
        assertFalse(SyncService.isValidMongoId("507f1f77bcf86cd79943901"));   // 23 caractères
        assertFalse(SyncService.isValidMongoId("507f1f77bcf86cd7994390111")); // 25 caractères
        assertFalse(SyncService.isValidMongoId("507f1f77bcf86cd79943901g"));  // caractère non hexadécimal
    }

    // ---- isPlaceholder ----

    @Test
    void placeholderValuesAreDetected() {
        assertTrue(SyncService.isPlaceholder(null));
        assertTrue(SyncService.isPlaceholder(""));
        assertTrue(SyncService.isPlaceholder("   "));
        assertTrue(SyncService.isPlaceholder("local"));
        assertTrue(SyncService.isPlaceholder("FAKE-NEIGHBORHOOD-ID"));
        assertTrue(SyncService.isPlaceholder("unknown"));
    }

    @Test
    void realNeighborhoodIdIsNotPlaceholder() {
        assertFalse(SyncService.isPlaceholder("507f1f77bcf86cd799439011"));
        assertFalse(SyncService.isPlaceholder("quartier-centre"));
    }

    // ---- isNewerOrEqual ----

    @Test
    void newerInstantWins() {
        assertTrue(SyncService.isNewerOrEqual("2026-07-12T10:00:00Z", "2026-07-12T09:00:00Z"));
        assertFalse(SyncService.isNewerOrEqual("2026-07-12T09:00:00Z", "2026-07-12T10:00:00Z"));
    }

    @Test
    void equalInstantsAreNewerOrEqual() {
        assertTrue(SyncService.isNewerOrEqual("2026-07-12T10:00:00Z", "2026-07-12T10:00:00Z"));
    }

    @Test
    void nullDatesFallBack() {
        assertFalse(SyncService.isNewerOrEqual(null, "2026-07-12T10:00:00Z"));
        assertTrue(SyncService.isNewerOrEqual("2026-07-12T10:00:00Z", null));
    }

    @Test
    void unparsableDatesFallBackToStringComparison() {
        assertTrue(SyncService.isNewerOrEqual("2026-07-12", "2026-07-11"));
        assertFalse(SyncService.isNewerOrEqual("2026-07-10", "2026-07-11"));
    }

    // ---- findById ----

    @Test
    void findByIdReturnsMatchingIncident() {
        List<Incident> list = List.of(
                incident("a1", "2026-07-01T00:00:00Z", 0),
                incident("b2", "2026-07-02T00:00:00Z", 1));

        Incident found = SyncService.findById(list, "b2");

        assertNotNull(found);
        assertEquals("b2", found.getId());
        assertEquals(1, found.getIsDirty());
    }

    @Test
    void findByIdReturnsNullWhenAbsent() {
        List<Incident> list = List.of(incident("a1", "2026-07-01T00:00:00Z", 0));

        assertNull(SyncService.findById(list, "zz"));
        assertNull(SyncService.findById(List.of(), "a1"));
    }
}
