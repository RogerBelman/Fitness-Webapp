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
import com.example.workouttracker.repository.WorkoutTemplateRepository;
import com.example.workouttracker.repository.WorkoutTemplateExerciseRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WorkoutTemplateControllerTests {

	@Autowired private TestUserSupport testUsers;

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

	@Autowired
	private WorkoutTemplateRepository templateRepository;

	@Autowired
	private WorkoutTemplateExerciseRepository templateExerciseRepository;

	@Test
	void createsAnEmptyTemplateDirectly() throws Exception {
		mockMvc.perform(post("/api/workout-templates")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"upper body\",\"notes\":\"Focus on control\"}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", containsString("/api/workout-templates/")))
				.andExpect(jsonPath("$.name").value("Upper Body"))
				.andExpect(jsonPath("$.notes").value("Focus on control"))
				.andExpect(jsonPath("$.exercises", hasSize(0)));

		mockMvc.perform(post("/api/workout-templates")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"   \"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void savesEditsAndStartsAWorkoutFromTemplateWithoutLoggedEntries() throws Exception {
		Exercise exercise = exerciseRepository.save(
				new Exercise(testUsers.owner(), "Template Row " + UUID.randomUUID(), "Back", "None"));
		Exercise secondExercise = exerciseRepository.save(
				new Exercise(testUsers.owner(), "Template Curl " + UUID.randomUUID(), "Arms", "None"));
		Workout source = workoutRepository.save(
				new Workout(testUsers.owner(), LocalDate.of(2026, 10, 10), "Pull Routine", "Keep elbows close"));
		WorkoutExercise workoutExercise = workoutExerciseRepository.save(
				new WorkoutExercise(source, exercise, 1));
		setEntryRepository.save(new SetEntry(workoutExercise, 1, 10, new BigDecimal("100.00")));

		mockMvc.perform(post("/api/workouts/{id}/template", source.getId()))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", containsString("/api/workout-templates/")))
				.andExpect(jsonPath("$.name").value("Pull Routine"))
				.andExpect(jsonPath("$.notes").value("Keep elbows close"))
				.andExpect(jsonPath("$.exercises", hasSize(1)))
				.andExpect(jsonPath("$.exercises[0].exercise.id").value(exercise.getId()));

		Long templateId = templateRepository.findAll().stream()
				.filter(template -> template.getName().equals("Pull Routine"))
				.findFirst()
				.orElseThrow()
				.getId();

		mockMvc.perform(put("/api/workout-templates/{id}", templateId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"updated pull\",\"notes\":\"Use straps\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Updated Pull"))
				.andExpect(jsonPath("$.notes").value("Use straps"));

		mockMvc.perform(post("/api/workout-templates/{id}/exercises", templateId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"exerciseId\":" + secondExercise.getId() + "}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.exercises", hasSize(2)))
				.andExpect(jsonPath("$.exercises[1].exercise.id").value(secondExercise.getId()));

		Long secondTemplateExerciseId = templateExerciseRepository
				.findByWorkoutTemplateIdAndExerciseOrder(templateId, 2)
				.orElseThrow()
				.getId();
		mockMvc.perform(put("/api/workout-template-exercises/{id}", secondTemplateExerciseId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"exerciseOrder\":1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exercises[0].exercise.id").value(secondExercise.getId()))
				.andExpect(jsonPath("$.exercises[1].exercise.id").value(exercise.getId()));

		Long firstTemplateExerciseId = templateExerciseRepository
				.findByWorkoutTemplateIdAndExerciseOrder(templateId, 2)
				.orElseThrow()
				.getId();
		mockMvc.perform(delete("/api/workout-template-exercises/{id}", firstTemplateExerciseId))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/workout-templates"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.id == " + templateId + ")]", hasSize(1)));

		mockMvc.perform(post("/api/workout-templates/{id}/workouts", templateId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"workoutDate":"2026-10-11","title":"evening pull","notes":"Felt rested"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.workoutDate").value("2026-10-11"))
				.andExpect(jsonPath("$.title").value("Evening Pull"))
				.andExpect(jsonPath("$.notes").value("Felt rested"))
				.andExpect(jsonPath("$.exercises", hasSize(1)))
				.andExpect(jsonPath("$.exercises[0].exercise.id").value(secondExercise.getId()))
				.andExpect(jsonPath("$.exercises[0].sets", hasSize(0)))
				.andExpect(jsonPath("$.totalSets").value(0));

		mockMvc.perform(post("/api/workout-templates/{id}/workouts", templateId)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"workoutDate\":\"2026-10-12\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.title").value("Updated Pull"))
				.andExpect(jsonPath("$.notes").value("Use straps"));

		mockMvc.perform(delete("/api/workout-templates/{id}", templateId))
				.andExpect(status().isNoContent());
	}
}
