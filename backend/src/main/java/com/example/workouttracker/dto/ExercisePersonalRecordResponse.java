package com.example.workouttracker.dto;

public record ExercisePersonalRecordResponse(
		Long exerciseId,
		String exerciseName,
		PersonalRecordResponse personalRecord) {
}
