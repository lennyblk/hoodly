package org.example.services;

import javafx.application.Platform;
import org.example.Main;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public final class UninstallService {

    private UninstallService() {}

    public static Path getApplicationJar() {
        try {
            Path source = Paths.get(Main.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            if (Files.isRegularFile(source) && source.toString().toLowerCase().endsWith(".jar")) {
                return source;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public static List<Path> getLocalDataPaths() {
        return List.of(
                Paths.get("hoodly_local.db").toAbsolutePath(),
                Paths.get("hoodly_themes.json").toAbsolutePath(),
                Paths.get("plugins").toAbsolutePath());
    }

    public static void uninstallAndExit() throws IOException {
        launchCleanupScript(getApplicationJar(), getLocalDataPaths());
        Platform.exit();
        System.exit(0);
    }

    static void launchCleanupScript(Path appJar, List<Path> dataPaths) throws IOException {
        List<Path> targets = new ArrayList<>();
        if (appJar != null) {
            targets.add(appJar);
        }
        targets.addAll(dataPaths);

        boolean windows = System.getProperty("os.name").toLowerCase().contains("win");
        Path script = windows ? writeWindowsScript(targets) : writeUnixScript(targets);

        ProcessBuilder pb = windows
                ? new ProcessBuilder("cmd", "/c", script.toString())
                : new ProcessBuilder("/bin/sh", script.toString());
        pb.directory(script.getParent().toFile());
        pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
        pb.redirectError(ProcessBuilder.Redirect.DISCARD);
        pb.start();
    }

    private static Path writeWindowsScript(List<Path> targets) throws IOException {
        StringBuilder s = new StringBuilder();
        s.append("@echo off\r\n");
        s.append("chcp 65001 >nul\r\n");
        s.append("set /a tries=0\r\n");
        s.append(":retry\r\n");
        s.append("ping -n 2 127.0.0.1 >nul\r\n");
        for (Path t : targets) {
            if (Files.isDirectory(t)) {
                s.append("rmdir /s /q \"").append(t).append("\" >nul 2>&1\r\n");
            } else {
                s.append("del /f /q \"").append(t).append("\" >nul 2>&1\r\n");
            }
        }
        s.append("set /a tries+=1\r\n");
        s.append("if %tries% geq 60 goto done\r\n");
        for (Path t : targets) {
            s.append("if exist \"").append(t).append("\" goto retry\r\n");
        }
        s.append(":done\r\n");
        s.append("(goto) 2>nul & del \"%~f0\"\r\n");

        Path script = Files.createTempFile("hoodly-uninstall-", ".bat");
        Files.writeString(script, s.toString());
        return script;
    }

    private static Path writeUnixScript(List<Path> targets) throws IOException {
        StringBuilder s = new StringBuilder();
        s.append("#!/bin/sh\n");
        s.append("sleep 2\n");
        for (Path t : targets) {
            s.append("rm -rf \"").append(t).append("\"\n");
        }
        s.append("rm -- \"$0\"\n");

        Path script = Files.createTempFile("hoodly-uninstall-", ".sh");
        Files.writeString(script, s.toString());
        script.toFile().setExecutable(true);
        return script;
    }
}
