package org.example.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import org.example.services.AuthService;
import org.example.Main;

import java.io.IOException;

public class LoginController {

    @FXML
    private TextField emailField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private Label errorLabel;

    @FXML
    private void handleLogin() {
        String email = emailField.getText();
        String password = passwordField.getText();

        if (AuthService.login(email, password)) {
            try {
                Main.setRoot("views/dashboard.fxml");
            } catch (IOException e) {
                errorLabel.setText("Failed to load dashboard: " + e.getMessage());
            }
        } else {
            errorLabel.setText("Invalid email or password.");
        }
    }
}
