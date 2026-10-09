package com.example.workouttracker;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WorkoutControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ExerciseRepository exerciseRepository;

	@Autowired
	private WorkoutRepository workoutRepository;

	@Autowired
	private WorkoutExerciseRepository workoutExerciseRepository;

	@Autowired
	private SetEntryRepository setEntryRepository;

	@Test
	void createsWorkout() throws Exception {
		mockMvc.perform(post("/api/workouts")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "workoutDate": "2026-08-20",
						  "title": "Push Day",
						  "notes": "Felt strong"
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", containsString("/api/workouts/")))
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.workoutDate").value("2026-08-20"))
				.andExpect(jsonPath("$.title").value("Push Day"))
				.andExpect(jsonPath("$.notes").value("Felt strong"))
				.andExpect(jsonPath("$.totalSets").value(0))
				.andExpect(jsonPath("$.totalVolume").value(0));
	}

	@Test
	void listsWorkoutsWithTotals() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Deadlift"), "Back", "Strength"));
		Workout workout = workoutRepository.save(new Workout(LocalDate.of(2026, 8, 20), "Pull Day", null));
		WorkoutExercise workoutExercise = workoutExerciseRepository.save(new WorkoutExercise(workout, exercise, 1));
		setEntryRepository.save(new SetEntry(workoutExercise, 1, 5, new BigDecimal("225.00")));
		setEntryRepository.save(new SetEntry(workoutExercise, 2, 5, new BigDecimal("225.00")));

		mockMvc.perform(get("/api/workouts"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.id == " + workout.getId() + ")]", hasSize(1)))
				.andExpect(jsonPath("$[?(@.id == " + workout.getId() + ")].totalSets", contains(2)))
				.andExpect(jsonPath("$[?(@.id == " + workout.getId() + ")].totalVolume", contains(2250.00)));
	}

	@Test
	void getsWorkoutDetailsWithExercisesAndSets() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Bench Press"), "Chest", "Strength"));
		Workout workout = workoutRepository.save(new Workout(LocalDate.of(2026, 8, 20), "Push Day", "Paused reps"));
		WorkoutExercise workoutExercise = workoutExerciseRepository.save(
				new WorkoutExercise(workout, exercise, 1));
		setEntryRepository.save(new SetEntry(workoutExercise, 1, 8, new BigDecimal("135.00")));

		mockMvc.perform(get("/api/workouts/{id}", workout.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(workout.getId()))
				.andExpect(jsonPath("$.exercises", hasSize(1)))
				.andExpect(jsonPath("$.exercises[0].id").value(workoutExercise.getId()))
				.andExpect(jsonPath("$.exercises[0].exercise.name").value(exercise.getName()))
				.andExpect(jsonPath("$.exercises[0].sets", hasSize(1)))
				.andExpect(jsonPath("$.exercises[0].sets[0].reps").value(8))
				.andExpect(jsonPath("$.totalSets").value(1))
				.andExpect(jsonPath("$.totalVolume").value(1080.00));
	}

	@Test
	void addsExerciseToWorkout() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Lat Pulldown"), "Back", "Machine"));
		Workout workout = workoutRepository.save(new Workout(LocalDate.of(2026, 8, 20), "Back Day", null));

		mockMvc.perform(post("/api/workouts/{id}/exercises", workout.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "exerciseId": %d
						}
						""".formatted(exercise.getId())))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", containsString("/api/workout-exercises/")))
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.exerciseOrder").value(1))
				.andExpect(jsonPath("$.exercise.id").value(exercise.getId()))
				.andExpect(jsonPath("$.notes").doesNotExist())
				.andExpect(jsonPath("$.sets", hasSize(0)));
	}

	@Test
	void addsSetToWorkoutExercise() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Goblet Squat"), "Legs", "Dumbbell"));
		Workout workout = workoutRepository.save(new Workout(LocalDate.of(2026, 8, 20), "Leg Day", null));
		WorkoutExercise workoutExercise = workoutExerciseRepository.save(new WorkoutExercise(workout, exercise, 1));

		mockMvc.perform(post("/api/workout-exercises/{id}/sets", workoutExercise.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "reps": 12,
						  "weight": 50
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(header().string(
						"Location",
						containsString("/api/workout-exercises/" + workoutExercise.getId() + "/sets/")))
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.setNumber").value(1))
				.andExpect(jsonPath("$.reps").value(12))
				.andExpect(jsonPath("$.weight").value(50));
	}

	@Test
	void rejectsInvalidSetRequest() throws Exception {
		Exercise exercise = exerciseRepository.save(new Exercise(unique("Front Squat"), "Legs", "Barbell"));
		Workout workout = workoutRepository.save(new Workout(LocalDate.of(2026, 8, 20), "Leg Day", null));
		WorkoutExercise workoutExercise = workoutExerciseRepository.save(new WorkoutExercise(workout, exercise, 1));

		mockMvc.perform(post("/api/workout-exercises/{id}/sets", workoutExercise.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "reps": -1,
						  "weight": -10
						}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.error").value("Bad Request"))
				.andExpect(jsonPath("$.message").value("Validation failed."))
				.andExpect(jsonPath("$.path").value("/api/workout-exercises/" + workoutExercise.getId() + "/sets"))
				.andExpect(jsonPath("$.fieldErrors.reps").value("reps must be greater than 0."))
				.andExpect(jsonPath("$.fieldErrors.weight").value("weight must be greater than or equal to 0."));
	}

	private String unique(String prefix) {
		return prefix + " " + UUID.randomUUID();
	}
}
