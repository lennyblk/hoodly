package org.example.plugins;

import org.example.plugin.api.Plugin;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.ServiceLoader;

public final class PluginManager {

    public record LoadedPlugin(Plugin plugin, String jarName) {}

    private record OpenJar(URLClassLoader loader, Path tempCopy) {}

    private static final List<OpenJar> openJars = new ArrayList<>();

    private PluginManager() {}

    public static Path getPluginsDirectory() {
        return Paths.get("plugins").toAbsolutePath();
    }

    public static synchronized List<LoadedPlugin> loadPlugins() {
        closeOpenJars();

        List<LoadedPlugin> result = new ArrayList<>();
        File dir = getPluginsDirectory().toFile();
        if (!dir.isDirectory()) {
            return result;
        }

        File[] jars = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".jar"));
        if (jars == null) {
            return result;
        }

        for (File jar : jars) {
            try {
                Path tempCopy = Files.createTempFile("hoodly-plugin-", ".jar");
                Files.copy(jar.toPath(), tempCopy, StandardCopyOption.REPLACE_EXISTING);
                tempCopy.toFile().deleteOnExit();

                URLClassLoader loader = new URLClassLoader(
                        new URL[]{tempCopy.toUri().toURL()},
                        PluginManager.class.getClassLoader());
                openJars.add(new OpenJar(loader, tempCopy));

                for (Plugin plugin : ServiceLoader.load(Plugin.class, loader)) {
                    result.add(new LoadedPlugin(plugin, jar.getName()));
                }
            } catch (Throwable t) {
                System.err.println("Plugin ignoré (" + jar.getName() + ") : " + t.getMessage());
            }
        }
        return result;
    }

    private static void closeOpenJars() {
        for (OpenJar open : openJars) {
            try {
                open.loader().close();
                Files.deleteIfExists(open.tempCopy());
            } catch (IOException ignored) {
            }
        }
        openJars.clear();
    }
}
