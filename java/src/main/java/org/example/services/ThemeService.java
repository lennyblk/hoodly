package org.example.services;

import javafx.scene.Scene;
import javafx.scene.text.Font;
import org.json.JSONObject;

import java.io.*;
import java.nio.file.*;
import java.util.LinkedHashMap;
import java.util.Map;

public class ThemeService {

    private static final String THEMES_FILE = "hoodly_themes.json";
    private static Scene scene = null;


    public static final Map<String, JSONObject> PRESETS = new LinkedHashMap<>();

    static {
        PRESETS.put("Clair",     buildPreset("#f5f5f5", "#212121", "#2196F3", "#ffffff", "#dddddd", "System"));
        PRESETS.put("Bleu nuit", buildPreset("#0d1b2a", "#e8f4fd", "#4fc3f7", "#1b2a3b", "#2a4a6b", "System"));
    }


    public static void setScene(Scene s) { scene = s; }

    public static void apply(JSONObject theme) {
        if (scene == null) return;
        String css = generateCss(theme);
        try {
            Path tmp = Files.createTempFile("hoodly_theme_", ".css");
            Files.writeString(tmp, css);
            tmp.toFile().deleteOnExit();
            scene.getStylesheets().clear();
            scene.getStylesheets().add(tmp.toUri().toString());
        } catch (IOException e) {
            System.err.println("ThemeService: could not write temp CSS: " + e.getMessage());
        }
    }

    public static void saveAndApply(JSONObject theme) {
        apply(theme);
        save(theme);
    }

    public static void loadAndApply() {
        JSONObject saved = load();
        apply(saved != null ? saved : new JSONObject(PRESETS.get("Clair").toString()));
    }

    public static JSONObject loadCurrent() {
        JSONObject saved = load();
        return saved != null ? saved : new JSONObject(PRESETS.get("Clair").toString());
    }


    public static String generateCss(JSONObject t) {
        String bg      = t.optString("backgroundColor",   "#f5f5f5");
        String text    = t.optString("textColor",         "#212121");
        String primary = t.optString("primaryColor",      "#2196F3");
        String ctrl    = t.optString("controlBackground", "#ffffff");
        String border  = t.optString("borderColor",       "#dddddd");
        String font    = t.optString("fontFamily",        "System");

        String ctrlAlt   = darken(ctrl, 0.05);
        String hoverPrimary = lighten(primary, 0.1);
        // Detail box: a tinted version of the primary colour at low opacity
        String detailBg  = blend(primary, bg, 0.12);
        String detailBorder = primary;

        return String.format("""
            .root {
                -fx-background-color: %s;
                -fx-text-inner-color: %s;
                -fx-base: %s;
                -fx-control-inner-background: %s;
                -fx-color: %s;
                -fx-text-fill: %s;
                -fx-font-family: "%s";
            }
            .label {
                -fx-text-fill: %s;
                -fx-font-family: "%s";
            }
            .button {
                -fx-background-color: %s;
                -fx-text-fill: %s;
                -fx-border-color: %s;
                -fx-border-radius: 4;
                -fx-background-radius: 4;
            }
            .button:hover { -fx-background-color: %s; }
            .button-primary { -fx-background-color: %s; -fx-text-fill: white; }
            .button-primary:hover { -fx-background-color: %s; }
            .button-success { -fx-background-color: #4caf50; -fx-text-fill: white; }
            .button-success:hover { -fx-background-color: #43a047; }
            .button-danger  { -fx-background-color: #f44336; -fx-text-fill: white; }
            .button-danger:hover  { -fx-background-color: #e53935; }
            .text-field, .text-area, .password-field {
                -fx-background-color: %s;
                -fx-text-fill: %s;
                -fx-prompt-text-fill: derive(%s, 40%%);
                -fx-border-color: %s;
                -fx-border-radius: 3;
            }
            .table-view {
                -fx-background-color: %s;
                -fx-control-inner-background: %s;
                -fx-table-cell-border-color: %s;
            }
            .table-row-cell { -fx-background-color: %s; -fx-text-background-color: %s; }
            .table-row-cell:odd { -fx-background-color: %s; }
            .table-row-cell:selected { -fx-background-color: %s; }
            .column-header-background, .table-column-header {
                -fx-background-color: %s;
                -fx-text-fill: %s;
            }
            .vbox-card {
                -fx-background-color: %s !important;
                -fx-border-color: %s !important;
            }
            .incidents-detail-box {
                -fx-background-color: %s !important;
                -fx-border-color: %s !important;
            }
            .detail-title { -fx-text-fill: %s !important; }
            .incidents-create-box {
                -fx-background-color: %s !important;
                -fx-border-color: %s !important;
            }
            .text-area-detail {
                -fx-control-inner-background: %s !important;
                -fx-text-fill: %s !important;
            }
            .chart { -fx-background-color: transparent; }
            .chart-plot-background { -fx-background-color: %s; }
            .chart-title { -fx-text-fill: %s; }
            .axis-label, .axis { -fx-text-fill: %s; }
            .combo-box, .choice-box {
                -fx-background-color: %s;
                -fx-text-fill: %s;
                -fx-border-color: %s;
            }
            .scroll-pane { -fx-background-color: %s; }
            """,
            // .root
            bg, text, ctrl, ctrl, bg, text, font,
            // .label
            text, font,
            // .button
            ctrl, text, border,
            darken(ctrl, 0.08),
            primary, hoverPrimary,
            // .text-field
            ctrl, text, text, border,
            // .table-view
            bg, ctrl, border,
            // .table-row-cell
            ctrl, text, ctrlAlt, primary,
            // column-header
            ctrlAlt, text,
            // .vbox-card
            ctrl, border,
            // .incidents-detail-box
            detailBg, detailBorder,
            // .detail-title
            primary,
            // .incidents-create-box
            ctrlAlt, border,
            // .text-area-detail
            ctrl, text,
            // chart
            ctrl, text, text,
            // .combo-box
            ctrl, text, border,
            // .scroll-pane
            bg
        );
    }


