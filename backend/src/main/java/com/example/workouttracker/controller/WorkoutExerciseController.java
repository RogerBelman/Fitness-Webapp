package com.example.workouttracker.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.SetEntryRequest;
import com.example.workouttracker.dto.SetEntryResponse;
import com.example.workouttracker.dto.UpdateWorkoutExerciseRequest;
import com.example.workouttracker.dto.WorkoutExerciseResponse;
import com.example.workouttracker.service.WorkoutService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workout-exercises")
public class WorkoutExerciseController {

	private final WorkoutService workoutService;

	public WorkoutExerciseController(WorkoutService workoutService) {
		this.workoutService = workoutService;
	}

	@PostMapping("/{id}/sets")
	public ResponseEntity<SetEntryResponse> addSet(
			@PathVariable Long id,
			@Valid @RequestBody SetEntryRequest request) {
		SetEntryResponse response = workoutService.addSet(id, request);
		return ResponseEntity
				.created(URI.create("/api/workout-exercises/" + id + "/sets/" + response.id()))
				.body(response);
	}

	@PutMapping("/{id}")
	public WorkoutExerciseResponse update(
			@PathVariable Long id, @Valid @RequestBody UpdateWorkoutExerciseRequest request) {
		return workoutService.updateExercise(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		workoutService.deleteExercise(id);
		return ResponseEntity.noContent().build();
	}
}
