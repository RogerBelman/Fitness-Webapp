package com.example.workouttracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutExerciseResponse;
import com.example.workouttracker.dto.WorkoutRequest;
import com.example.workouttracker.dto.WorkoutResponse;
import com.example.workouttracker.service.WorkoutService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

	private final WorkoutService workoutService;

	public WorkoutController(WorkoutService workoutService) {
		this.workoutService = workoutService;
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

	@PostMapping("/{id}/exercises")
	public ResponseEntity<WorkoutExerciseResponse> addExercise(
			@PathVariable Long id,
			@Valid @RequestBody AddWorkoutExerciseRequest request) {
		WorkoutExerciseResponse response = workoutService.addExercise(id, request);
		return ResponseEntity
				.created(URI.create("/api/workout-exercises/" + response.id()))
				.body(response);
	}
}
