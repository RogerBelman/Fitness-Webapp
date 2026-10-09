package com.example.workouttracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutExerciseResponse;
import com.example.workouttracker.dto.WorkoutRequest;
import com.example.workouttracker.dto.WorkoutResponse;
import com.example.workouttracker.service.WorkoutService;
import com.example.workouttracker.service.WorkoutExerciseCreationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

	private final WorkoutService workoutService;
	private final WorkoutExerciseCreationService exerciseCreationService;

	public WorkoutController(WorkoutService workoutService, WorkoutExerciseCreationService exerciseCreationService) {
		this.workoutService = workoutService;
		this.exerciseCreationService = exerciseCreationService;
	}

	@PostMapping
	public ResponseEntity<WorkoutResponse> create(@Valid @RequestBody WorkoutRequest request) {
		WorkoutResponse response = workoutService.create(request);
		return ResponseEntity
				.created(URI.create("/api/workouts/" + response.id()))
				.body(response);
	}

	@GetMapping
	public List<WorkoutResponse> findAll() {
		return workoutService.findAll();
	}

	@GetMapping("/{id}")
	public WorkoutDetailResponse findById(@PathVariable Long id) {
		return workoutService.findById(id);
	}

	@PutMapping("/{id}")
	public WorkoutResponse update(@PathVariable Long id, @Valid @RequestBody WorkoutRequest request) {
		return workoutService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		workoutService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/{id}/exercises")
	public ResponseEntity<WorkoutExerciseResponse> addExercise(
			@PathVariable Long id,
			@Valid @RequestBody AddWorkoutExerciseRequest request) {
		WorkoutExerciseResponse response = workoutService.addExercise(id, request);
		return ResponseEntity
				.created(URI.create("/api/workout-exercises/" + response.id()))
				.body(response);
	}

	@PostMapping("/{id}/exercises/new")
	public ResponseEntity<WorkoutExerciseResponse> createAndAddExercise(
			@PathVariable Long id, @Valid @RequestBody ExerciseRequest request) {
		WorkoutExerciseResponse response = exerciseCreationService.createAndAdd(id, request);
		return ResponseEntity.created(URI.create("/api/workout-exercises/" + response.id())).body(response);
	}
}
