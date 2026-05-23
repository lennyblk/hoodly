package org.example.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextInputDialog;
import javafx.scene.control.TextField;
import org.example.services.AuthService;
import org.example.Main;

import java.io.IOException;
import java.util.Optional;

public class LoginController {

    @FXML private TextField emailField;
    @FXML private PasswordField passwordField;
    @FXML private Label errorLabel;

    @FXML
    private void handleLogin() {
        String email = emailField.getText().trim();
        String password = passwordField.getText();

        if (email.isEmpty() || password.isEmpty()) {
            errorLabel.setText("Veuillez remplir tous les champs.");
            return;
        }

        errorLabel.setText("Connexion en cours...");

        // Run in background to avoid freezing the UI
        new Thread(() -> {
            String result = AuthService.login(email, password);
            javafx.application.Platform.runLater(() -> {
                if (result == null) {
                    navigateToDashboard();
                } else if (result.startsWith("OTP_REQUIRED:")) {
                    String otpToken = result.substring("OTP_REQUIRED:".length());
                    handleOtpChallenge(otpToken);
                } else {
                    String msg = result.startsWith("ERROR:") ? result.substring(6) : result;
                    errorLabel.setText(msg);
                }
            });
        }).start();
    }

    private void handleOtpChallenge(String otpToken) {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Vérification MFA");
        dialog.setHeaderText("Un code a été envoyé à votre adresse e-mail.");
        dialog.setContentText("Code OTP :");

        Optional<String> opt = dialog.showAndWait();
        if (opt.isEmpty() || opt.get().isBlank()) {
            errorLabel.setText("Vérification annulée.");
            return;
        }

        String otpCode = opt.get().trim();
        new Thread(() -> {
            String verifyResult = AuthService.verifyOtp(otpToken, otpCode);
            javafx.application.Platform.runLater(() -> {
                if (verifyResult == null) {
                    navigateToDashboard();
                } else {
                    String msg = verifyResult.startsWith("ERROR:") ? verifyResult.substring(6) : verifyResult;
                    errorLabel.setText(msg);
                }
            });
        }).start();
    }

    private void navigateToDashboard() {
        try {
            Main.setRoot("views/dashboard.fxml");
        } catch (IOException e) {
            errorLabel.setText("Erreur chargement tableau de bord : " + e.getMessage());
        }
    }
}
