package com.example.workouttracker.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.ExerciseResponse;
import com.example.workouttracker.dto.WorkoutExerciseResponse;

@Service
public class WorkoutExerciseCreationService {
	private final ExerciseService exerciseService;
	private final WorkoutService workoutService;

	public WorkoutExerciseCreationService(ExerciseService exerciseService, WorkoutService workoutService) {
		this.exerciseService = exerciseService;
		this.workoutService = workoutService;
	}

	@Transactional
	public WorkoutExerciseResponse createAndAdd(Long workoutId, ExerciseRequest request) {
		workoutService.findById(workoutId);
		ExerciseResponse exercise = exerciseService.create(request);
		return workoutService.addExercise(workoutId, new AddWorkoutExerciseRequest(exercise.id(), null, null));
	}
}
