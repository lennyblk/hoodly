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
        String name = AuthService.getUserEmail() != null ? AuthService.getUserEmail() : "Administrateur";
        welcomeLabel.setText("Bienvenue " + name + (AuthService.isAuthenticated() ? " (SSO ✓)" : ""));
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
        dbStatusLabel.setText("Synchronisation en cours...");
        new Thread(() -> {
            try {
                org.example.services.SyncService.sync();
                javafx.application.Platform.runLater(() -> dbStatusLabel.setText("Synchronisation réussie !"));
            } catch (Exception e) {
                javafx.application.Platform.runLater(() -> dbStatusLabel.setText("Erreur sync : " + e.getMessage()));
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
    private void handleToggleTheme() {
        Main.toggleTheme();
    }
}
