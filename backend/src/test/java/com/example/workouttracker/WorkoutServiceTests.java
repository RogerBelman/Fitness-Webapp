package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
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

import com.example.workouttracker.dto.SetEntryRequest;
import com.example.workouttracker.dto.WorkoutRequest;
import com.example.workouttracker.dto.WorkoutResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.service.WorkoutService;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTests {

	@Mock
	private WorkoutRepository workoutRepository;

	@Mock
	private ExerciseRepository exerciseRepository;

	@Mock
	private WorkoutExerciseRepository workoutExerciseRepository;

	@Mock
	private SetEntryRepository setEntryRepository;

	private WorkoutService workoutService;

	@BeforeEach
	void setUp() {
		workoutService = new WorkoutService(
				workoutRepository,
				exerciseRepository,
				workoutExerciseRepository,
				setEntryRepository);
	}

	@Test
	void createsWorkout() {
		LocalDate workoutDate = LocalDate.of(2026, 8, 25);
		WorkoutRequest request = new WorkoutRequest(workoutDate, " Push Day ", " Felt strong ");
		when(workoutRepository.save(any(Workout.class))).thenAnswer(invocation -> invocation.getArgument(0));

		WorkoutResponse response = workoutService.create(request);

		assertThat(response.workoutDate()).isEqualTo(workoutDate);
		assertThat(response.title()).isEqualTo("Push Day");
		assertThat(response.notes()).isEqualTo("Felt strong");
		assertThat(response.totalSets()).isZero();
		assertThat(response.totalVolume()).isEqualByComparingTo(BigDecimal.ZERO);
		verify(workoutRepository).save(argThat(workout ->
				workout.getWorkoutDate().equals(workoutDate)
						&& workout.getTitle().equals("Push Day")
						&& workout.getNotes().equals("Felt strong")));
	}

	@Test
	void rejectsInvalidReps() {
		Long workoutExerciseId = 10L;
		when(workoutExerciseRepository.findById(workoutExerciseId))
				.thenReturn(Optional.of(workoutExercise()));

		SetEntryRequest request = new SetEntryRequest(1, 0, new BigDecimal("135.00"));

		assertThatThrownBy(() -> workoutService.addSet(workoutExerciseId, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("reps must be greater than 0.");
		verify(setEntryRepository, never()).save(any(SetEntry.class));
	}

	@Test
	void rejectsNegativeWeight() {
		Long workoutExerciseId = 10L;
		when(workoutExerciseRepository.findById(workoutExerciseId))
				.thenReturn(Optional.of(workoutExercise()));

		SetEntryRequest request = new SetEntryRequest(1, 8, new BigDecimal("-1.00"));

		assertThatThrownBy(() -> workoutService.addSet(workoutExerciseId, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("weight must be greater than or equal to 0.");
		verify(setEntryRepository, never()).save(any(SetEntry.class));
	}

	private WorkoutExercise workoutExercise() {
		Workout workout = new Workout(LocalDate.of(2026, 8, 25), "Pull Day", null);
		Exercise exercise = new Exercise("Lat Pulldown", "Back", "Machine");
		return new WorkoutExercise(workout, exercise, 1, null);
	}
}
