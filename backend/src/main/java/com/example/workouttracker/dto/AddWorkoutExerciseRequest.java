package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddWorkoutExerciseRequest(
		@NotNull(message = "exerciseId is required.")
		@Positive(message = "exerciseId must be greater than 0.")
		Long exerciseId,

		@Positive(message = "exerciseOrder must be greater than 0.")
		Integer exerciseOrder) {
}
