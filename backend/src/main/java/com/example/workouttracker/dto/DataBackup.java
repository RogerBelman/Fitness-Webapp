package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.example.workouttracker.entity.GoalMetric;
import com.example.workouttracker.entity.MovementType;
import com.example.workouttracker.entity.TrainingType;

public record DataBackup(
		Integer version,
		Instant exportedAt,
		List<ExerciseData> exercises,
		List<WorkoutData> workouts,
		List<TemplateData> templates,
		List<GoalData> goals) {

	public record ExerciseData(
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
			String muscleFocus) { }

	public record WorkoutData(
			LocalDate workoutDate,
			String title,
			String notes,
			List<WorkoutExerciseData> exercises) { }

	public record WorkoutExerciseData(
			String exerciseName,
			Integer exerciseOrder,
			List<SetData> sets,
			List<CardioData> cardioEntries) { }

	public record SetData(Integer setNumber, Integer reps, BigDecimal weight) { }

	public record CardioData(BigDecimal durationMinutes, BigDecimal level) { }

	public record TemplateData(
			String name,
			String notes,
			List<TemplateExerciseData> exercises) { }

	public record TemplateExerciseData(String exerciseName, Integer exerciseOrder) { }

	public record GoalData(String exerciseName, GoalMetric metric, BigDecimal targetValue) { }
}
