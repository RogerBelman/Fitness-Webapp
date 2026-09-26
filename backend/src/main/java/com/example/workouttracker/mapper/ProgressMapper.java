package com.example.workouttracker.mapper;

import com.example.workouttracker.dto.ExercisePersonalRecordResponse;
import com.example.workouttracker.dto.PersonalRecordResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;

public final class ProgressMapper {

	private ProgressMapper() {
	}

	public static ExercisePersonalRecordResponse toPersonalRecordResponse(
			Exercise exercise,
			SetEntry setEntry) {
		PersonalRecordResponse personalRecord = setEntry == null
				? null
				: new PersonalRecordResponse(
						setEntry.getWeight(),
						setEntry.getReps(),
						setEntry.getWorkoutExercise().getWorkout().getWorkoutDate(),
						setEntry.getWorkoutExercise().getWorkout().getId());

		return new ExercisePersonalRecordResponse(
				exercise.getId(),
				exercise.getName(),
				personalRecord);
	}
}
