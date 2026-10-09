package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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

import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WorkoutEditingTests {
	@Autowired private MockMvc mockMvc;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private WorkoutExerciseRepository workoutExercises;
	@Autowired private SetEntryRepository sets;
	@Autowired private EntityManager entityManager;

	@Test
	void editsWorkoutAndClearsNotesWithoutLosingSets() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(put("/api/workouts/{id}", fixture.workoutId())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"workoutDate":"2026-08-21","title":" Updated workout ","notes":""}
						"""))
				.andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated Workout"));
		flushAndClear();
		mockMvc.perform(get("/api/workouts/{id}", fixture.workoutId()))
				.andExpect(jsonPath("$.workoutDate").value("2026-08-21"))
				.andExpect(jsonPath("$.notes").isEmpty())
				.andExpect(jsonPath("$.totalSets").value(2))
				.andExpect(jsonPath("$.totalVolume").value(1750));
	}

	@Test
	void omittedWorkoutDateKeepsOriginalDate() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(put("/api/workouts/{id}", fixture.workoutId())
				.contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Changed\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.workoutDate").value("2026-08-20"));
	}

	@Test
	void editsSetAndRecalculatesTotalsAndPersonalRecord() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(put("/api/sets/{id}", fixture.secondSetId())
				.contentType(MediaType.APPLICATION_JSON).content("{\"reps\":10,\"weight\":90}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.setNumber").value(2));
		flushAndClear();
		mockMvc.perform(get("/api/workouts/{id}", fixture.workoutId()))
				.andExpect(jsonPath("$.totalSets").value(2)).andExpect(jsonPath("$.totalVolume").value(1900));
		mockMvc.perform(get("/api/progress/exercises/{id}/personal-record", fixture.exerciseId()))
				.andExpect(status().isOk()).andExpect(jsonPath("$.personalRecord.weight").value(100));
		mockMvc.perform(get("/api/progress/exercises/{id}/history", fixture.exerciseId()))
				.andExpect(jsonPath("$.history[0].maxWeight").value(100))
				.andExpect(jsonPath("$.history[0].totalVolume").value(1900));
	}

	@Test
	void setCanKeepItsNumberOrMoveToAnUnusedNumber() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(put("/api/sets/{id}", fixture.firstSetId())
				.contentType(MediaType.APPLICATION_JSON).content("{\"setNumber\":1,\"reps\":8,\"weight\":105}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.setNumber").value(1));
		mockMvc.perform(put("/api/sets/{id}", fixture.firstSetId())
				.contentType(MediaType.APPLICATION_JSON).content("{\"setNumber\":3,\"reps\":8,\"weight\":105}"))
				.andExpect(status().isOk());
		flushAndClear();
		mockMvc.perform(get("/api/workouts/{id}", fixture.workoutId()))
				.andExpect(jsonPath("$.exercises[0].sets[0].setNumber").value(2))
				.andExpect(jsonPath("$.exercises[0].sets[1].setNumber").value(3));
	}

	@Test
	void rejectsDuplicateSetNumberWithoutChangingLoggedValues() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(put("/api/sets/{id}", fixture.firstSetId())
				.contentType(MediaType.APPLICATION_JSON).content("{\"setNumber\":2,\"reps\":8,\"weight\":105}"))
				.andExpect(status().isConflict());
		flushAndClear();
		assertThat(sets.findById(fixture.firstSetId()).orElseThrow().getReps()).isEqualTo(10);
	}

	@Test
	void rejectsInvalidSetEdits() throws Exception {
		Fixture fixture = fixture();
		for (String request : new String[] {
				"{\"reps\":0,\"weight\":100}", "{\"reps\":8,\"weight\":-1}",
				"{\"reps\":8,\"weight\":100000}", "{\"reps\":8,\"weight\":100.001}" }) {
			mockMvc.perform(put("/api/sets/{id}", fixture.firstSetId())
					.contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isBadRequest());
		}
		flushAndClear();
		assertThat(sets.findById(fixture.firstSetId()).orElseThrow().getWeight()).isEqualByComparingTo("100");
	}

	@Test
	void swapsWorkoutExerciseOrderWithoutLosingEntries() throws Exception {
		Fixture fixture = fixture();
		Workout workout = workouts.findById(fixture.workoutId()).orElseThrow();
		Exercise exercise = exercises.findById(fixture.exerciseId()).orElseThrow();
		WorkoutExercise otherExercise = workoutExercises.save(new WorkoutExercise(workout, exercise, 2));
		Long otherExerciseId = otherExercise.getId();
		flushAndClear();
		mockMvc.perform(put("/api/workout-exercises/{id}", fixture.workoutExerciseId())
				.contentType(MediaType.APPLICATION_JSON).content("{\"exerciseOrder\":2}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exerciseOrder").value(2))
				.andExpect(jsonPath("$.notes").doesNotExist());
		flushAndClear();
		mockMvc.perform(get("/api/workouts/{id}", fixture.workoutId()))
				.andExpect(jsonPath("$.exercises[0].id").value(otherExerciseId))
				.andExpect(jsonPath("$.exercises[0].exerciseOrder").value(1))
				.andExpect(jsonPath("$.exercises[1].id").value(fixture.workoutExerciseId()))
				.andExpect(jsonPath("$.exercises[1].exerciseOrder").value(2))
				.andExpect(jsonPath("$.exercises[1].sets", hasSize(2)));
	}

	@Test
	void deletingSetUpdatesTotalsAndFallsBackToRemainingPersonalRecord() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(delete("/api/sets/{id}", fixture.secondSetId())).andExpect(status().isNoContent());
		flushAndClear();
		assertThat(sets.existsById(fixture.secondSetId())).isFalse();
		mockMvc.perform(get("/api/workouts/{id}", fixture.workoutId()))
				.andExpect(jsonPath("$.totalSets").value(1)).andExpect(jsonPath("$.totalVolume").value(1000));
		mockMvc.perform(get("/api/progress/exercises/{id}/personal-record", fixture.exerciseId()))
				.andExpect(jsonPath("$.personalRecord.weight").value(100));
	}

	@Test
	void removingWorkoutExerciseDeletesItsSetsAndKeepsLibraryExercise() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(delete("/api/workout-exercises/{id}", fixture.workoutExerciseId()))
				.andExpect(status().isNoContent());
		flushAndClear();
		assertThat(workoutExercises.existsById(fixture.workoutExerciseId())).isFalse();
		assertThat(sets.existsById(fixture.firstSetId())).isFalse();
		assertThat(sets.existsById(fixture.secondSetId())).isFalse();
		assertThat(exercises.existsById(fixture.exerciseId())).isTrue();
		mockMvc.perform(get("/api/workouts/{id}", fixture.workoutId()))
				.andExpect(jsonPath("$.exercises", hasSize(0))).andExpect(jsonPath("$.totalVolume").value(0));
		mockMvc.perform(get("/api/progress/exercises/{id}/personal-record", fixture.exerciseId()))
				.andExpect(jsonPath("$.personalRecord").isEmpty());
	}

	@Test
	void blocksLibraryDeletionUntilReferencedWorkoutIsDeleted() throws Exception {
		Fixture fixture = fixture();
		mockMvc.perform(delete("/api/exercises/{id}", fixture.exerciseId()))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.message", containsString("workout history")));
		mockMvc.perform(delete("/api/workouts/{id}", fixture.workoutId())).andExpect(status().isNoContent());
		flushAndClear();
		assertThat(workouts.existsById(fixture.workoutId())).isFalse();
		assertThat(workoutExercises.existsById(fixture.workoutExerciseId())).isFalse();
		assertThat(sets.existsById(fixture.firstSetId())).isFalse();
		assertThat(sets.existsById(fixture.secondSetId())).isFalse();
		assertThat(exercises.existsById(fixture.exerciseId())).isTrue();
		mockMvc.perform(delete("/api/exercises/{id}", fixture.exerciseId())).andExpect(status().isNoContent());
		flushAndClear();
		assertThat(exercises.existsById(fixture.exerciseId())).isFalse();
	}

	@Test
	void missingResourcesReturnNotFoundForUpdatesAndDeletes() throws Exception {
		for (String path : new String[] { "/api/workouts/9223372036854775807", "/api/workout-exercises/9223372036854775807",
				"/api/sets/9223372036854775807" }) {
			mockMvc.perform(delete(path)).andExpect(status().isNotFound());
			mockMvc.perform(put(path).contentType(MediaType.APPLICATION_JSON)
					.content("{\"reps\":8,\"weight\":100}")).andExpect(status().isNotFound());
		}
	}

	private Fixture fixture() {
		Exercise exercise = exercises.save(new Exercise("Edit test " + UUID.randomUUID(), "Chest", "Barbell"));
		Workout workout = workouts.save(new Workout(LocalDate.of(2026, 8, 20), "Push Day", "Original notes"));
		WorkoutExercise workoutExercise = workoutExercises.save(new WorkoutExercise(workout, exercise, 1));
		SetEntry first = sets.save(new SetEntry(workoutExercise, 1, 10, new BigDecimal("100.00")));
		SetEntry second = sets.save(new SetEntry(workoutExercise, 2, 5, new BigDecimal("150.00")));
		Fixture result = new Fixture(exercise.getId(), workout.getId(), workoutExercise.getId(), first.getId(), second.getId());
		flushAndClear();
		return result;
	}

	private void flushAndClear() {
		entityManager.flush();
		entityManager.clear();
	}

	private record Fixture(Long exerciseId, Long workoutId, Long workoutExerciseId, Long firstSetId, Long secondSetId) {
	}
}
