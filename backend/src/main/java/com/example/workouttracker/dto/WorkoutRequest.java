package com.example.workouttracker.dto;

import java.time.LocalDate;

public record WorkoutRequest(
		LocalDate workoutDate,
		String title,
		String notes) {
}
