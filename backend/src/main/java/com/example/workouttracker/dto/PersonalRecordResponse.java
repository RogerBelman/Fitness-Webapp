package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PersonalRecordResponse(
		BigDecimal weight,
		Integer reps,
		LocalDate workoutDate,
		Long workoutId) {
}
