package com.example.workouttracker.dto;

import jakarta.validation.constraints.Positive;

public record UpdateWorkoutExerciseRequest(
		@Positive(message = "exerciseOrder must be greater than 0.")
		Integer exerciseOrder) {
}
