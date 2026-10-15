package com.example.workouttracker;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.repository.ExerciseGoalRepository;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExerciseGoalControllerTests {

	@Autowired private TestUserSupport testUsers;

	@Autowired private MockMvc mvc;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private WorkoutExerciseRepository workoutExercises;
	@Autowired private SetEntryRepository sets;
	@Autowired private ExerciseGoalRepository goals;

	@Test
	void createsUpdatesAndDeletesMaxVolumeGoalUsingBestWorkoutTotal() throws Exception {
		Exercise exercise = exercises.save(new Exercise(testUsers.owner(), "Goal Bench " + UUID.randomUUID(), "Chest", "None"));
		logWorkout(exercise, "2026-10-01", new String[][] { { "100", "10" }, { "100", "5" } });
		logWorkout(exercise, "2026-10-02", new String[][] { { "120", "10" } });

		mvc.perform(post("/api/goals").contentType("application/json").content(request(exercise, "STRENGTH_MAX_VOLUME", "1400")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.currentValue").value(1500))
				.andExpect(jsonPath("$.achieved").value(true));

		Long goalId = goals.findAll().stream()
				.filter(goal -> goal.getExercise().getId().equals(exercise.getId()))
				.findFirst()
				.orElseThrow()
				.getId();
		mvc.perform(put("/api/goals/{id}", goalId).contentType("application/json").content(request(exercise, "STRENGTH_MAX_VOLUME", "1600")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.achieved").value(false));
		mvc.perform(get("/api/goals")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
		mvc.perform(delete("/api/goals/{id}", goalId)).andExpect(status().isNoContent());
		mvc.perform(get("/api/goals")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void rejectsGoalMetricThatDoesNotMatchExerciseType() throws Exception {
		Exercise cardio = exercises.save(new Exercise(testUsers.owner(), "Goal Bike " + UUID.randomUUID(), null, "None", null, TrainingType.CARDIO));
		mvc.perform(post("/api/goals").contentType("application/json").content(request(cardio, "STRENGTH_MAX_WEIGHT", "100")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Goal metric must match the exercise training type."));
	}

	private void logWorkout(Exercise exercise, String date, String[][] entries) {
		Workout workout = workouts.save(new Workout(testUsers.owner(), LocalDate.parse(date), "Goal test", null));
		WorkoutExercise row = workoutExercises.save(new WorkoutExercise(workout, exercise, 1));
		for (int index = 0; index < entries.length; index++) {
			sets.save(new SetEntry(row, index + 1, Integer.valueOf(entries[index][1]), new BigDecimal(entries[index][0])));
		}
	}

	private String request(Exercise exercise, String metric, String target) {
		return "{\"exerciseId\":" + exercise.getId() + ",\"metric\":\"" + metric + "\",\"targetValue\":" + target + "}";
	}
}
