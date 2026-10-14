package com.example.workouttracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.StartTemplateWorkoutRequest;
import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutTemplateRequest;
import com.example.workouttracker.dto.WorkoutTemplateResponse;
import com.example.workouttracker.service.WorkoutTemplateService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workout-templates")
public class WorkoutTemplateController {

	private final WorkoutTemplateService templateService;

	public WorkoutTemplateController(WorkoutTemplateService templateService) {
		this.templateService = templateService;
	}

	@GetMapping
	public List<WorkoutTemplateResponse> findAll() {
		return templateService.findAll();
	}

	@PostMapping
	public ResponseEntity<WorkoutTemplateResponse> create(
			@Valid @RequestBody WorkoutTemplateRequest request) {
		WorkoutTemplateResponse response = templateService.create(request);
		return ResponseEntity.created(URI.create("/api/workout-templates/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public WorkoutTemplateResponse update(
			@PathVariable Long id,
			@Valid @RequestBody WorkoutTemplateRequest request) {
		return templateService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		templateService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/{id}/workouts")
	public ResponseEntity<WorkoutDetailResponse> startWorkout(
			@PathVariable Long id,
			@Valid @RequestBody StartTemplateWorkoutRequest request) {
		WorkoutDetailResponse response = templateService.startWorkout(id, request);
		return ResponseEntity.created(URI.create("/api/workouts/" + response.id())).body(response);
	}

	@PostMapping("/{id}/exercises")
	public ResponseEntity<WorkoutTemplateResponse> addExercise(
			@PathVariable Long id,
			@Valid @RequestBody AddWorkoutExerciseRequest request) {
		WorkoutTemplateResponse response = templateService.addExercise(id, request);
		return ResponseEntity.created(URI.create("/api/workout-templates/" + id)).body(response);
	}
}
