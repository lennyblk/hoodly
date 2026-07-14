package org.example.controllers;

import javafx.application.Platform;
import javafx.scene.control.Label;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;
import org.example.plugin.api.Plugin;
import org.example.plugin.api.PluginContext;
import org.example.plugins.PluginManager;
import org.example.plugins.PluginManager.LoadedPlugin;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

class PluginsControllerTest {

    private PluginsController controller;
    private FlowPane pluginsPane;
    private Label dirLabel;
    private Label statusLabel;

    @BeforeAll
    static void initJavaFx() {
        try {
            Platform.startup(() -> {});
        } catch (IllegalStateException alreadyStarted) {
            // Le toolkit JavaFX est déjà démarré par un autre test.
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        controller = new PluginsController();
        pluginsPane = new FlowPane();
        dirLabel = new Label();
        statusLabel = new Label();
        inject("pluginsPane", pluginsPane);
        inject("dirLabel", dirLabel);
        inject("statusLabel", statusLabel);
    }

    private void inject(String fieldName, Object value) throws Exception {
        Field field = PluginsController.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(controller, value);
    }

    private Object invoke(String methodName, Class<?>[] types, Object... args) throws Exception {
        Method method = PluginsController.class.getDeclaredMethod(methodName, types);
        method.setAccessible(true);
        return method.invoke(controller, args);
    }

    private static Plugin fakePlugin(String name, String message) {
        return new Plugin() {
            @Override public String getName() { return name; }
            @Override public String getDescription() { return "Un plugin de test"; }
            @Override public String execute(PluginContext context) { return message; }
        };
    }

    private static Plugin failingPlugin(String name, String error) {
        return new Plugin() {
            @Override public String getName() { return name; }
            @Override public String getDescription() { return "Un plugin qui échoue"; }
            @Override public String execute(PluginContext context) throws Exception {
                throw new Exception(error);
            }
        };
    }

    // ---- initialize / refresh ----

    @Test
    void initializeShowsPluginsDirectoryAndFillsPane() {
        controller.initialize();

        assertTrue(dirLabel.getText().contains(PluginManager.getPluginsDirectory().toString()));
        // Soit des cartes de plugins, soit le message "Aucun plugin installé"
        assertFalse(pluginsPane.getChildren().isEmpty());
    }

    @Test
    void handleRefreshShowsConfirmation() throws Exception {
        invoke("handleRefresh", new Class<?>[]{});

        assertEquals("Plugins rechargés.", statusLabel.getText());
        assertTrue(statusLabel.getStyle().contains("green"));
    }

    // ---- execute ----

    @Test
    void executeShowsPluginMessageOnSuccess() throws Exception {
        LoadedPlugin lp = new LoadedPlugin(fakePlugin("Météo", "42 incidents analysés"), "meteo.jar");

        invoke("execute", new Class<?>[]{LoadedPlugin.class}, lp);

        assertEquals("42 incidents analysés", statusLabel.getText());
        assertTrue(statusLabel.getStyle().contains("green"));
    }

    @Test
    void executeShowsErrorWhenPluginFails() throws Exception {
        LoadedPlugin lp = new LoadedPlugin(failingPlugin("Cassé", "boom"), "casse.jar");

        invoke("execute", new Class<?>[]{LoadedPlugin.class}, lp);

        assertTrue(statusLabel.getStyle().contains("red"));
        assertTrue(statusLabel.getText().contains("Cassé"));
        assertTrue(statusLabel.getText().contains("boom"));
    }

    // ---- buildCard ----

    @Test
    void buildCardContainsPluginInfoAndActions() throws Exception {
        LoadedPlugin lp = new LoadedPlugin(fakePlugin("Calendrier", "ok"), "calendrier.jar");

        VBox card = (VBox) invoke("buildCard",
                new Class<?>[]{LoadedPlugin.class, String.class}, lp, "#4CAF50");

        // nom, description, fichier source, bouton Exécuter, bouton Désinstaller
        assertEquals(5, card.getChildren().size());
        assertEquals("Calendrier", ((Label) card.getChildren().get(0)).getText());
        assertEquals("calendrier.jar", ((Label) card.getChildren().get(2)).getText());
    }
}
