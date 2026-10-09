package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.service.WorkoutService;

import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WorkoutExerciseCreationTests {
	@Autowired private MockMvc mvc;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private WorkoutExerciseRepository workoutExercises;
	@Autowired private EntityManager entityManager;
	@MockitoSpyBean private WorkoutService workoutService;

	@Test
	void createsReusableStrengthExerciseAndAddsItAtTheEndOfTheWorkout() throws Exception {
		Workout workout = newWorkout();
		long workoutId = workout.getId();
		Exercise existing = exercises.save(new Exercise(uniqueName("Existing"), "Chest", "None"));
		workoutExercises.save(new WorkoutExercise(workout, existing, 3));
		String suffix = uniqueName("").trim();
		flush();
		mvc.perform(post("/api/workouts/{id}/exercises/new", workoutId).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"  bENCH press %s ","muscleGroup":"Chest","trainingType":"STRENGTH",
						 "instructions":"keep my RPE at 8"}
						""".formatted(suffix)))
				.andExpect(status().isCreated()).andExpect(header().exists("Location"))
				.andExpect(jsonPath("$.exercise.name").value("Bench Press " + suffix))
				.andExpect(jsonPath("$.exercise.instructions").value("keep my RPE at 8"))
				.andExpect(jsonPath("$.exerciseOrder").value(4)).andExpect(jsonPath("$.sets").isEmpty());
		flush();
		WorkoutExercise added = workouts.findById(workoutId).orElseThrow().getWorkoutExercises().getLast();
		assertThat(added.getExercise().getName()).isEqualTo("Bench Press " + suffix);
		assertThat(exercises.existsById(added.getExercise().getId())).isTrue();
	}

	@Test
	void createsCardioWithoutMuscleGroupReadyForDurationLogging() throws Exception {
		long workoutId = newWorkout().getId();
		flush();
		mvc.perform(post("/api/workouts/{id}/exercises/new", workoutId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"" + uniqueName("bike") + "\",\"trainingType\":\"CARDIO\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.exercise.trainingType").value("CARDIO"))
				.andExpect(jsonPath("$.exercise.muscleGroup").isEmpty()).andExpect(jsonPath("$.cardioEntries").isEmpty());
		flush();
		assertThat(workouts.findById(workoutId).orElseThrow().getWorkoutExercises().getFirst()
				.getExercise().getTrainingType()).isEqualTo(TrainingType.CARDIO);
	}

	@Test
	void duplicateAndInvalidRequestsDoNotAddWorkoutExercises() throws Exception {
		long workoutId = newWorkout().getId();
		String name = uniqueName("Existing Press");
		exercises.save(new Exercise(name, "Chest", "None"));
		flush();
		mvc.perform(post("/api/workouts/{id}/exercises/new", workoutId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"" + name.toLowerCase() + "\",\"muscleGroup\":\"Chest\"}"))
				.andExpect(status().isConflict());
		mvc.perform(post("/api/workouts/{id}/exercises/new", workoutId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"\",\"trainingType\":\"CARDIO\"}"))
				.andExpect(status().isBadRequest());
		flush();
		assertThat(workouts.findById(workoutId).orElseThrow().getWorkoutExercises()).isEmpty();
	}

	@Test
	void missingWorkoutDoesNotCreateAnOrphanLibraryExercise() throws Exception {
		String name = uniqueName("Missing Workout");
		mvc.perform(post("/api/workouts/9223372036854775807/exercises/new").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"" + name + "\",\"trainingType\":\"CARDIO\"}"))
				.andExpect(status().isNotFound());
		flush();
		assertThat(exercises.existsByNameIgnoreCase(name)).isFalse();
	}

	@Test
	@Transactional(propagation = Propagation.NOT_SUPPORTED)
	void rollsBackLibraryCreationIfAddingToWorkoutFails() throws Exception {
		long workoutId = newWorkout().getId();
		String name = uniqueName("Rollback Bike");
		try {
			doThrow(new DuplicateResourceException("Workout exercise order already exists."))
					.when(workoutService).addExercise(eq(workoutId), any(AddWorkoutExerciseRequest.class));
			mvc.perform(post("/api/workouts/{id}/exercises/new", workoutId).contentType(MediaType.APPLICATION_JSON)
					.content("{\"name\":\"" + name + "\",\"trainingType\":\"CARDIO\"}"))
					.andExpect(status().isConflict());
			assertThat(exercises.existsByNameIgnoreCase(name)).isFalse();
		} finally {
			workouts.deleteById(workoutId);
			exercises.findAll().stream().filter(exercise -> exercise.getName().equalsIgnoreCase(name))
					.forEach(exercises::delete);
		}
	}

	private Workout newWorkout() {
		return workouts.save(new Workout(LocalDate.of(2026, 8, 20), "Workout", null));
	}

	private String uniqueName(String prefix) {
		return prefix + " " + Long.toUnsignedString(UUID.randomUUID().getMostSignificantBits());
	}

	private void flush() {
		entityManager.flush();
		entityManager.clear();
	}
}
