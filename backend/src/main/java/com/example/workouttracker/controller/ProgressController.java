package com.example.workouttracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.ExercisePersonalRecordResponse;
import com.example.workouttracker.service.ProgressService;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

	private final ProgressService progressService;

	public ProgressController(ProgressService progressService) {
		this.progressService = progressService;
	}

	@GetMapping("/exercises/{exerciseId}/personal-record")
	public ExercisePersonalRecordResponse findPersonalRecord(@PathVariable Long exerciseId) {
		return progressService.findPersonalRecord(exerciseId);
	}
}
