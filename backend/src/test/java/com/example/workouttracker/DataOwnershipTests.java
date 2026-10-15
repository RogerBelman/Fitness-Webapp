package com.example.workouttracker;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.repository.AppUserRepository;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DataOwnershipTests {

	@Autowired private MockMvc mvc;
	@Autowired private AppUserRepository users;
	@Autowired private ExerciseRepository exercises;
	@Autowired private WorkoutRepository workouts;
	@Autowired private PasswordEncoder passwordEncoder;

	@Test
	void usersCanUseTheSameExerciseNameWithoutSharingLibraries() throws Exception {
		AppUser first = createUser("first");
		AppUser second = createUser("second");
		String name = "Shared Name " + UUID.randomUUID();
		String body = """
				{"name":"%s","muscleGroup":"Chest","category":"None"}
				""".formatted(name);

		mvc.perform(post("/api/exercises").with(user(first.getUsername()))
				.contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated());
		mvc.perform(post("/api/exercises").with(user(second.getUsername()))
				.contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated());

		mvc.perform(get("/api/exercises").with(user(first.getUsername())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)));
		mvc.perform(get("/api/exercises").with(user(second.getUsername())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)));
	}

	@Test
	void anotherUsersIdsLookMissingAndCannotBeCombined() throws Exception {
		AppUser owner = createUser("owner");
		AppUser other = createUser("other");
		Exercise privateExercise = exercises.save(
				new Exercise(owner, "Private " + UUID.randomUUID(), "Back", "None"));
		Workout otherWorkout = workouts.save(
				new Workout(other, LocalDate.of(2026, 10, 14), "Other Workout", null));

		mvc.perform(get("/api/exercises/{id}", privateExercise.getId()).with(user(other.getUsername())))
				.andExpect(status().isNotFound());
		mvc.perform(post("/api/workouts/{id}/exercises", otherWorkout.getId())
				.with(user(other.getUsername()))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"exerciseId\":" + privateExercise.getId() + "}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void backupExportsOnlyTheSignedInUsersRecords() throws Exception {
		AppUser first = createUser("backup_first");
		AppUser second = createUser("backup_second");
		String firstName = "First " + UUID.randomUUID();
		String secondName = "Second " + UUID.randomUUID();
		exercises.save(new Exercise(first, firstName, "Chest", "None"));
		exercises.save(new Exercise(second, secondName, "Back", "None"));

		mvc.perform(get("/api/data-backup").with(user(first.getUsername())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exercises[?(@.name == '%s')]".formatted(firstName), hasSize(1)))
				.andExpect(jsonPath("$.exercises[?(@.name == '%s')]".formatted(secondName), hasSize(0)));
	}

	private AppUser createUser(String prefix) {
		return users.save(new AppUser(
				prefix + "_" + UUID.randomUUID().toString().replace("-", ""),
				passwordEncoder.encode("ownership-test-password")));
	}
}
