package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WorkoutTemplateRequest(
		@NotBlank(message = "name is required.")
		@Size(max = 120, message = "name must be 120 characters or less.")
		String name,
		@Size(max = 500, message = "notes must be 500 characters or less.")
		String notes) {
}
