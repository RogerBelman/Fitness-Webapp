package com.example.workouttracker.dto;

import java.time.Instant;
import java.util.List;

public record WorkoutTemplateResponse(
		Long id,
		String name,
		String notes,
		List<WorkoutTemplateExerciseResponse> exercises,
		Instant createdAt,
		Instant updatedAt) {
}
