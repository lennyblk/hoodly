package org.example.controllers;

import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;
import org.example.Main;
import org.example.plugins.AppPluginContext;
import org.example.plugins.PluginManager;
import org.example.plugins.PluginManager.LoadedPlugin;

import java.io.IOException;
import java.util.List;


public class PluginsController {

    private static final String[] BUTTON_COLORS = {"#4CAF50", "#9C27B0", "#FF9800", "#2196F3", "#E91E63"};

    @FXML private FlowPane pluginsPane;
    @FXML private Label dirLabel;
    @FXML private Label statusLabel;

    @FXML
    public void initialize() {
        dirLabel.setText("Dossier scanné : " + PluginManager.getPluginsDirectory());
        refresh();
    }

    @FXML
    private void handleRefresh() {
        refresh();
        statusLabel.setStyle("-fx-text-fill: green;");
        statusLabel.setText("Plugins rechargés.");
    }

    private void refresh() {
        pluginsPane.getChildren().clear();

        List<LoadedPlugin> plugins = PluginManager.loadPlugins();
        if (plugins.isEmpty()) {
            Label empty = new Label("Aucun plugin installé.\nDéposez un fichier .jar dans le dossier plugins/ puis cliquez sur Recharger.");
            empty.setStyle("-fx-text-fill: #888; -fx-font-size: 14; -fx-text-alignment: center;");
            pluginsPane.getChildren().add(empty);
            return;
        }

        int index = 0;
        for (LoadedPlugin lp : plugins) {
            pluginsPane.getChildren().add(buildCard(lp, BUTTON_COLORS[index++ % BUTTON_COLORS.length]));
        }
    }

    private VBox buildCard(LoadedPlugin lp, String color) {
        Label name = new Label(lp.plugin().getName());
        name.setStyle("-fx-font-size: 16; -fx-font-weight: bold;");

        Label description = new Label(lp.plugin().getDescription());
        description.setWrapText(true);
        description.setStyle("-fx-text-alignment: center;");
        description.setMaxWidth(220);

        Label source = new Label(lp.jarName());
        source.setStyle("-fx-text-fill: #999; -fx-font-size: 11;");

        Button run = new Button("Exécuter");
        run.setMinWidth(160);
        run.setStyle("-fx-background-color: " + color + "; -fx-text-fill: white; -fx-font-weight: bold;");
        run.setOnAction(e -> execute(lp));

        VBox card = new VBox(12, name, description, source, run);
        card.setAlignment(Pos.CENTER);
        card.setStyle("-fx-border-color: #ddd; -fx-border-width: 1; -fx-padding: 30;");
        return card;
    }

    private void execute(LoadedPlugin lp) {
        try {
            String message = lp.plugin().execute(new AppPluginContext());
            statusLabel.setStyle("-fx-text-fill: green;");
            statusLabel.setText(message);
        } catch (Exception e) {
            statusLabel.setStyle("-fx-text-fill: red;");
            statusLabel.setText("Erreur du plugin « " + lp.plugin().getName() + " » : " + e.getMessage());
        }
    }

    @FXML
    private void goBack() {
        try {
            Main.setRoot("views/dashboard.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
