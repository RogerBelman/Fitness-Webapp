package com.example.workouttracker.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record StartTemplateWorkoutRequest(
		@NotNull(message = "workoutDate is required.")
		@PastOrPresent(message = "workoutDate cannot be in the future.")
		LocalDate workoutDate,

		@Size(max = 120, message = "title must be 120 characters or less.")
		String title,

		@Size(max = 500, message = "notes must be 500 characters or less.")
		String notes) {
}
