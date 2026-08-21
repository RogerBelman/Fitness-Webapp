package com.example.workouttracker.dto;

public record AddWorkoutExerciseRequest(
		Long exerciseId,
		Integer exerciseOrder,
		String notes) {
}
