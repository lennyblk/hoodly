package org.example.controllers;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;
import org.example.Main;
import org.example.models.Incident;
import org.example.services.IncidentRepository;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StatisticsController {

    @FXML private PieChart statusChart;
    @FXML private BarChart<String, Number> categoryChart;

    private IncidentRepository repo;

    @FXML
    public void initialize() {
        repo = new IncidentRepository();
        loadStatistics();
    }

    private void loadStatistics() {
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);

        List<Incident> recentIncidents = repo.getAllIncidents().stream()
                .filter(inc -> {
                    try {
                        if (inc.getReportedAt() != null) {
                            Instant reportedAt = Instant.parse(inc.getReportedAt());
                            return reportedAt.isAfter(oneWeekAgo);
                        }
                    } catch (Exception e) {
                        return false;
                    }
                    return false;
                })
                .collect(Collectors.toList());

        Map<String, Long> statusCount = recentIncidents.stream()
                .collect(Collectors.groupingBy(
                        inc -> inc.getStatus() != null ? inc.getStatus() : "Inconnu",
                        Collectors.counting()
                ));

        ObservableList<PieChart.Data> pieData = FXCollections.observableArrayList();
        statusCount.forEach((status, count) -> {
            String label = "resolved".equalsIgnoreCase(status) ? "Résolu" : ("open".equalsIgnoreCase(status) ? "Ouvert" : status);
            pieData.add(new PieChart.Data(label + " (" + count + ")", count));
        });
        statusChart.setData(pieData);

        Map<String, Long> categoryCount = recentIncidents.stream()
                .collect(Collectors.groupingBy(
                        inc -> (inc.getCategory() != null && !inc.getCategory().trim().isEmpty()) ? inc.getCategory() : "Non spécifié",
                        Collectors.counting()
                ));

        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Thèmes de la semaine");
        categoryCount.forEach((cat, count) -> {
            series.getData().add(new XYChart.Data<>(cat, count));
        });
        categoryChart.getData().clear();
        categoryChart.getData().add(series);
    }

    @FXML
    private void goBack() {
        try {
            Main.setRoot("views/dashboard.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}