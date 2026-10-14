package com.example.workouttracker.dto;

import java.math.BigDecimal;

import com.example.workouttracker.entity.GoalMetric;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record ExerciseGoalRequest(
		@NotNull(message = "exerciseId is required.")
		Long exerciseId,
		@NotNull(message = "metric is required.")
		GoalMetric metric,
		@NotNull(message = "targetValue is required.")
		@DecimalMin(value = "0.01", message = "targetValue must be greater than 0.")
		@DecimalMax(value = "99999999.99", message = "targetValue must be 99999999.99 or less.")
		@Digits(integer = 8, fraction = 2, message = "targetValue must have at most 8 integer digits and 2 decimal places.")
		BigDecimal targetValue) {
}
