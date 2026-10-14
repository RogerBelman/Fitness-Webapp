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

import com.example.workouttracker.dto.ExerciseGoalRequest;
import com.example.workouttracker.dto.ExerciseGoalResponse;
import com.example.workouttracker.service.ExerciseGoalService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/goals")
public class ExerciseGoalController {

	private final ExerciseGoalService goalService;

	public ExerciseGoalController(ExerciseGoalService goalService) {
		this.goalService = goalService;
	}

	@GetMapping
	public List<ExerciseGoalResponse> findAll() {
		return goalService.findAll();
	}

	@PostMapping
	public ResponseEntity<ExerciseGoalResponse> create(@Valid @RequestBody ExerciseGoalRequest request) {
		ExerciseGoalResponse response = goalService.create(request);
		return ResponseEntity.created(URI.create("/api/goals/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public ExerciseGoalResponse update(@PathVariable Long id, @Valid @RequestBody ExerciseGoalRequest request) {
		return goalService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		goalService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
