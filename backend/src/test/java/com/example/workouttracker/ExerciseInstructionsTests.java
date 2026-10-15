package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;

import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExerciseInstructionsTests {

	@Autowired private TestUserSupport testUsers;
	@Autowired private MockMvc mockMvc;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private WorkoutExerciseRepository workoutExercises;
	@Autowired private EntityManager entityManager;

	@Test
	void createsAndReadsPermanentInstructionsWithLineBreaks() throws Exception {
		String muscleGroup = "Instructions " + UUID.randomUUID();
		mockMvc.perform(post("/api/exercises").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Instruction test %s","muscleGroup":"%s","category":"Barbell",
						 "instructions":"  Set your grip.\\nKeep your shoulders down.  "}
						""".formatted(UUID.randomUUID(), muscleGroup)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.instructions").value("Set your grip.\nKeep your shoulders down."));
		flushAndClear();
		mockMvc.perform(get("/api/exercises").param("muscleGroup", muscleGroup))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].instructions").value("Set your grip.\nKeep your shoulders down."));
	}

	@Test
	void updatedInstructionsAppearInWorkoutsAlongsideWorkoutNotes() throws Exception {
		Exercise exercise = exercises.save(new Exercise(testUsers.owner(), "Technique " + UUID.randomUUID(), "Chest", "Barbell"));
		Workout workout = workouts.save(new Workout(testUsers.owner(), LocalDate.of(2026, 8, 20), "Push day", "Session notes"));
		workoutExercises.save(new WorkoutExercise(workout, exercise, 1));
		Long workoutId = workout.getId();
		Long exerciseId = exercise.getId();
		String name = exercise.getName();
		flushAndClear();

		mockMvc.perform(put("/api/exercises/{id}", exerciseId).contentType(MediaType.APPLICATION_JSON)
				.content(request(name, ",\"instructions\":\" Keep your shoulders down. \"")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.instructions").value("Keep your shoulders down."));
		flushAndClear();
		mockMvc.perform(get("/api/workouts/{id}", workoutId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes").value("Session notes"))
				.andExpect(jsonPath("$.exercises[0].notes").doesNotExist())
				.andExpect(jsonPath("$.exercises[0].exercise.instructions").value("Keep your shoulders down."));
	}

	@Test
	void blankNullOrOmittedInstructionsClearTheLibraryField() throws Exception {
		Exercise exercise = exercises.save(new Exercise(testUsers.owner(), "Clear instructions " + UUID.randomUUID(), "Chest", "Barbell"));
		Long id = exercise.getId();
		String name = exercise.getName();
		for (String field : new String[] { ",\"instructions\":\"   \"", ",\"instructions\":null", "" }) {
			exercises.findById(id).orElseThrow().updateDetails(name, "Chest", "Barbell", "Set your grip.");
			flushAndClear();
			mockMvc.perform(put("/api/exercises/{id}", id).contentType(MediaType.APPLICATION_JSON).content(request(name, field)))
					.andExpect(status().isOk()).andExpect(jsonPath("$.instructions").isEmpty());
			flushAndClear();
			assertThat(exercises.findById(id).orElseThrow().getInstructions()).isNull();
		}
	}

	@Test
	void rejectsInstructionsLongerThanTheLimitOnCreateAndUpdate() throws Exception {
		Exercise exercise = exercises.save(new Exercise(testUsers.owner(), "Length test " + UUID.randomUUID(), "Chest", "Barbell", "Original cue"));
		Long id = exercise.getId();
		String name = exercise.getName();
		flushAndClear();
		String body = request(name, ",\"instructions\":\"" + "x".repeat(501) + "\"");
		mockMvc.perform(post("/api/exercises").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.instructions").exists());
		mockMvc.perform(put("/api/exercises/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.instructions").exists());
		flushAndClear();
		assertThat(exercises.findById(id).orElseThrow().getInstructions()).isEqualTo("Original cue");
	}

	@Test
	void acceptsInstructionsAtTheLimit() throws Exception {
		String muscleGroup = "Limit " + UUID.randomUUID();
		String instructions = "x".repeat(500);
		mockMvc.perform(post("/api/exercises").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Limit test %s","muscleGroup":"%s","category":"Barbell","instructions":"%s"}
						""".formatted(UUID.randomUUID(), muscleGroup, instructions)))
				.andExpect(status().isCreated());
		flushAndClear();
		mockMvc.perform(get("/api/exercises").param("muscleGroup", muscleGroup))
				.andExpect(jsonPath("$[0].instructions").value(instructions));
	}

	private String request(String name, String instructionsField) {
		return "{\"name\":\"" + name + "\",\"muscleGroup\":\"Chest\",\"category\":\"Barbell\"" + instructionsField + "}";
	}

	private void flushAndClear() {
		entityManager.flush();
		entityManager.clear();
	}
}
