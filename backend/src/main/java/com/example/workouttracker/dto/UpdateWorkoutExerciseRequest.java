package com.example.workouttracker.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateWorkoutExerciseRequest(
		@Positive(message = "exerciseOrder must be greater than 0.")
		Integer exerciseOrder,

		@Size(max = 500, message = "notes must be 500 characters or less.")
		String notes) {
}
