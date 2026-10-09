package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.WorkoutRequest;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.service.ExerciseService;
import com.example.workouttracker.service.WorkoutService;

import jakarta.persistence.EntityManager;

@SpringBootTest
@Transactional
class TextFormattingPersistenceTests {
	@Autowired private ExerciseService exerciseService;
	@Autowired private WorkoutService workoutService;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private EntityManager entityManager;

	@Test
	void exerciseCreatesAndEditsPersistTitleCaseButPreserveInstructions() {
		String suffix = Long.toUnsignedString(UUID.randomUUID().getMostSignificantBits());
		String instructions = "keep RPE at 8.\nI prefer a slow tempo.";
		long id = exerciseService.create(new ExerciseRequest(
				"  dUMBBELL   bench PRESS " + suffix + "  ", "Chest", null, instructions, null)).id();
		flush();
		assertThat(exercises.findById(id).orElseThrow().getName()).isEqualTo("Dumbbell Bench Press " + suffix);
		assertThat(exercises.findById(id).orElseThrow().getInstructions()).isEqualTo(instructions);

		exerciseService.update(id, new ExerciseRequest(
				"  iNCLINE   bENCH PRESS " + suffix, "Chest", null, instructions, null));
		flush();
		assertThat(exercises.findById(id).orElseThrow().getName()).isEqualTo("Incline Bench Press " + suffix);
		assertThat(exercises.findById(id).orElseThrow().getInstructions()).isEqualTo(instructions);
		assertThatThrownBy(() -> exerciseService.create(new ExerciseRequest(
				"incline   BENCH press " + suffix, "Chest", null, null, null)))
				.isInstanceOf(DuplicateResourceException.class);
	}

	@Test
	void workoutCreatesAndEditsPersistTitleCaseButPreserveWorkoutNotes() {
		String notes = "felt GOOD today.\nI reached a PR!";
		long id = workoutService.create(new WorkoutRequest(LocalDate.of(2026, 8, 20), "  uPPER  BODY a ", notes)).id();
		flush();
		assertThat(workouts.findById(id).orElseThrow().getTitle()).isEqualTo("Upper Body A");
		assertThat(workouts.findById(id).orElseThrow().getNotes()).isEqualTo(notes);

		workoutService.update(id, new WorkoutRequest(null, "  pUSH day B  ", notes));
		flush();
		assertThat(workouts.findById(id).orElseThrow().getTitle()).isEqualTo("Push Day B");
		assertThat(workouts.findById(id).orElseThrow().getNotes()).isEqualTo(notes);

		workoutService.update(id, new WorkoutRequest(null, " \t ", notes));
		flush();
		assertThat(workouts.findById(id).orElseThrow().getTitle()).isNull();
	}

	@Test
	void whitespaceOnlyExerciseNamesAreRejectedBeforeSaving() {
		assertThatThrownBy(() -> exerciseService.create(new ExerciseRequest("\u00a0\u00a0", "Chest", null, null, null)))
				.isInstanceOf(BadRequestException.class).hasMessage("name is required.");
	}

	private void flush() {
		entityManager.flush();
		entityManager.clear();
	}
}
