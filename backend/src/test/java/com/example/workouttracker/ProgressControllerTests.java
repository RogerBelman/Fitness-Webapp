package com.example.workouttracker;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProgressControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ExerciseRepository exerciseRepository;

	@Autowired
	private WorkoutRepository workoutRepository;

	@Autowired
	private WorkoutExerciseRepository workoutExerciseRepository;

	@Autowired
	private SetEntryRepository setEntryRepository;

	@Test
	void returnsHeaviestSetAsPersonalRecord() throws Exception {
		Exercise exercise = exerciseRepository.save(
				new Exercise(unique("Bench Press"), "Chest", "Strength"));
		Workout workout = workoutRepository.save(
				new Workout(LocalDate.of(2026, 9, 25), "Push Day", null));
		WorkoutExercise workoutExercise = workoutExerciseRepository.save(
				new WorkoutExercise(workout, exercise, 1));
		setEntryRepository.save(new SetEntry(workoutExercise, 1, 10, new BigDecimal("135.00")));
		setEntryRepository.save(new SetEntry(workoutExercise, 2, 5, new BigDecimal("185.00")));

		mockMvc.perform(get("/api/progress/exercises/{exerciseId}/personal-record", exercise.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exerciseId").value(exercise.getId()))
				.andExpect(jsonPath("$.exerciseName").value(exercise.getName()))
				.andExpect(jsonPath("$.personalRecord.weight").value(185.00))
				.andExpect(jsonPath("$.personalRecord.reps").value(5))
				.andExpect(jsonPath("$.personalRecord.workoutDate").value("2026-09-25"))
				.andExpect(jsonPath("$.personalRecord.workoutId").value(workout.getId()));
	}

	@Test
	void returnsNullRecordWhenExerciseHasNoSets() throws Exception {
		Exercise exercise = exerciseRepository.save(
				new Exercise(unique("Overhead Press"), "Shoulders", "Strength"));

		mockMvc.perform(get("/api/progress/exercises/{exerciseId}/personal-record", exercise.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exerciseId").value(exercise.getId()))
				.andExpect(jsonPath("$.personalRecord").doesNotExist());
	}

	@Test
	void returnsProgressHistoryOldestFirst() throws Exception {
		Exercise exercise = exerciseRepository.save(
				new Exercise(unique("Squat"), "Legs", "Strength"));
		Workout firstWorkout = workoutRepository.save(
				new Workout(LocalDate.of(2026, 9, 10), "First Leg Day", null));
		Workout secondWorkout = workoutRepository.save(
				new Workout(LocalDate.of(2026, 9, 20), "Second Leg Day", null));
		WorkoutExercise firstWorkoutExercise = workoutExerciseRepository.save(
				new WorkoutExercise(firstWorkout, exercise, 1));
		WorkoutExercise secondWorkoutExercise = workoutExerciseRepository.save(
				new WorkoutExercise(secondWorkout, exercise, 1));
		setEntryRepository.save(new SetEntry(firstWorkoutExercise, 1, 10, new BigDecimal("100.00")));
		setEntryRepository.save(new SetEntry(firstWorkoutExercise, 2, 5, new BigDecimal("150.00")));
		setEntryRepository.save(new SetEntry(secondWorkoutExercise, 1, 3, new BigDecimal("175.00")));

		mockMvc.perform(get("/api/progress/exercises/{exerciseId}/history", exercise.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exerciseId").value(exercise.getId()))
				.andExpect(jsonPath("$.exerciseName").value(exercise.getName()))
				.andExpect(jsonPath("$.history", hasSize(2)))
				.andExpect(jsonPath("$.history[0].workoutId").value(firstWorkout.getId()))
				.andExpect(jsonPath("$.history[0].workoutDate").value("2026-09-10"))
				.andExpect(jsonPath("$.history[0].totalSets").value(2))
				.andExpect(jsonPath("$.history[0].maxWeight").value(150.00))
				.andExpect(jsonPath("$.history[0].totalVolume").value(1750.00))
				.andExpect(jsonPath("$.history[1].workoutId").value(secondWorkout.getId()))
				.andExpect(jsonPath("$.history[1].workoutDate").value("2026-09-20"))
				.andExpect(jsonPath("$.history[1].maxWeight").value(175.00));
	}

	private String unique(String prefix) {
		return prefix + " " + UUID.randomUUID();
	}
}
