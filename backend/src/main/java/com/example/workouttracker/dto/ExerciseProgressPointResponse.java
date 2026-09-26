package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExerciseProgressPointResponse(
		Long workoutId,
		LocalDate workoutDate,
		int totalSets,
		BigDecimal maxWeight,
		BigDecimal totalVolume) {
}
