package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.mapper.WorkoutMapper;

class WorkoutMapperTests {

	@Test
	void calculatesTotalWorkoutVolume() {
		Workout workout = new Workout(LocalDate.of(2026, 8, 25), "Pull Day", null);
		Exercise exercise = new Exercise("Deadlift", "Back", "Barbell");
		WorkoutExercise workoutExercise = new WorkoutExercise(workout, exercise, 1);
		new SetEntry(workoutExercise, 1, 5, new BigDecimal("225.00"));
		new SetEntry(workoutExercise, 2, 3, new BigDecimal("245.00"));

		WorkoutDetailResponse response = WorkoutMapper.toDetailResponse(workout);

		assertThat(response.totalSets()).isEqualTo(2);
		assertThat(response.totalVolume()).isEqualByComparingTo(new BigDecimal("1860.00"));
	}
}
