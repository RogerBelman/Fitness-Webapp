package com.example.workouttracker.dto;

import java.time.Instant;
import com.example.workouttracker.entity.TrainingType;

public record ExerciseResponse(
		Long id,
		String name,
		String muscleGroup,
		String category,
		String instructions,
		TrainingType trainingType,
		Instant createdAt,
		Instant updatedAt) {
}
