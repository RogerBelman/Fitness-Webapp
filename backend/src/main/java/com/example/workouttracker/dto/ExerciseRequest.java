package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExerciseRequest(
		@NotBlank(message = "name is required.")
		@Size(max = 120, message = "name must be 120 characters or less.")
		String name,

		@NotBlank(message = "muscleGroup is required.")
		@Size(max = 80, message = "muscleGroup must be 80 characters or less.")
		String muscleGroup,

		@NotBlank(message = "category is required.")
		@Size(max = 80, message = "category must be 80 characters or less.")
		String category) {
}
