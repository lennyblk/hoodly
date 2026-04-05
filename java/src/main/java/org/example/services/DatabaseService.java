package org.example.services;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseService {

    private static final String DB_URL = "jdbc:sqlite:hoodly_local.db";
    private static boolean initialized = false;

    public static Connection getConnection() {
        try {
            Connection conn = DriverManager.getConnection(DB_URL);
            if (!initialized) {
                createTables(conn);
                initialized = true;
            }
            return conn;
        } catch (SQLException e) {
            System.err.println("Failed to connect to SQLite database: " + e.getMessage());
            return null;
        }
    }

    private static void createTables(Connection conn) {
        String incidentsTable = "CREATE TABLE IF NOT EXISTS incidents (" +
                "id TEXT PRIMARY KEY," +
                "title TEXT NOT NULL," +
                "description TEXT," +
                "category TEXT," +
                "status TEXT," +
                "reported_by TEXT," +
                "neighborhood_id TEXT," +
                "reported_at TEXT," +
                "synced_at TEXT," +
                "is_dirty INTEGER DEFAULT 0" +
                ");";

        String statsTable = "CREATE TABLE IF NOT EXISTS status_participations (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "user_id TEXT," +
                "event_id TEXT," +
                "status TEXT" +
                ");";

        try (Statement stmt = conn.createStatement()) {
            stmt.execute(incidentsTable);
            stmt.execute(statsTable);
        } catch (SQLException e) {
            System.err.println("Error creating tables: " + e.getMessage());
        }
    }
}
