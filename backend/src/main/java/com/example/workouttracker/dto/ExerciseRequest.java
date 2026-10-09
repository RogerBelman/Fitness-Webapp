package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.example.workouttracker.entity.TrainingType;

public record ExerciseRequest(
		@NotBlank(message = "name is required.")
		@Size(max = 120, message = "name must be 120 characters or less.")
		String name,

		@Size(max = 80, message = "muscleGroup must be 80 characters or less.")
		String muscleGroup,

		@Size(max = 80, message = "category must be 80 characters or less.")
		String category,

		@Size(max = 500, message = "instructions must be 500 characters or less.")
		String instructions,
		TrainingType trainingType) {
}
