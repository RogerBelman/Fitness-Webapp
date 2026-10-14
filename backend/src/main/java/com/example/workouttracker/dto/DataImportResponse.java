package com.example.workouttracker.dto;

public record DataImportResponse(
		int exercises,
		int workouts,
		int templates,
		int goals) { }
