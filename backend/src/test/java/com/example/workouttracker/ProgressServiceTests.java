package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.workouttracker.dto.ExercisePersonalRecordResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.service.ProgressService;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTests {

	@Mock
	private ExerciseRepository exerciseRepository;

	@Mock
	private SetEntryRepository setEntryRepository;

	private ProgressService progressService;

	@BeforeEach
	void setUp() {
		progressService = new ProgressService(exerciseRepository, setEntryRepository);
	}

	@Test
	void returnsPersonalRecordForExercise() {
		Long exerciseId = 12L;
		Exercise exercise = new Exercise("Bench Press", "Chest", "Strength");
		Workout workout = new Workout(LocalDate.of(2026, 9, 25), "Push Day", null);
		WorkoutExercise workoutExercise = new WorkoutExercise(workout, exercise, 1, null);
		SetEntry setEntry = new SetEntry(workoutExercise, 1, 5, new BigDecimal("185.00"));
		when(exerciseRepository.findById(exerciseId)).thenReturn(Optional.of(exercise));
		when(setEntryRepository
				.findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(exerciseId))
				.thenReturn(Optional.of(setEntry));

		ExercisePersonalRecordResponse response = progressService.findPersonalRecord(exerciseId);

		assertThat(response.exerciseName()).isEqualTo("Bench Press");
		assertThat(response.personalRecord().weight()).isEqualByComparingTo("185.00");
		assertThat(response.personalRecord().reps()).isEqualTo(5);
		assertThat(response.personalRecord().workoutDate()).isEqualTo(LocalDate.of(2026, 9, 25));
	}

	@Test
	void returnsEmptyRecordWhenExerciseHasNoSets() {
		Long exerciseId = 12L;
		Exercise exercise = new Exercise("Bench Press", "Chest", "Strength");
		when(exerciseRepository.findById(exerciseId)).thenReturn(Optional.of(exercise));
		when(setEntryRepository
				.findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(exerciseId))
				.thenReturn(Optional.empty());

		ExercisePersonalRecordResponse response = progressService.findPersonalRecord(exerciseId);

		assertThat(response.exerciseName()).isEqualTo("Bench Press");
		assertThat(response.personalRecord()).isNull();
	}

	@Test
	void rejectsMissingExercise() {
		Long exerciseId = 999L;
		when(exerciseRepository.findById(exerciseId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> progressService.findPersonalRecord(exerciseId))
				.isInstanceOf(ResourceNotFoundException.class)
				.hasMessage("Exercise not found.");
		verify(setEntryRepository, never())
				.findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(exerciseId);
	}
}
