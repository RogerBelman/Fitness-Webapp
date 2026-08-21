package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record WorkoutResponse(
		Long id,
		LocalDate workoutDate,
		String title,
		String notes,
		Integer totalSets,
		BigDecimal totalVolume,
		Instant createdAt,
		Instant updatedAt) {
}
