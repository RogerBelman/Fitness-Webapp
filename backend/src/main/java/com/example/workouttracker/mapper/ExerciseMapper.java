package com.example.workouttracker.mapper;

import com.example.workouttracker.dto.ExerciseResponse;
import com.example.workouttracker.entity.Exercise;

public final class ExerciseMapper {

	private ExerciseMapper() {
	}

	public static ExerciseResponse toResponse(Exercise exercise) {
		return new ExerciseResponse(
				exercise.getId(),
				exercise.getName(),
				exercise.getMuscleGroup(),
				exercise.getCategory(),
				exercise.getInstructions(),
				exercise.getTrainingType(),
				exercise.getCreatedAt(),
				exercise.getUpdatedAt());
	}
}
