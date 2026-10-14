package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.example.workouttracker.entity.TrainingType;

public record WorkoutResponse(
		Long id,
		LocalDate workoutDate,
		String title,
		String notes,
		Integer totalSets,
		BigDecimal totalVolume,
		BigDecimal totalCardioMinutes,
		List<String> exerciseNames,
		List<TrainingType> trainingTypes,
		Instant createdAt,
		Instant updatedAt) {
}
