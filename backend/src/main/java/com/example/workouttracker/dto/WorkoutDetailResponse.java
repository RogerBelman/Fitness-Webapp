package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record WorkoutDetailResponse(
		Long id,
		LocalDate workoutDate,
		String title,
		String notes,
		Integer totalSets,
		BigDecimal totalVolume,
		List<WorkoutExerciseResponse> exercises,
		Instant createdAt,
		Instant updatedAt) {
}
