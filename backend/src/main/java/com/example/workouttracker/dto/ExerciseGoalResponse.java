package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.example.workouttracker.entity.GoalMetric;

public record ExerciseGoalResponse(
		Long id,
		ExerciseResponse exercise,
		GoalMetric metric,
		BigDecimal targetValue,
		BigDecimal currentValue,
		boolean achieved,
		Instant createdAt,
		Instant updatedAt) {
}
