package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AddWorkoutExerciseRequest(
		@NotNull(message = "exerciseId is required.")
		@Positive(message = "exerciseId must be greater than 0.")
		Long exerciseId,

		@Positive(message = "exerciseOrder must be greater than 0.")
		Integer exerciseOrder,

		@Size(max = 500, message = "notes must be 500 characters or less.")
		String notes) {
}
