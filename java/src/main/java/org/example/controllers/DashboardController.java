package org.example.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import org.example.Main;
import org.example.services.AuthService;
import org.example.services.DatabaseService;
import org.example.services.UninstallService;

import java.io.IOException;
import java.nio.file.Path;

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
    private void handleUninstall() {
        Path jar = UninstallService.getApplicationJar();

        if (jar == null) {
            Alert info = new Alert(Alert.AlertType.INFORMATION);
            info.setTitle("Désinstallation indisponible");
            info.setHeaderText("L'application n'est pas installée.");
            info.setContentText("Vous exécutez l'application depuis les sources (IDE ou mvn javafx:run). "
                    + "La désinstallation n'est disponible que depuis l'application packagée "
                    + "(hoodly-desktop.jar). Rien n'a été supprimé.");
            info.showAndWait();
            return;
        }

        String content = "Seront supprimés définitivement :\n"
                + "• " + jar.getFileName() + " (l'application)\n"
                + "• hoodly_local.db (base de données locale)\n"
                + "• hoodly_themes.json (préférences de thème)\n"
                + "• le dossier plugins/ et son contenu\n"
                + "\nL'application va se fermer.";

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Désinstaller Hoodly Desktop");
        confirm.setHeaderText("Désinstaller complètement l'application ?");
        confirm.setContentText(content);

        if (confirm.showAndWait().filter(b -> b == ButtonType.OK).isEmpty()) {
            return;
        }

        try {
            UninstallService.uninstallAndExit();
        } catch (IOException e) {
            dbStatusLabel.setStyle("-fx-text-fill: #f44336;");
            dbStatusLabel.setText("Erreur de désinstallation : " + e.getMessage());
        }
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
