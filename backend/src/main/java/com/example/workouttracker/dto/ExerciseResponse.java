package com.example.workouttracker.dto;

import java.time.Instant;
import java.math.BigDecimal;
import com.example.workouttracker.entity.MovementType;
import com.example.workouttracker.entity.TrainingType;

public record ExerciseResponse(
		Long id,
		String name,
		String muscleGroup,
		String category,
		String instructions,
		TrainingType trainingType,
		MovementType movementType,
		Integer repRangeMin,
		Integer repRangeMax,
		BigDecimal durationMinMinutes,
		BigDecimal durationMaxMinutes,
		Integer targetWorkingSets,
		String muscleFocus,
		Instant createdAt,
		Instant updatedAt) {
}
