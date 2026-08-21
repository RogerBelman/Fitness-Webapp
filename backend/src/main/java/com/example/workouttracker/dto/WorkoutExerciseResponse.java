package com.example.workouttracker.dto;

import java.time.Instant;
import java.util.List;

public record WorkoutExerciseResponse(
		Long id,
		Integer exerciseOrder,
		ExerciseResponse exercise,
		String notes,
		List<SetEntryResponse> sets,
		Instant createdAt,
		Instant updatedAt) {
}
