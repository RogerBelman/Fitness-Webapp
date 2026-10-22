package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

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
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.CardioEntryRepository;
import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CardioTrackingTests {

	@Autowired private TestUserSupport testUsers;
	@Autowired private MockMvc mvc;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private WorkoutExerciseRepository workoutExercises;
	@Autowired private CardioEntryRepository entries;
	@Autowired private EntityManager entityManager;

	@Test
	void cardioDoesNotRequireMuscleGroupAndCanBeFilteredByType() throws Exception {
		String name = "Bike " + UUID.randomUUID();
		mvc.perform(post("/api/exercises").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"" + name + "\",\"trainingType\":\"CARDIO\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.muscleGroup").isEmpty())
				.andExpect(jsonPath("$.category").value("None"))
				.andExpect(jsonPath("$.trainingType").value("CARDIO"));
		flush();
		mvc.perform(get("/api/exercises").param("trainingType", "cardio"))
				.andExpect(status().isOk()).andExpect(jsonPath("$[*].trainingType", everyItem(is("CARDIO"))));
		assertThat(exercises.findAll().stream().filter(exercise -> exercise.getName().equalsIgnoreCase(name)).findFirst().orElseThrow().getMuscleGroup()).isNull();
		mvc.perform(get("/api/exercises").param("trainingType", "unknown")).andExpect(status().isBadRequest());
		mvc.perform(post("/api/exercises").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Strength missing muscle\",\"trainingType\":\"STRENGTH\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void mixedWorkoutKeepsSeparateTotalsAfterUpdatesAndDeletes() throws Exception {
		Workout workout = newWorkout();
		long workoutId = workout.getId();
		long cardioId = addExercise(workout, TrainingType.CARDIO, 1).getId();
		long strengthId = addExercise(workout, TrainingType.STRENGTH, 2).getId();
		flush();
		mvc.perform(post("/api/workout-exercises/{id}/sets", strengthId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"reps\":8,\"weight\":100}" )).andExpect(status().isCreated());
		addEntry(cardioId, "{\"durationMinutes\":20,\"level\":6}");
		long secondId = addEntry(cardioId, "{\"durationMinutes\":5.25}");
		mvc.perform(get("/api/workouts/{id}", workoutId))
				.andExpect(jsonPath("$.totalSets").value(1)).andExpect(jsonPath("$.totalVolume").value(800))
				.andExpect(jsonPath("$.totalCardioMinutes").value(25.25))
				.andExpect(jsonPath("$.exercises[0].cardioEntries[0].notes").doesNotExist())
				.andExpect(jsonPath("$.exercises[0].sets").isEmpty());
		mvc.perform(get("/api/workouts")).andExpect(jsonPath("$[?(@.id == " + workoutId + ")].totalCardioMinutes", contains(25.25)));
		mvc.perform(put("/api/cardio-entries/{id}", secondId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"durationMinutes\":10.5,\"level\":0}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.level").value(0));
		flush();
		mvc.perform(get("/api/workouts/{id}", workoutId)).andExpect(jsonPath("$.totalCardioMinutes").value(30.5));
		mvc.perform(put("/api/cardio-entries/{id}", secondId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"durationMinutes\":10.5}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.level").isEmpty())
				.andExpect(jsonPath("$.notes").doesNotExist());
		flush();
		assertThat(entries.findById(secondId).orElseThrow().getLevel()).isNull();
		mvc.perform(delete("/api/cardio-entries/{id}", secondId)).andExpect(status().isNoContent());
		flush();
		assertThat(entries.existsById(secondId)).isFalse();
		mvc.perform(get("/api/workouts/{id}", workoutId))
				.andExpect(jsonPath("$.totalCardioMinutes").value(20)).andExpect(jsonPath("$.totalVolume").value(800));
	}

	@Test
	void rejectsLoggingTheWrongTypeOfEntry() throws Exception {
		Workout workout = newWorkout();
		long cardio = addExercise(workout, TrainingType.CARDIO, 1).getId();
		long strength = addExercise(workout, TrainingType.STRENGTH, 2).getId();
		flush();
		mvc.perform(post("/api/workout-exercises/{id}/sets", cardio).contentType(MediaType.APPLICATION_JSON)
				.content("{\"reps\":10,\"weight\":0}" )).andExpect(status().isBadRequest());
		mvc.perform(post("/api/workout-exercises/{id}/cardio-entries", strength).contentType(MediaType.APPLICATION_JSON)
				.content("{\"durationMinutes\":20}" )).andExpect(status().isBadRequest());
	}

	@Test
	void validatesCardioDurationAndLevelOnCreateAndUpdate() throws Exception {
		long cardio = addExercise(newWorkout(), TrainingType.CARDIO, 1).getId();
		flush();
		long entry = addEntry(cardio, "{\"durationMinutes\":20}");
		for (String body : new String[] {
				"{}", "{\"durationMinutes\":null}", "{\"durationMinutes\":0}", "{\"durationMinutes\":-1}",
				"{\"durationMinutes\":100000}", "{\"durationMinutes\":1.001}",
				"{\"durationMinutes\":20,\"level\":-1}", "{\"durationMinutes\":20,\"level\":1000}",
				"{\"durationMinutes\":20,\"level\":1.001}" }) {
			mvc.perform(post("/api/workout-exercises/{id}/cardio-entries", cardio).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
			mvc.perform(put("/api/cardio-entries/{id}", entry).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
		}
		flush();
		assertThat(entries.findById(entry).orElseThrow().getDurationMinutes()).isEqualByComparingTo("20");
	}

	@Test
	void preventsTypeChangesBeforeAnyEntriesAreLogged() throws Exception {
		for (TrainingType type : TrainingType.values()) {
			Exercise exercise = exercises.saveAndFlush(new Exercise(testUsers.owner(), "Type " + UUID.randomUUID(),
					type == TrainingType.STRENGTH ? "Chest" : null, "None", "Original instructions", type));
			long id = exercise.getId();
			String originalName = exercise.getName();
			TrainingType otherType = type == TrainingType.STRENGTH ? TrainingType.CARDIO : TrainingType.STRENGTH;
			mvc.perform(put("/api/exercises/{id}", id).contentType(MediaType.APPLICATION_JSON)
					.content(exerciseBody("Changed " + UUID.randomUUID(), otherType.name())))
					.andExpect(status().isConflict())
					.andExpect(jsonPath("$.message").value(
							"Training type cannot be changed after creation. Create a separate exercise for a different type."));
			flush();
			mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
					.andExpect(jsonPath("$.trainingType").value(type.name()))
					.andExpect(jsonPath("$.name").value(originalName))
					.andExpect(jsonPath("$.instructions").value("Original instructions"));
			mvc.perform(put("/api/exercises/{id}", id).contentType(MediaType.APPLICATION_JSON)
					.content(exerciseBody(originalName, type.name())))
					.andExpect(status().isOk()).andExpect(jsonPath("$.trainingType").value(type.name()));
		}
	}

	@Test
	void preventsTypeChangesWithHistoryAndAfterRemovingEntriesButAllowsOtherEdits() throws Exception {
		Workout workout = newWorkout();
		WorkoutExercise cardio = addExercise(workout, TrainingType.CARDIO, 1);
		WorkoutExercise strength = addExercise(workout, TrainingType.STRENGTH, 2);
		long cardioId = cardio.getId(), exerciseId = cardio.getExercise().getId();
		String cardioName = cardio.getExercise().getName();
		long strengthId = strength.getId(), strengthExerciseId = strength.getExercise().getId();
		String strengthName = strength.getExercise().getName();
		flush();
		long entryId = addEntry(cardioId, "{\"durationMinutes\":20}");
		mvc.perform(post("/api/workout-exercises/{id}/sets", strengthId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"reps\":8,\"weight\":100}" )).andExpect(status().isCreated());
		mvc.perform(put("/api/exercises/{id}", exerciseId).contentType(MediaType.APPLICATION_JSON)
				.content(exerciseBody(cardioName, "STRENGTH"))).andExpect(status().isConflict());
		mvc.perform(put("/api/exercises/{id}", strengthExerciseId).contentType(MediaType.APPLICATION_JSON)
				.content(exerciseBody(strengthName, "CARDIO"))).andExpect(status().isConflict());
		mvc.perform(put("/api/exercises/{id}", exerciseId).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"" + cardioName + "\",\"instructions\":\"Seat height 5\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.trainingType").value("CARDIO"));
		mvc.perform(delete("/api/cardio-entries/{id}", entryId)).andExpect(status().isNoContent());
		flush();
		mvc.perform(put("/api/exercises/{id}", exerciseId).contentType(MediaType.APPLICATION_JSON)
				.content(exerciseBody(cardioName, "STRENGTH"))).andExpect(status().isConflict());
		flush();
		assertThat(exercises.findById(exerciseId).orElseThrow().getTrainingType()).isEqualTo(TrainingType.CARDIO);
	}

	@Test
	void deletingWorkoutExerciseCascadesCardioButKeepsLibraryExercise() throws Exception {
		WorkoutExercise cardio = addExercise(newWorkout(), TrainingType.CARDIO, 1);
		long id = cardio.getId(), exerciseId = cardio.getExercise().getId();
		flush();
		long entry = addEntry(id, "{\"durationMinutes\":20}");
		mvc.perform(delete("/api/workout-exercises/{id}", id)).andExpect(status().isNoContent());
		flush();
		assertThat(entries.existsById(entry)).isFalse();
		assertThat(exercises.existsById(exerciseId)).isTrue();
	}

	@Test
	void deletingWorkoutCascadesCardioButKeepsLibraryExercise() throws Exception {
		Workout workout = newWorkout();
		long workoutId = workout.getId();
		WorkoutExercise cardio = addExercise(workout, TrainingType.CARDIO, 1);
		long id = cardio.getId(), exerciseId = cardio.getExercise().getId();
		flush();
		long entry = addEntry(id, "{\"durationMinutes\":20}");
		mvc.perform(delete("/api/workouts/{id}", workoutId)).andExpect(status().isNoContent());
		flush();
		assertThat(entries.existsById(entry)).isFalse();
		assertThat(exercises.existsById(exerciseId)).isTrue();
	}

	@Test
	void missingCardioEntriesAndWorkoutExercisesReturnNotFound() throws Exception {
		mvc.perform(post("/api/workout-exercises/9223372036854775807/cardio-entries").contentType(MediaType.APPLICATION_JSON)
				.content("{\"durationMinutes\":20}" )).andExpect(status().isNotFound());
		mvc.perform(put("/api/cardio-entries/9223372036854775807").contentType(MediaType.APPLICATION_JSON)
				.content("{\"durationMinutes\":20}" )).andExpect(status().isNotFound());
		mvc.perform(delete("/api/cardio-entries/9223372036854775807")).andExpect(status().isNotFound());
	}

	private Workout newWorkout() {
		return workouts.save(new Workout(testUsers.owner(), LocalDate.of(2026, 8, 20), "Mixed workout", null));
	}
	private WorkoutExercise addExercise(Workout workout, TrainingType type, int order) {
		Exercise exercise = exercises.save(new Exercise(testUsers.owner(), "Test " + UUID.randomUUID(), type == TrainingType.STRENGTH ? "Chest" : null, "None", null, type));
		return workoutExercises.save(new WorkoutExercise(workout, exercise, order));
	}
	private long addEntry(long id, String body) throws Exception {
		mvc.perform(post("/api/workout-exercises/{id}/cardio-entries", id).contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated()).andExpect(header().exists("Location"));
		flush();
		return workoutExercises.findById(id).orElseThrow().getCardioEntries().getLast().getId();
	}
	private String exerciseBody(String name, String type) {
		return "{\"name\":\"" + name + "\",\"muscleGroup\":\"Chest\",\"trainingType\":\"" + type + "\"}";
	}
	private void flush() { entityManager.flush(); entityManager.clear(); }
}