    private static void save(JSONObject theme) {
        try { Files.writeString(Path.of(THEMES_FILE), theme.toString(2)); }
        catch (IOException e) { System.err.println("ThemeService save: " + e.getMessage()); }
    }

    private static JSONObject load() {
        try {
            if (Files.exists(Path.of(THEMES_FILE)))
                return new JSONObject(Files.readString(Path.of(THEMES_FILE)));
        } catch (Exception e) { System.err.println("ThemeService load: " + e.getMessage()); }
        return null;
    }


    private static JSONObject buildPreset(String bg, String text, String primary,
                                           String ctrl, String border, String font) {
        JSONObject o = new JSONObject();
        o.put("backgroundColor",   bg);
        o.put("textColor",         text);
        o.put("primaryColor",      primary);
        o.put("controlBackground", ctrl);
        o.put("borderColor",       border);
        o.put("fontFamily",        font);
        return o;
    }

    /** Mix color a into color b by ratio (0=all b, 1=all a). */
    public static String blend(String hexA, String hexB, double ratio) {
        try {
            int[] a = parseRgb(hexA), b = parseRgb(hexB);
            int r = (int)(a[0] * ratio + b[0] * (1 - ratio));
            int g = (int)(a[1] * ratio + b[1] * (1 - ratio));
            int bl = (int)(a[2] * ratio + b[2] * (1 - ratio));
            return String.format("#%02x%02x%02x", r, g, bl);
        } catch (Exception e) { return hexB; }
    }

    public static String darken(String hex, double ratio) { return adjustBrightness(hex, 1.0 - ratio); }
    public static String lighten(String hex, double ratio) { return adjustBrightness(hex, 1.0 + ratio); }

    private static String adjustBrightness(String hex, double factor) {
        try {
            int[] rgb = parseRgb(hex);
            return String.format("#%02x%02x%02x",
                    Math.min(255, (int)(rgb[0] * factor)),
                    Math.min(255, (int)(rgb[1] * factor)),
                    Math.min(255, (int)(rgb[2] * factor)));
        } catch (Exception e) { return hex; }
    }

    private static int[] parseRgb(String hex) {
        hex = hex.replace("#", "");
        if (hex.length() == 3) hex = "" + hex.charAt(0) + hex.charAt(0)
                + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
        return new int[]{
            Integer.parseInt(hex.substring(0, 2), 16),
            Integer.parseInt(hex.substring(2, 4), 16),
            Integer.parseInt(hex.substring(4, 6), 16)
        };
    }

    public static String colorToHex(javafx.scene.paint.Color c) {
        return String.format("#%02x%02x%02x",
                (int)(c.getRed() * 255), (int)(c.getGreen() * 255), (int)(c.getBlue() * 255));
    }

    public static javafx.scene.paint.Color hexToColor(String hex) {
        try { return javafx.scene.paint.Color.web(hex); }
        catch (Exception e) { return javafx.scene.paint.Color.WHITE; }
    }

    public static java.util.List<String> getAvailableFonts() { return Font.getFamilies(); }
}
