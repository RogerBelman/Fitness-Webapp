package com.example.workouttracker.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.DataBackup;
import com.example.workouttracker.dto.DataImportResponse;
import com.example.workouttracker.service.DataBackupService;

@RestController
@RequestMapping("/api/data-backup")
public class DataBackupController {

	private final DataBackupService dataBackupService;

	public DataBackupController(DataBackupService dataBackupService) {
		this.dataBackupService = dataBackupService;
	}

	@GetMapping
	public ResponseEntity<DataBackup> exportBackup() {
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=workout-tracker-backup.json")
				.body(dataBackupService.exportBackup());
	}

	@PutMapping
	public DataImportResponse importBackup(@RequestBody DataBackup backup) {
		return dataBackupService.importBackup(backup);
	}
}
