package com.example.workouttracker.dto;

import java.util.List;

public record ExerciseProgressResponse(
		Long exerciseId,
		String exerciseName,
		List<ExerciseProgressPointResponse> history) {
}
