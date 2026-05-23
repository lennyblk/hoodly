package org.example.controllers;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.TextArea;
import javafx.scene.control.cell.PropertyValueFactory;
import org.example.Main;
import org.example.models.Incident;
import org.example.services.IncidentRepository;

import java.io.IOException;
import java.util.UUID;
import java.time.Instant;

public class IncidentsController {

    @FXML private TableView<Incident> incidentsTable;
    @FXML private TableColumn<Incident, String> titleCol;
    @FXML private TableColumn<Incident, String> categoryCol;
    @FXML private TableColumn<Incident, String> statusCol;
    @FXML private TableColumn<Incident, Integer> dirtyCol;

    @FXML private TextField titleField;
    @FXML private TextField categoryField;
    @FXML private TextField descField;
    @FXML private Label detailReportedBy;
    @FXML private Label detailReportedAt;
    @FXML private Label detailNeighborhood;
    @FXML private Label detailId;
    @FXML private TextArea detailDescription;

    @FXML private Label infoLabel;
    @FXML private Label managementInfoLabel;
    @FXML private javafx.scene.control.Button resolveBtn;

    private IncidentRepository repo;
    private ObservableList<Incident> incidents;

    @FXML
    public void initialize() {
        repo = new IncidentRepository();
        titleCol.setCellValueFactory(new PropertyValueFactory<>("title"));
        categoryCol.setCellValueFactory(new PropertyValueFactory<>("category"));
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));
        dirtyCol.setCellValueFactory(new PropertyValueFactory<>("isDirty"));

        incidentsTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSel, newSel) -> {
            boolean hasSelection = newSel != null;
            if (hasSelection) {
                boolean isAlreadyResolved = "resolved".equalsIgnoreCase(newSel.getStatus());
                resolveBtn.setDisable(isAlreadyResolved);
                managementInfoLabel.setText(isAlreadyResolved ? "L'incident est déjà résolu." : "");

                detailReportedBy.setText(newSel.getReportedBy());
                detailReportedAt.setText(newSel.getReportedAt());
                detailNeighborhood.setText(newSel.getNeighborhoodId());
                detailId.setText(newSel.getId());
                detailDescription.setText(newSel.getDescription());
            } else {
                resolveBtn.setDisable(true);
                managementInfoLabel.setText("");
                detailReportedBy.setText("-");
                detailReportedAt.setText("-");
                detailNeighborhood.setText("-");
                detailId.setText("-");
                detailDescription.setText("");
            }
        });

        loadIncidents();
    }

    private void loadIncidents() {
        incidents = FXCollections.observableArrayList(repo.getAllIncidents());
        incidentsTable.setItems(incidents);
    }

    @FXML
    private void handleResolve() {
        Incident selected = incidentsTable.getSelectionModel().getSelectedItem();
        if (selected != null) {
            selected.setStatus("resolved");
            selected.setIsDirty(1);
            repo.insertOrUpdateIncident(selected);

            managementInfoLabel.setText("Incident marqué comme résolu (Attente Synchro)");
            managementInfoLabel.setStyle("-fx-text-fill: green;");
            resolveBtn.setDisable(true);
            loadIncidents();
        }
    }

    @FXML
    private void handleAddIncident() {
        if (titleField.getText().isEmpty() || categoryField.getText().isEmpty()) {
            infoLabel.setText("Veuillez remplir le titre et la catégorie.");
            return;
        }

        String userId = org.example.services.AuthService.getUserId();
        Incident req = new Incident(
                UUID.randomUUID().toString(),
                titleField.getText(),
                descField.getText(),
                categoryField.getText(),
                "open",
                userId != null ? userId : "offline-user",
                "local",
                Instant.now().toString(),
                null,
                1
        );

        repo.insertOrUpdateIncident(req);
        infoLabel.setText("Incident ajouté (Mode Local - Non synchronisé)");

        titleField.clear();
        categoryField.clear();
        descField.clear();
        loadIncidents();
    }

    @FXML
    private void goBack() {
        try {
            Main.setRoot("views/dashboard.fxml");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleToggleTheme() {
        Main.toggleTheme();
    }
}
