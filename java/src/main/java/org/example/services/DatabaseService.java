package org.example.services;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseService {

    private static final String DB_URL = "jdbc:sqlite:hoodly_local.db";
    private static Connection connection;

    public static Connection getConnection() {
        if (connection == null) {
            try {
                // Initialize the database connection
                connection = DriverManager.getConnection(DB_URL);
                createTables();
            } catch (SQLException e) {
                System.err.println("Failed to connect to SQLite database: " + e.getMessage());
            }
        }
        return connection;
    }

    private static void createTables() {
        String incidentsTable = "CREATE TABLE IF NOT EXISTS incidents (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "title TEXT NOT NULL," +
                "description TEXT," +
                "status TEXT," +
                "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                ");";

        String statsTable = "CREATE TABLE IF NOT EXISTS status_participations (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "user_id TEXT," +
                "event_id TEXT," +
                "status TEXT" +
                ");";

        try (Statement stmt = connection.createStatement()) {
            stmt.execute(incidentsTable);
            stmt.execute(statsTable);
        } catch (SQLException e) {
            System.err.println("Error creating tables: " + e.getMessage());
        }
    }
}
