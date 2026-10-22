package com.example.workouttracker;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import com.example.workouttracker.entity.ExerciseGoal;
import com.example.workouttracker.entity.GoalMetric;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.entity.WorkoutTemplate;
import com.example.workouttracker.entity.WorkoutTemplateExercise;
import com.example.workouttracker.repository.ExerciseGoalRepository;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.repository.WorkoutTemplateRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DataBackupControllerTests {

	@Autowired private TestUserSupport testUsers;

	@Autowired private MockMvc mvc;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private WorkoutTemplateRepository templates;
	@Autowired private ExerciseGoalRepository goals;

	@Test
	void exportsNestedTrainingData() throws Exception {
		String name = "Backup Bench " + UUID.randomUUID();
		Exercise exercise = exercises.save(new Exercise(testUsers.owner(), name, "Chest", "None", "Stay controlled"));
		Workout workout = new Workout(testUsers.owner(), LocalDate.parse("2026-10-10"), "Backup Day", "Steady pace");
		WorkoutExercise workoutExercise = new WorkoutExercise(workout, exercise, 1);
		new SetEntry(workoutExercise, 1, 8, new BigDecimal("135.00"));
		workouts.save(workout);
		WorkoutTemplate template = new WorkoutTemplate(testUsers.owner(), "Backup Routine", "Reusable");
		new WorkoutTemplateExercise(template, exercise, 1);
		templates.save(template);
		goals.save(new ExerciseGoal(exercise, GoalMetric.STRENGTH_MAX_WEIGHT, new BigDecimal("185.00")));

		mvc.perform(get("/api/data-backup"))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", "attachment; filename=workout-tracker-backup.json"))
				.andExpect(jsonPath("$.version").value(2))
				.andExpect(jsonPath("$.exercises[?(@.name == '%s')]", name).value(hasSize(1)))
				.andExpect(jsonPath("$.workouts[?(@.title == 'Backup Day')].exercises[0].sets[0].weight").value(135.0))
				.andExpect(jsonPath("$.templates[?(@.name == 'Backup Routine')]", name).value(hasSize(1)))
				.andExpect(jsonPath("$.goals[?(@.exerciseName == '%s')]", name).value(hasSize(1)));
	}

	@Test
	void replacesAllDataFromAValidBackup() throws Exception {
		exercises.save(new Exercise(testUsers.owner(), "Old Exercise " + UUID.randomUUID(), "Back", "None"));

		mvc.perform(put("/api/data-backup")
				.contentType("application/json")
				.content(validBackup()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exercises").value(1))
				.andExpect(jsonPath("$.workouts").value(1))
				.andExpect(jsonPath("$.templates").value(1))
				.andExpect(jsonPath("$.goals").value(1));

		mvc.perform(get("/api/data-backup"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exercises", hasSize(1)))
				.andExpect(jsonPath("$.exercises[0].name").value("Imported Bench"))
				.andExpect(jsonPath("$.workouts[0].exercises[0].sets", hasSize(1)));
	}

	@Test
	void rejectsInvalidReferencesBeforeDeletingCurrentData() throws Exception {
		String retainedName = "Retained Exercise " + UUID.randomUUID();
		exercises.save(new Exercise(testUsers.owner(), retainedName, "Back", "None"));

		mvc.perform(put("/api/data-backup")
				.contentType("application/json")
				.content(validBackup().replace(
						"\"exerciseName\": \"Imported Bench\"",
						"\"exerciseName\": \"Missing Exercise\"")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid backup")));

		org.junit.jupiter.api.Assertions.assertTrue(exercises.existsByUserIdAndNameIgnoreCase(testUsers.owner().getId(), retainedName));
	}

	private String validBackup() {
		return """
				{
				  "version": 1,
				  "exportedAt": "2026-10-14T00:00:00Z",
				  "exercises": [{
				    "name": "Imported Bench",
				    "muscleGroup": "Chest",
				    "category": "None",
				    "instructions": "Stay controlled",
				    "trainingType": "STRENGTH"
				  }],
				  "workouts": [{
				    "workoutDate": "2026-10-12",
				    "title": "Imported Workout",
				    "notes": null,
				    "exercises": [{
				      "exerciseName": "Imported Bench",
				      "exerciseOrder": 1,
				      "sets": [{ "setNumber": 1, "reps": 5, "weight": 150 }],
				      "cardioEntries": []
				    }]
				  }],
				  "templates": [{
				    "name": "Imported Routine",
				    "notes": null,
				    "exercises": [{ "exerciseName": "Imported Bench", "exerciseOrder": 1 }]
				  }],
				  "goals": [{
				    "exerciseName": "Imported Bench",
				    "metric": "STRENGTH_MAX_WEIGHT",
				    "targetValue": 200
				  }]
				}
				""";
	}
}
