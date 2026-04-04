package org.example.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import org.example.services.AuthService;
import org.example.services.DatabaseService;
import org.example.Main;

import java.io.IOException;

public class DashboardController {

    @FXML
    private Label welcomeLabel;
    
    @FXML
    private Label dbStatusLabel;

    @FXML
    public void initialize() {
        welcomeLabel.setText("Welcome Administrateur!" + (AuthService.isAuthenticated() ? " (Authenticated via SSO)" : ""));
        
        if (DatabaseService.getConnection() != null) {
            dbStatusLabel.setText("SQLite Local Database Connected");
        } else {
            dbStatusLabel.setText("SQLite Local Database Offline");
        }
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
        dbStatusLabel.setText("Syncing with online server...");
        // TODO: Sync API logic using JWT Token
    }
}
