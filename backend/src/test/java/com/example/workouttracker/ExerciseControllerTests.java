package com.example.workouttracker;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.repository.ExerciseRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExerciseControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ExerciseRepository exerciseRepository;

	@Test
	void createsExercise() throws Exception {
		String name = unique("Barbell Squat");

		mockMvc.perform(post("/api/exercises")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "name": "%s",
						  "muscleGroup": "Legs",
						  "category": "Strength"
						}
						""".formatted(name)))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", containsString("/api/exercises/")))
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.name").value(name))
				.andExpect(jsonPath("$.muscleGroup").value("Legs"))
				.andExpect(jsonPath("$.category").value("Strength"));
	}

	@Test
	void rejectsBlankExerciseName() throws Exception {
		mockMvc.perform(post("/api/exercises")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "name": "",
						  "muscleGroup": "Legs",
						  "category": "Strength"
						}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.error").value("Bad Request"))
				.andExpect(jsonPath("$.message").value("Validation failed."))
				.andExpect(jsonPath("$.path").value("/api/exercises"))
				.andExpect(jsonPath("$.fieldErrors.name").value("name is required."));
	}

	@Test
	void listsExercisesWithMuscleGroupFilter() throws Exception {
		String muscleGroup = unique("Chest");
		exerciseRepository.save(new Exercise(unique("Bench Press"), muscleGroup, "Strength"));
		exerciseRepository.save(new Exercise(unique("Romanian Deadlift"), unique("Hamstrings"), "Strength"));

		mockMvc.perform(get("/api/exercises")
				.param("muscleGroup", muscleGroup.toLowerCase()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].muscleGroup").value(muscleGroup));
	}

	@Test
	void getsExerciseById() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Pull Up"), "Back", "Bodyweight"));

		mockMvc.perform(get("/api/exercises/{id}", exercise.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(exercise.getId()))
				.andExpect(jsonPath("$.name").value(exercise.getName()));
	}

	@Test
	void returnsNotFoundErrorBody() throws Exception {
		mockMvc.perform(get("/api/exercises/{id}", 999999))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.status").value(404))
				.andExpect(jsonPath("$.error").value("Not Found"))
				.andExpect(jsonPath("$.message").value("Exercise not found."))
				.andExpect(jsonPath("$.path").value("/api/exercises/999999"));
	}

	@Test
	void updatesExercise() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Strict Press"), "Shoulders", "Strength"));
		String updatedName = unique("Overhead Press");

		mockMvc.perform(put("/api/exercises/{id}", exercise.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "name": "%s",
						  "muscleGroup": "Shoulders",
						  "category": "Barbell"
						}
						""".formatted(updatedName)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(exercise.getId()))
				.andExpect(jsonPath("$.name").value(updatedName))
				.andExpect(jsonPath("$.category").value("Barbell"));
	}

	@Test
	void returnsConflictForDuplicateExerciseName() throws Exception {
		String name = unique("Incline Press");
		exerciseRepository.save(new Exercise(name, "Chest", "Barbell"));

		mockMvc.perform(post("/api/exercises")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "name": "%s",
						  "muscleGroup": "Chest",
						  "category": "Barbell"
						}
						""".formatted(name.toUpperCase())))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.status").value(409))
				.andExpect(jsonPath("$.error").value("Conflict"))
				.andExpect(jsonPath("$.message").value("Exercise name already exists."))
				.andExpect(jsonPath("$.path").value("/api/exercises"));
	}

	@Test
	void deletesExercise() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Cable Row"), "Back", "Machine"));

		mockMvc.perform(delete("/api/exercises/{id}", exercise.getId()))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/exercises/{id}", exercise.getId()))
				.andExpect(status().isNotFound());
	}

	private String unique(String prefix) {
		return prefix + " " + UUID.randomUUID();
	}
}
