package org.example.services;

import javafx.application.Platform;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Properties;

public final class UpdateService {

    public record UpdateInfo(String version, String downloadUrl) {}

    static String releasesUrl = "https://api.github.com/repos/lennyblk/hoodly/releases/latest";

    private static final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private UpdateService() {}

    public static String getCurrentVersion() {
        try (InputStream in = UpdateService.class.getResourceAsStream("/version.properties")) {
            Properties props = new Properties();
            props.load(in);
            return props.getProperty("version", "0.0");
        } catch (Exception e) {
            return "0.0";
        }
    }

    public static UpdateInfo checkForUpdate() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(releasesUrl))
                .header("Accept", "application/vnd.github+json")
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 404) {
            return null;
        }
        if (response.statusCode() != 200) {
            throw new Exception("GitHub a répondu avec le code " + response.statusCode());
        }

        JSONObject release = new JSONObject(response.body());
        String tag = release.optString("tag_name", "");

        String jarUrl = null;
        JSONArray assets = release.optJSONArray("assets");
        if (assets != null) {
            for (int i = 0; i < assets.length(); i++) {
                JSONObject asset = assets.getJSONObject(i);
                if (asset.optString("name").endsWith(".jar")) {
                    jarUrl = asset.optString("browser_download_url");
                    break;
                }
            }
        }

        if (tag.isEmpty() || jarUrl == null || !isNewer(tag, getCurrentVersion())) {
            return null;
        }
        return new UpdateInfo(tag, jarUrl);
    }

    public static Path download(UpdateInfo update) throws Exception {
        Path dest = Files.createTempFile("hoodly-update-", ".jar");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(update.downloadUrl()))
                .GET()
                .build();
        HttpResponse<Path> response = client.send(request, HttpResponse.BodyHandlers.ofFile(dest));
        if (response.statusCode() != 200) {
            Files.deleteIfExists(dest);
            throw new Exception("Téléchargement échoué — code " + response.statusCode());
        }
        return dest;
    }

    public static void applyUpdateAndRestart(Path downloadedJar) throws IOException {
        Path appJar = UninstallService.getApplicationJar();
        if (appJar == null) {
            throw new IllegalStateException("Mise à jour disponible uniquement depuis l'application packagée");
        }
        launchSwapScript(downloadedJar, appJar);
        Platform.exit();
        System.exit(0);
    }

    static void launchSwapScript(Path newJar, Path appJar) throws IOException {
        boolean windows = System.getProperty("os.name").toLowerCase().contains("win");
        Path java = Path.of(System.getProperty("java.home"), "bin", windows ? "javaw.exe" : "java");
        Path script = windows
                ? writeWindowsScript(newJar, appJar, java)
                : writeUnixScript(newJar, appJar, java);

        ProcessBuilder pb = windows
                ? new ProcessBuilder("cmd", "/c", script.toString())
                : new ProcessBuilder("/bin/sh", script.toString());
        pb.directory(script.getParent().toFile());
        pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
        pb.redirectError(ProcessBuilder.Redirect.DISCARD);
        pb.start();
    }

    private static Path writeWindowsScript(Path newJar, Path appJar, Path javaw) throws IOException {
        StringBuilder s = new StringBuilder();
        s.append("@echo off\r\n");
        s.append("chcp 65001 >nul\r\n");
        s.append("set /a tries=0\r\n");
        s.append(":retry\r\n");
        // timeout requiert une console ; ping fonctionne aussi sans stdin (lancement via javaw)
        s.append("ping -n 2 127.0.0.1 >nul\r\n");
        s.append("copy /y \"").append(newJar).append("\" \"").append(appJar).append("\" >nul 2>&1\r\n");
        s.append("if not errorlevel 1 goto ok\r\n");
        s.append("set /a tries+=1\r\n");
        s.append("if %tries% geq 60 goto end\r\n");
        s.append("goto retry\r\n");
        s.append(":ok\r\n");
        s.append("del /f /q \"").append(newJar).append("\" >nul 2>&1\r\n");
        s.append("start \"\" /d \"").append(appJar.getParent()).append("\" \"")
                .append(javaw).append("\" -jar \"").append(appJar).append("\"\r\n");
        s.append(":end\r\n");
        s.append("(goto) 2>nul & del \"%~f0\"\r\n");

        Path script = Files.createTempFile("hoodly-update-", ".bat");
        Files.writeString(script, s.toString());
        return script;
    }

    private static Path writeUnixScript(Path newJar, Path appJar, Path java) throws IOException {
        StringBuilder s = new StringBuilder();
        s.append("#!/bin/sh\n");
        s.append("sleep 2\n");
        s.append("cp \"").append(newJar).append("\" \"").append(appJar).append("\"\n");
        s.append("rm -f \"").append(newJar).append("\"\n");
        s.append("cd \"").append(appJar.getParent()).append("\"\n");
        s.append("nohup \"").append(java).append("\" -jar \"").append(appJar).append("\" >/dev/null 2>&1 &\n");
        s.append("rm -- \"$0\"\n");

        Path script = Files.createTempFile("hoodly-update-", ".sh");
        Files.writeString(script, s.toString());
        script.toFile().setExecutable(true);
        return script;
    }

    static boolean isNewer(String remote, String current) {
        int[] r = parseVersion(remote);
        int[] c = parseVersion(current);
        for (int i = 0; i < Math.max(r.length, c.length); i++) {
            int a = i < r.length ? r[i] : 0;
            int b = i < c.length ? c[i] : 0;
            if (a != b) {
                return a > b;
            }
        }
        return false;
    }

    static int[] parseVersion(String version) {
        String cleaned = version.trim();
        if (cleaned.startsWith("v") || cleaned.startsWith("V")) {
            cleaned = cleaned.substring(1);
        }
        int dash = cleaned.indexOf('-');
        if (dash >= 0) {
            cleaned = cleaned.substring(0, dash);
        }
        String[] parts = cleaned.split("\\.");
        int[] numbers = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            String digits = parts[i].replaceAll("[^0-9].*$", "");
            numbers[i] = digits.isEmpty() ? 0 : Integer.parseInt(digits);
        }
        return numbers;
    }
}
