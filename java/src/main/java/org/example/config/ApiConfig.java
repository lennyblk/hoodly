package org.example.config;


public final class ApiConfig {

    private static final String DEFAULT_API_URL = "https://api-hoodly.lennyblk.dev";

    public static final String API_BASE = resolve();

    private ApiConfig() {
    }

    private static String resolve() {
        String prop = System.getProperty("hoodly.api");
        if (prop != null && !prop.isBlank()) return stripTrailingSlash(prop);
        String env = System.getenv("HOODLY_API_URL");
        if (env != null && !env.isBlank()) return stripTrailingSlash(env);
        return DEFAULT_API_URL;
    }

    private static String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
