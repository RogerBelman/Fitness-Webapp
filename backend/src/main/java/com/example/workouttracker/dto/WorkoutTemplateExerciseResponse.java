package com.example.workouttracker.dto;

public record WorkoutTemplateExerciseResponse(
		Long id,
		Integer exerciseOrder,
		ExerciseResponse exercise) {
}
