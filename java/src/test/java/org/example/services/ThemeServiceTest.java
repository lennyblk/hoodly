package org.example.services;

import javafx.scene.paint.Color;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ThemeServiceTest {

    private static final Path THEMES_FILE = Path.of("hoodly_themes.json");
    private static byte[] backup;

    @BeforeAll
    static void backupThemesFile() throws IOException {
        backup = Files.exists(THEMES_FILE) ? Files.readAllBytes(THEMES_FILE) : null;
    }

    @AfterAll
    static void restoreThemesFile() throws IOException {
        if (backup != null) {
            Files.write(THEMES_FILE, backup);
        } else {
            Files.deleteIfExists(THEMES_FILE);
        }
    }

    // ---- Presets ----

    @Test
    void presetsAreComplete() {
        assertTrue(ThemeService.PRESETS.containsKey("Clair"));
        assertTrue(ThemeService.PRESETS.containsKey("Bleu nuit"));

        for (JSONObject preset : ThemeService.PRESETS.values()) {
            assertTrue(preset.has("backgroundColor"));
            assertTrue(preset.has("textColor"));
            assertTrue(preset.has("primaryColor"));
            assertTrue(preset.has("controlBackground"));
            assertTrue(preset.has("borderColor"));
            assertTrue(preset.has("fontFamily"));
        }
    }

    // ---- generateCss ----

    @Test
    void generateCssUsesThemeColors() {
        JSONObject theme = ThemeService.PRESETS.get("Bleu nuit");
        String css = ThemeService.generateCss(theme);

        assertTrue(css.contains("#0d1b2a"));
        assertTrue(css.contains("#e8f4fd"));
        assertTrue(css.contains("#4fc3f7"));
        assertTrue(css.contains(".root"));
        assertTrue(css.contains(".button"));
        assertTrue(css.contains(".table-view"));
    }

    @Test
    void generateCssFallsBackToDefaults() {
        String css = ThemeService.generateCss(new JSONObject());

        assertTrue(css.contains("#f5f5f5"));
        assertTrue(css.contains("#212121"));
        assertTrue(css.contains("\"System\""));
    }

    // ---- Color utilities ----

    @Test
    void blendMixesColors() {
        assertEquals("#ffffff", ThemeService.blend("#ffffff", "#000000", 1.0));
        assertEquals("#000000", ThemeService.blend("#ffffff", "#000000", 0.0));
        assertEquals("#7f7f7f", ThemeService.blend("#ffffff", "#000000", 0.5));
    }

    @Test
    void blendReturnsSecondColorOnInvalidInput() {
        assertEquals("#123456", ThemeService.blend("pas-une-couleur", "#123456", 0.5));
    }

    @Test
    void darkenAndLightenAdjustBrightness() {
        assertEquals("#7f7f7f", ThemeService.darken("#ffffff", 0.5));
        assertEquals("#000000", ThemeService.darken("#000000", 0.5));
        // lighten est plafonné à 255 par canal
        assertEquals("#ffffff", ThemeService.lighten("#ffffff", 0.5));
        assertEquals("#c0c0c0", ThemeService.lighten("#808080", 0.5));
    }

    @Test
    void invalidHexIsReturnedUnchangedByBrightnessAdjustment() {
        assertEquals("oops", ThemeService.darken("oops", 0.2));
        assertEquals("oops", ThemeService.lighten("oops", 0.2));
    }

    @Test
    void shortHexNotationIsExpanded() {
        assertEquals("#ffffff", ThemeService.blend("#fff", "#000", 1.0));
        assertEquals("#000000", ThemeService.blend("#fff", "#000", 0.0));
    }

    @Test
    void colorAndHexConversionsRoundTrip() {
        assertEquals("#ff0000", ThemeService.colorToHex(Color.RED));
        assertEquals("#000000", ThemeService.colorToHex(Color.BLACK));
        assertEquals(Color.web("#2196F3"), ThemeService.hexToColor("#2196F3"));
    }

    @Test
    void invalidHexBecomesWhiteColor() {
        assertEquals(Color.WHITE, ThemeService.hexToColor("pas-une-couleur"));
        assertEquals(Color.WHITE, ThemeService.hexToColor(null));
    }

    // ---- Persistence (la scène est nulle en test : apply() est sans effet) ----

    @Test
    void saveAndLoadRoundTrip() {
        JSONObject theme = new JSONObject()
                .put("backgroundColor", "#111111")
                .put("textColor", "#eeeeee")
                .put("primaryColor", "#ff00ff")
                .put("controlBackground", "#222222")
                .put("borderColor", "#333333")
                .put("fontFamily", "Arial");

        ThemeService.saveAndApply(theme);
        JSONObject loaded = ThemeService.loadCurrent();

        assertEquals("#111111", loaded.getString("backgroundColor"));
        assertEquals("#ff00ff", loaded.getString("primaryColor"));
        assertEquals("Arial", loaded.getString("fontFamily"));
    }

    @Test
    void loadCurrentFallsBackToDefaultPresetWhenNoFile() throws IOException {
        Files.deleteIfExists(THEMES_FILE);

        JSONObject loaded = ThemeService.loadCurrent();

        assertEquals(ThemeService.PRESETS.get("Clair").getString("backgroundColor"),
                loaded.getString("backgroundColor"));
    }
}
