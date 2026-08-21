package com.example.workouttracker.dto;

import java.time.Instant;

public record ExerciseResponse(
		Long id,
		String name,
		String muscleGroup,
		String category,
		Instant createdAt,
		Instant updatedAt) {
}
