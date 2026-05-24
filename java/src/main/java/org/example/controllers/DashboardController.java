package org.example.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import org.example.Main;
import org.example.services.AuthService;
import org.example.services.DatabaseService;

import java.io.IOException;

public class DashboardController {

    @FXML private Label welcomeLabel;
    @FXML private Label dbStatusLabel;

    @FXML
    public void initialize() {
        if (AuthService.isOfflineMode()) {
            welcomeLabel.setText("Mode hors connexion — données locales uniquement");
            welcomeLabel.setStyle("-fx-text-fill: #FF9800; -fx-font-size: 18; -fx-font-weight: bold;");
        } else {
            String name = AuthService.getUserEmail() != null ? AuthService.getUserEmail() : "Administrateur";
            welcomeLabel.setText("Bienvenue " + name + " (SSO ✓)");
        }
        dbStatusLabel.setText(DatabaseService.getConnection() != null
                ? "Base SQLite locale connectée"
                : "Base SQLite hors ligne");
    }

    @FXML
    private void handleLogout() {
        AuthService.logout();
        try {
            Main.setRoot("views/login.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleSync() {
        if (AuthService.isOfflineMode()) {
            dbStatusLabel.setText("Connexion requise pour synchroniser. Reconnectez-vous via SSO.");
            dbStatusLabel.setStyle("-fx-text-fill: #f44336;");
            return;
        }
        dbStatusLabel.setStyle("");
        dbStatusLabel.setText("Synchronisation en cours...");
        new Thread(() -> {
            try {
                org.example.services.SyncService.sync();
                javafx.application.Platform.runLater(() -> {
                    dbStatusLabel.setStyle("-fx-text-fill: green;");
                    dbStatusLabel.setText("Synchronisation réussie !");
                    // If sync worked, we clearly have connectivity — exit offline mode
                    if (AuthService.isOfflineMode()) AuthService.logout();
                });
            } catch (Exception e) {
                javafx.application.Platform.runLater(() -> {
                    dbStatusLabel.setStyle("-fx-text-fill: #f44336;");
                    dbStatusLabel.setText("Erreur sync : " + e.getMessage());
                });
            }
        }).start();
    }

    @FXML
    private void showIncidents() {
        try {
            Main.setRoot("views/incidents.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void showStatistics() {
        try {
            Main.setRoot("views/statistics.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void showPlugins() {
        try {
            Main.setRoot("views/plugins.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void showThemes() {
        try {
            Main.setRoot("views/themes.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
