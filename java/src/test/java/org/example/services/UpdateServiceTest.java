package org.example.services;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UpdateServiceTest {

    @Test
    void newerVersionIsDetected() {
        assertTrue(UpdateService.isNewer("v1.1", "1.0-SNAPSHOT"));
        assertTrue(UpdateService.isNewer("v2.0", "1.9"));
        assertTrue(UpdateService.isNewer("1.0.1", "1.0"));
        assertTrue(UpdateService.isNewer("v1.10", "1.9"));
    }

    @Test
    void sameOrOlderVersionIsIgnored() {
        assertFalse(UpdateService.isNewer("v1.0", "1.0-SNAPSHOT"));
        assertFalse(UpdateService.isNewer("v1.0", "1.0"));
        assertFalse(UpdateService.isNewer("0.9", "1.0"));
        assertFalse(UpdateService.isNewer("v1.2", "1.2.1"));
    }

    @Test
    void versionsAreParsedFromTags() {
        assertArrayEquals(new int[]{1, 0}, UpdateService.parseVersion("v1.0"));
        assertArrayEquals(new int[]{1, 0}, UpdateService.parseVersion("1.0-SNAPSHOT"));
        assertArrayEquals(new int[]{2, 3, 4}, UpdateService.parseVersion("V2.3.4"));
    }

    @Test
    void currentVersionIsReadable() {
        assertFalse(UpdateService.getCurrentVersion().isBlank());
    }
}
