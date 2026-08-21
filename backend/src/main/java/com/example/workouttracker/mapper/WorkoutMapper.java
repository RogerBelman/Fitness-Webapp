package com.example.workouttracker.mapper;

import java.math.BigDecimal;
import java.util.List;

import com.example.workouttracker.dto.SetEntryResponse;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutExerciseResponse;
import com.example.workouttracker.dto.WorkoutResponse;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;

public final class WorkoutMapper {

	private WorkoutMapper() {
	}

	public static WorkoutResponse toResponse(Workout workout) {
		return new WorkoutResponse(
				workout.getId(),
				workout.getWorkoutDate(),
				workout.getTitle(),
				workout.getNotes(),
				totalSets(workout),
				totalVolume(workout),
				workout.getCreatedAt(),
				workout.getUpdatedAt());
	}

	public static WorkoutDetailResponse toDetailResponse(Workout workout) {
		List<WorkoutExerciseResponse> exercises = workout.getWorkoutExercises().stream()
				.map(WorkoutMapper::toWorkoutExerciseResponse)
				.toList();

		return new WorkoutDetailResponse(
				workout.getId(),
				workout.getWorkoutDate(),
				workout.getTitle(),
				workout.getNotes(),
				totalSets(workout),
				totalVolume(workout),
				exercises,
				workout.getCreatedAt(),
				workout.getUpdatedAt());
	}

	public static WorkoutExerciseResponse toWorkoutExerciseResponse(WorkoutExercise workoutExercise) {
		List<SetEntryResponse> sets = workoutExercise.getSetEntries().stream()
				.map(WorkoutMapper::toSetEntryResponse)
				.toList();

		return new WorkoutExerciseResponse(
				workoutExercise.getId(),
				workoutExercise.getExerciseOrder(),
				ExerciseMapper.toResponse(workoutExercise.getExercise()),
				workoutExercise.getNotes(),
				sets,
				workoutExercise.getCreatedAt(),
				workoutExercise.getUpdatedAt());
	}

	public static SetEntryResponse toSetEntryResponse(SetEntry setEntry) {
		return new SetEntryResponse(
				setEntry.getId(),
				setEntry.getSetNumber(),
				setEntry.getReps(),
				setEntry.getWeight(),
				setEntry.getCreatedAt(),
				setEntry.getUpdatedAt());
	}

	private static int totalSets(Workout workout) {
		return workout.getWorkoutExercises().stream()
				.mapToInt(workoutExercise -> workoutExercise.getSetEntries().size())
				.sum();
	}

	private static BigDecimal totalVolume(Workout workout) {
		return workout.getWorkoutExercises().stream()
				.flatMap(workoutExercise -> workoutExercise.getSetEntries().stream())
				.map(setEntry -> setEntry.getWeight().multiply(BigDecimal.valueOf(setEntry.getReps())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
	}
}
