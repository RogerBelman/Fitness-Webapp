package com.example.workouttracker.dto;

public record ExerciseRequest(
		String name,
		String muscleGroup,
		String category) {
}
