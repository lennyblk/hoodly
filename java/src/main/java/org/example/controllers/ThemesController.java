package org.example.controllers;

import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import org.example.Main;
import org.example.services.ThemeService;
import org.json.JSONObject;

import java.io.IOException;

public class ThemesController {

    @FXML private ComboBox<String> presetCombo;
    @FXML private ColorPicker bgColorPicker;
    @FXML private ColorPicker textColorPicker;
    @FXML private ColorPicker primaryColorPicker;
    @FXML private ColorPicker controlBgPicker;
    @FXML private ColorPicker borderColorPicker;
    @FXML private ComboBox<String> fontCombo;
    @FXML private Label statusLabel;

    private JSONObject workingTheme;

    @FXML
    public void initialize() {
        presetCombo.setItems(FXCollections.observableArrayList(ThemeService.PRESETS.keySet()));

        fontCombo.setItems(FXCollections.observableArrayList(ThemeService.getAvailableFonts()));
        fontCombo.setEditable(true);

        workingTheme = ThemeService.loadCurrent();
        populateFields(workingTheme);

        presetCombo.setOnAction(e -> {
            String name = presetCombo.getValue();
            if (name == null) return;
            JSONObject preset = ThemeService.PRESETS.get(name);
            if (preset == null) return;
            // Deep copy so modifications don't alter the preset
            workingTheme = new JSONObject(preset.toString());
            populateFields(workingTheme);
            ThemeService.apply(workingTheme);
            statusLabel.setStyle("-fx-text-fill: #555;");
            statusLabel.setText("Préréglage \"" + name + "\" chargé — personnalisez puis sauvegardez.");
        });
    }

    @FXML
    private void handleApply() {
        workingTheme = buildThemeFromFields();
        ThemeService.apply(workingTheme);
        statusLabel.setStyle("-fx-text-fill: green;");
        statusLabel.setText("Aperçu appliqué (non sauvegardé).");
    }

    @FXML
    private void handleSave() {
        workingTheme = buildThemeFromFields();
        ThemeService.saveAndApply(workingTheme);
        statusLabel.setStyle("-fx-text-fill: green;");
        statusLabel.setText("Thème sauvegardé ✓");
    }

    @FXML
    private void handleReset() {
        workingTheme = new JSONObject(ThemeService.PRESETS.get("Clair").toString());
        populateFields(workingTheme);
        ThemeService.apply(workingTheme);
        statusLabel.setStyle("-fx-text-fill: #555;");
        statusLabel.setText("Réinitialisé sur \"Clair\".");
    }

    @FXML
    private void goBack() {
        try { Main.setRoot("views/dashboard.fxml"); }
        catch (IOException e) { e.printStackTrace(); }
    }


    private void populateFields(JSONObject t) {
        bgColorPicker.setValue(ThemeService.hexToColor(t.optString("backgroundColor",   "#f5f5f5")));
        textColorPicker.setValue(ThemeService.hexToColor(t.optString("textColor",        "#212121")));
        primaryColorPicker.setValue(ThemeService.hexToColor(t.optString("primaryColor",  "#2196F3")));
        controlBgPicker.setValue(ThemeService.hexToColor(t.optString("controlBackground","#ffffff")));
        borderColorPicker.setValue(ThemeService.hexToColor(t.optString("borderColor",    "#dddddd")));

        String family = t.optString("fontFamily", "System");
        fontCombo.setValue(ThemeService.getAvailableFonts().contains(family) ? family : "System");
    }

    /** Reads all pickers and returns a full theme JSONObject. */
    private JSONObject buildThemeFromFields() {
        JSONObject t = new JSONObject();
        t.put("backgroundColor",   ThemeService.colorToHex(bgColorPicker.getValue()));
        t.put("textColor",         ThemeService.colorToHex(textColorPicker.getValue()));
        t.put("primaryColor",      ThemeService.colorToHex(primaryColorPicker.getValue()));
        t.put("controlBackground", ThemeService.colorToHex(controlBgPicker.getValue()));
        t.put("borderColor",       ThemeService.colorToHex(borderColorPicker.getValue()));
        t.put("fontFamily",        fontCombo.getValue() != null ? fontCombo.getValue() : "System");
        return t;
    }
}
