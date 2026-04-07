package org.example;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;
import java.util.Objects;

public class Main extends Application {
    private static Scene scene;
    private static boolean isDarkMode = false;

    @Override
    public void start(Stage stage) throws IOException {
        scene = new Scene(loadFXML("views/login.fxml"), 800, 600);
        applyTheme();
        stage.setScene(scene);
        stage.setTitle("Hoodly - Desktop Admin");
        stage.show();
    }

    public static void setRoot(String fxml) throws IOException {
        scene.setRoot(loadFXML(fxml));
        applyTheme();
    }

    public static void toggleTheme() {
        isDarkMode = !isDarkMode;
        applyTheme();
    }

    public static boolean isDarkMode() {
        return isDarkMode;
    }

    private static void applyTheme() {
        if (scene != null) {
            scene.getStylesheets().clear();
            if (isDarkMode) {
                String css = Objects.requireNonNull(Main.class.getResource("css/dark-theme.css")).toExternalForm();
                scene.getStylesheets().add(css);
            }
        }
    }

    private static Parent loadFXML(String fxml) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(Main.class.getResource(fxml));
        return fxmlLoader.load();
    }

    public static void main(String[] args) {
        new Thread(() -> org.example.services.DatabaseService.getConnection()).start();
        launch();
    }
}