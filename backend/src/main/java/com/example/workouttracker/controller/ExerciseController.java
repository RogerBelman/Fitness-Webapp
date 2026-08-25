package com.example.workouttracker.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.ExerciseResponse;
import com.example.workouttracker.service.ExerciseService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

	private final ExerciseService exerciseService;

	public ExerciseController(ExerciseService exerciseService) {
		this.exerciseService = exerciseService;
	}

	@GetMapping
	public List<ExerciseResponse> findAll(
			@RequestParam Optional<String> muscleGroup,
			@RequestParam Optional<String> category) {
		return exerciseService.findAll(muscleGroup, category);
	}

	@GetMapping("/{id}")
	public ExerciseResponse findById(@PathVariable Long id) {
		return exerciseService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ExerciseResponse> create(@Valid @RequestBody ExerciseRequest request) {
		ExerciseResponse response = exerciseService.create(request);
		return ResponseEntity
				.created(URI.create("/api/exercises/" + response.id()))
				.body(response);
	}

	@PutMapping("/{id}")
	public ExerciseResponse update(@PathVariable Long id, @Valid @RequestBody ExerciseRequest request) {
		return exerciseService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		exerciseService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
