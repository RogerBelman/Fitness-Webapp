package com.example.workouttracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.SetEntryRequest;
import com.example.workouttracker.dto.SetEntryResponse;
import com.example.workouttracker.service.WorkoutService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sets")
public class SetEntryController {
	private final WorkoutService workoutService;

	public SetEntryController(WorkoutService workoutService) {
		this.workoutService = workoutService;
	}

	@PutMapping("/{id}")
	public SetEntryResponse update(@PathVariable Long id, @Valid @RequestBody SetEntryRequest request) {
		return workoutService.updateSet(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		workoutService.deleteSet(id);
		return ResponseEntity.noContent().build();
	}
}
