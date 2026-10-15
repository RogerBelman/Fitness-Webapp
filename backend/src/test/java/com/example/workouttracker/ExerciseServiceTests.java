package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.ExerciseResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.ExerciseGoalRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.repository.CardioEntryRepository;
import com.example.workouttracker.service.ExerciseService;
import com.example.workouttracker.service.CurrentUserService;

@ExtendWith(MockitoExtension.class)
class ExerciseServiceTests {

	@Mock
	private ExerciseRepository exerciseRepository;

	@Mock
	private WorkoutExerciseRepository workoutExerciseRepository;

	@Mock private SetEntryRepository setEntryRepository;
	@Mock private CardioEntryRepository cardioEntryRepository;
	@Mock private ExerciseGoalRepository exerciseGoalRepository;
	@Mock private CurrentUserService currentUserService;
	@Mock private AppUser currentUser;

	@InjectMocks
	private ExerciseService exerciseService;

	@Test
	void createsExercise() {
		ExerciseRequest request = new ExerciseRequest(" Bench Press ", " Chest ", " Barbell ", " Keep shoulders down. ", null);
		when(currentUserService.requireCurrentUser()).thenReturn(currentUser);
		when(exerciseRepository.existsByUserIdAndNameIgnoreCase(0L, "Bench Press")).thenReturn(false);
		when(exerciseRepository.save(any(Exercise.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ExerciseResponse response = exerciseService.create(request);

		assertThat(response.name()).isEqualTo("Bench Press");
		assertThat(response.muscleGroup()).isEqualTo("Chest");
		assertThat(response.category()).isEqualTo("Barbell");
		assertThat(response.instructions()).isEqualTo("Keep shoulders down.");
		verify(exerciseRepository).save(argThat(exercise ->
				exercise.getName().equals("Bench Press")
						&& exercise.getMuscleGroup().equals("Chest")
						&& exercise.getCategory().equals("Barbell")));
	}

	@Test
	void rejectsDuplicateExerciseName() {
		ExerciseRequest request = new ExerciseRequest("Bench Press", "Chest", "Barbell", null, null);
		when(currentUserService.requireCurrentUser()).thenReturn(currentUser);
		when(exerciseRepository.existsByUserIdAndNameIgnoreCase(0L, "Bench Press")).thenReturn(true);

		assertThatThrownBy(() -> exerciseService.create(request))
				.isInstanceOf(DuplicateResourceException.class)
				.hasMessage("Exercise name already exists.");
	}
}
