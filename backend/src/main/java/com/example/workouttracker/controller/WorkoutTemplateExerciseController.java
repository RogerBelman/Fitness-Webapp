package com.example.workouttracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.UpdateWorkoutExerciseRequest;
import com.example.workouttracker.dto.WorkoutTemplateResponse;
import com.example.workouttracker.service.WorkoutTemplateService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workout-template-exercises")
public class WorkoutTemplateExerciseController {

	private final WorkoutTemplateService templateService;

	public WorkoutTemplateExerciseController(WorkoutTemplateService templateService) {
		this.templateService = templateService;
	}

	@PutMapping("/{id}")
	public WorkoutTemplateResponse update(
			@PathVariable Long id,
			@Valid @RequestBody UpdateWorkoutExerciseRequest request) {
		return templateService.updateExercise(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		templateService.deleteExercise(id);
		return ResponseEntity.noContent().build();
	}
}
