package com.example.workouttracker;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExerciseDefaultsTests {
    @Autowired private MockMvc mvc;
    @Autowired private ExerciseRepository exercises;
    @Autowired private WorkoutRepository workouts;
    @Autowired private TestUserSupport users;

    private String name() { return "Default Exercise " + UUID.randomUUID(); }

    private long createStrength() throws Exception {
        String location = mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":"Chest","trainingType":"STRENGTH",
                 "movementType":"COMPOUND","repRangeMin":6,"repRangeMax":10,"targetWorkingSets":3,"muscleFocus":"  Upper Chest  "}
                """.formatted(name())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.movementType").value("COMPOUND"))
            .andExpect(jsonPath("$.muscleFocus").value("Upper Chest"))
            .andExpect(jsonPath("$.repRangeMin").value(6)).andExpect(jsonPath("$.repRangeMax").value(10))
            .andExpect(jsonPath("$.targetWorkingSets").value(3))
            .andReturn().getResponse().getHeader("Location");
        return Long.parseLong(location.substring(location.lastIndexOf('/') + 1));
    }

    @Test void acceptsOnlyTheSixMuscleGroupsAndNormalizesTheirCapitalization() throws Exception {
        for (String group : List.of("Chest", "Back", "Legs", "Shoulders", "Arms", "Core")) {
            mvc.perform(post("/api/exercises").contentType("application/json").content(
                    """
                    {"name":"%s","muscleGroup":"  %s  ","muscleFocus":"Free-form focus"}
                    """.formatted(name(), group.toLowerCase(java.util.Locale.ROOT))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.muscleGroup").value(group))
                .andExpect(jsonPath("$.muscleFocus").value("Free-form focus"));
        }
        mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","trainingType":"CARDIO","muscleGroup":"Legs"}
                """.formatted(name())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.muscleGroup").value(nullValue()));
    }

    @Test void rejectsUnsupportedMuscleGroupsOnCreateAndUpdateWithoutChangingTheExercise() throws Exception {
        long id = createStrength();
        for (String group : List.of("Glutes", "Calves", "Biceps", "Full Body", "", "   ")) {
            String body = """
                {"name":"%s","muscleGroup":"%s"}
                """.formatted(name(), group);
            mvc.perform(post("/api/exercises").contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
            mvc.perform(put("/api/exercises/{id}", id).contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.muscleGroup").value("Chest"))
            .andExpect(jsonPath("$.muscleFocus").value("Upper Chest"));
        mvc.perform(put("/api/exercises/{id}", id).contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":" legs ","muscleFocus":"Calves"}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.muscleGroup").value("Legs"))
            .andExpect(jsonPath("$.muscleFocus").value("Calves"));
    }

    @Test void backupImportValidatesMuscleGroupsBeforeReplacingData() throws Exception {
        long id = createStrength();
        String backup = mvc.perform(get("/api/data-backup")).andReturn().getResponse().getContentAsString();
        mvc.perform(put("/api/data-backup").contentType("application/json").content(
                backup.replace("\"muscleGroup\":\"Chest\"", "\"muscleGroup\":\"Glutes\"")))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.muscleGroup").value("Chest"));
        mvc.perform(put("/api/data-backup").contentType("application/json").content(
                backup.replace("\"muscleGroup\":\"Chest\"", "\"muscleGroup\":\" chest \"")))
            .andExpect(status().isOk());
        mvc.perform(get("/api/data-backup")).andExpect(status().isOk())
            .andExpect(jsonPath("$.exercises[?(@.movementType == 'COMPOUND')].muscleGroup",
                org.hamcrest.Matchers.hasItem("Chest")));
    }

    @Test void validatesMuscleFocusAndTreatsBlankAsOptional() throws Exception {
        long id = createStrength();
        mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","trainingType":"CARDIO","muscleFocus":"Quads"}
                """.formatted(name())))
            .andExpect(status().isBadRequest());
        mvc.perform(put("/api/exercises/{id}", id).contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":"Chest","muscleFocus":"%s"}
                """.formatted(name(), "x".repeat(81))))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.muscleFocus").value("Upper Chest"));
        mvc.perform(put("/api/exercises/{id}", id).contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":"Chest","muscleFocus":"   "}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.muscleFocus").value(nullValue()));
    }

    @Test void invalidBackupMuscleFocusLeavesExistingDataUntouched() throws Exception {
        long id = createStrength();
        String backup = mvc.perform(get("/api/data-backup")).andReturn().getResponse().getContentAsString();
        for (String invalid : List.of(
                backup.replace("Upper Chest", "x".repeat(81)),
                backup.replace("\"trainingType\":\"STRENGTH\"", "\"trainingType\":\"CARDIO\"")
                    .replace("\"movementType\":\"COMPOUND\"", "\"movementType\":null")
                    .replace("\"repRangeMin\":6", "\"repRangeMin\":null")
                    .replace("\"repRangeMax\":10", "\"repRangeMax\":null")
                    .replace("\"targetWorkingSets\":3", "\"targetWorkingSets\":null"))) {
            mvc.perform(put("/api/data-backup").contentType("application/json").content(invalid))
                .andExpect(status().isBadRequest());
            mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.muscleFocus").value("Upper Chest"));
        }
    }

    @Test void workingSetTargetCanBeSavedWithoutARepRange() throws Exception {
        mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":"Chest","trainingType":"STRENGTH","targetWorkingSets":4}
                """.formatted(name())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.targetWorkingSets").value(4))
            .andExpect(jsonPath("$.repRangeMin").value(nullValue()));
    }

    @Test void savesUpdatesAndClearsStrengthDefaults() throws Exception {
        long id = createStrength();
        mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.repRangeMax").value(10));
        mvc.perform(put("/api/exercises/{id}", id).contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":"Chest","trainingType":"STRENGTH",
                 "movementType":"ISOLATION","repRangeMin":10,"repRangeMax":20,"targetWorkingSets":4,"muscleFocus":"Mid Chest"}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.movementType").value("ISOLATION"))
            .andExpect(jsonPath("$.muscleFocus").value("Mid Chest"))
            .andExpect(jsonPath("$.repRangeMax").value(20))
            .andExpect(jsonPath("$.targetWorkingSets").value(4));
        mvc.perform(put("/api/exercises/{id}", id).contentType("application/json").content(
                """
                {"name":"%s","muscleGroup":"Chest","trainingType":"STRENGTH"}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.movementType").value(nullValue()))
            .andExpect(jsonPath("$.muscleFocus").value(nullValue()))
            .andExpect(jsonPath("$.repRangeMin").value(nullValue()))
            .andExpect(jsonPath("$.targetWorkingSets").value(nullValue()));
    }

    @Test void savesAndUpdatesFractionalCardioMinuteTargets() throws Exception {
        String location = mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","trainingType":"CARDIO","durationMinMinutes":20.5,"durationMaxMinutes":30.75}
                """.formatted(name())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.durationMinMinutes").value(20.5))
            .andExpect(jsonPath("$.durationMaxMinutes").value(30.75))
            .andExpect(jsonPath("$.repRangeMin").value(nullValue()))
            .andExpect(jsonPath("$.movementType").value(nullValue()))
            .andExpect(jsonPath("$.targetWorkingSets").value(nullValue()))
            .andReturn().getResponse().getHeader("Location");
        mvc.perform(put(location).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":25,"durationMaxMinutes":35}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.trainingType").value("CARDIO"))
            .andExpect(jsonPath("$.durationMinMinutes").value(25))
            .andExpect(jsonPath("$.durationMaxMinutes").value(35));
    }

    @Test void minimumOnlyCardioTargetsCanBeCreatedUpdatedBackedUpAndCleared() throws Exception {
        String location = mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","trainingType":"CARDIO","durationMinMinutes":20.5}
                """.formatted(name())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.durationMinMinutes").value(20.5))
            .andExpect(jsonPath("$.durationMaxMinutes").value(nullValue()))
            .andReturn().getResponse().getHeader("Location");
        mvc.perform(get(location)).andExpect(status().isOk())
            .andExpect(jsonPath("$.durationMinMinutes").value(20.5))
            .andExpect(jsonPath("$.durationMaxMinutes").value(nullValue()));
        mvc.perform(put(location).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":20.5,"durationMaxMinutes":30}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.durationMaxMinutes").value(30));
        mvc.perform(put(location).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":25.25,"durationMaxMinutes":null}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.durationMaxMinutes").value(nullValue()));
        String backup = mvc.perform(get("/api/data-backup")).andReturn().getResponse().getContentAsString();
        mvc.perform(put("/api/data-backup").contentType("application/json").content(
                backup.replace("\"durationMinMinutes\":25.25", "\"durationMinMinutes\":null")
                    .replace("\"durationMaxMinutes\":null", "\"durationMaxMinutes\":-30")))
            .andExpect(status().isBadRequest());
        mvc.perform(get(location)).andExpect(status().isOk())
            .andExpect(jsonPath("$.durationMinMinutes").value(25.25));
        mvc.perform(put("/api/data-backup").contentType("application/json").content(backup))
            .andExpect(status().isOk());
        String restoredLocation = "/api/exercises/" + exercises.findByUserId(users.owner().getId()).stream()
            .filter(e -> e.getTrainingType() == com.example.workouttracker.entity.TrainingType.CARDIO
                && e.getDurationMinMinutes() != null && e.getDurationMinMinutes().compareTo(new java.math.BigDecimal("25.25")) == 0)
            .findFirst().orElseThrow().getId();
        mvc.perform(get(restoredLocation)).andExpect(status().isOk())
            .andExpect(jsonPath("$.durationMinMinutes").value(25.25))
            .andExpect(jsonPath("$.durationMaxMinutes").value(nullValue()));
        mvc.perform(put(restoredLocation).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":null,"durationMaxMinutes":null}
                """.formatted(name())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.durationMinMinutes").value(nullValue()))
            .andExpect(jsonPath("$.durationMaxMinutes").value(nullValue()));
    }

    @Test void maximumOnlyCardioTargetsCanBeCreatedUpdatedRestoredAndCleared() throws Exception {
        String exerciseName = name();
        String location = mvc.perform(post("/api/exercises").contentType("application/json").content(
                """
                {"name":"%s","trainingType":"CARDIO","durationMaxMinutes":30.75}
                """.formatted(exerciseName)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.durationMinMinutes").value(nullValue()))
            .andExpect(jsonPath("$.durationMaxMinutes").value(30.75))
            .andReturn().getResponse().getHeader("Location");
        mvc.perform(get(location)).andExpect(status().isOk())
            .andExpect(jsonPath("$.durationMinMinutes").value(nullValue()))
            .andExpect(jsonPath("$.durationMaxMinutes").value(30.75));
        mvc.perform(put(location).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":10,"durationMaxMinutes":30.75}
                """.formatted(exerciseName)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.durationMinMinutes").value(10));
        mvc.perform(put(location).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":null,"durationMaxMinutes":20.5}
                """.formatted(exerciseName)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.durationMinMinutes").value(nullValue()))
            .andExpect(jsonPath("$.durationMaxMinutes").value(20.5));
        String backup = mvc.perform(get("/api/data-backup")).andReturn().getResponse().getContentAsString();
        mvc.perform(put("/api/data-backup").contentType("application/json").content(backup))
            .andExpect(status().isOk());
        String restoredLocation = "/api/exercises/" + exercises.findByUserId(users.owner().getId()).stream()
            .filter(e -> e.getName().equalsIgnoreCase(exerciseName))
            .findFirst().orElseThrow().getId();
        mvc.perform(get(restoredLocation)).andExpect(status().isOk())
            .andExpect(jsonPath("$.durationMinMinutes").value(nullValue()))
            .andExpect(jsonPath("$.durationMaxMinutes").value(20.5));
        mvc.perform(put(restoredLocation).contentType("application/json").content(
                """
                {"name":"%s","durationMinMinutes":null,"durationMaxMinutes":null}
                """.formatted(exerciseName)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.durationMinMinutes").value(nullValue()))
            .andExpect(jsonPath("$.durationMaxMinutes").value(nullValue()));
    }

    @Test void rejectsIncompleteReversedNegativeAndWrongTrainingTypeDefaults() throws Exception {
        for (String fields : List.of(
                "\"targetWorkingSets\":0", "\"targetWorkingSets\":-1",
                "\"trainingType\":\"CARDIO\",\"targetWorkingSets\":3",
                "\"repRangeMin\":6", "\"repRangeMax\":10",
                "\"repRangeMin\":12,\"repRangeMax\":6", "\"repRangeMin\":0,\"repRangeMax\":6",
                "\"movementType\":\"OTHER\"", "\"durationMinMinutes\":10,\"durationMaxMinutes\":20",
                "\"trainingType\":\"CARDIO\",\"movementType\":\"ISOLATION\"",
                "\"trainingType\":\"CARDIO\",\"repRangeMin\":6,\"repRangeMax\":10",
                "\"trainingType\":\"CARDIO\",\"durationMaxMinutes\":0",
                "\"trainingType\":\"CARDIO\",\"durationMaxMinutes\":-1",
                "\"trainingType\":\"CARDIO\",\"durationMaxMinutes\":100000",
                "\"trainingType\":\"CARDIO\",\"durationMaxMinutes\":1.001",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":0",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":-1",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":100000",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":1.001",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":20,\"durationMaxMinutes\":10",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":-1,\"durationMaxMinutes\":10",
                "\"trainingType\":\"CARDIO\",\"durationMinMinutes\":0.001,\"durationMaxMinutes\":10")) {
            mvc.perform(post("/api/exercises").contentType("application/json")
                .content("{\"name\":\"" + name() + "\",\"muscleGroup\":\"Chest\"," + fields + "}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Test void targetsDoNotRestrictActualLoggedRepsAndAreIncludedInWorkoutResponses() throws Exception {
        long id = createStrength();
        Workout workout = new Workout(users.owner(), LocalDate.now(), "Guidance Test", null);
        WorkoutExercise item = new WorkoutExercise(workout, exercises.findById(id).orElseThrow(), 1);
        workouts.saveAndFlush(workout);
        mvc.perform(post("/api/workout-exercises/{id}/sets", item.getId())
                .contentType("application/json").content("{\"reps\":3,\"weight\":50}"))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/workouts/{id}", workout.getId())).andExpect(status().isOk())
            .andExpect(jsonPath("$.exercises[0].exercise.repRangeMin").value(6))
            .andExpect(jsonPath("$.exercises[0].exercise.muscleFocus").value("Upper Chest"))
            .andExpect(jsonPath("$.exercises[0].exercise.targetWorkingSets").value(3))
            .andExpect(jsonPath("$.totalSets").value(1))
            .andExpect(jsonPath("$.exercises[0].sets[0].reps").value(3));
    }

    @Test void defaultsSurviveBackupRestoreAndInvalidDefaultsDoNotDeleteData() throws Exception {
        long id = createStrength();
        String backup = mvc.perform(get("/api/data-backup")).andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(2)).andReturn().getResponse().getContentAsString();
        assertThat(backup).contains("\"repRangeMin\":6");
        mvc.perform(put("/api/data-backup").contentType("application/json")
            .content(backup.replace("\"repRangeMin\":6", "\"repRangeMin\":30")))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/exercises/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.repRangeMin").value(6));
        mvc.perform(put("/api/data-backup").contentType("application/json").content(backup))
            .andExpect(status().isOk());
        mvc.perform(get("/api/data-backup")).andExpect(status().isOk())
            .andExpect(jsonPath("$.exercises[?(@.movementType == 'COMPOUND')].repRangeMin",
                org.hamcrest.Matchers.hasItem(6)))
            .andExpect(jsonPath("$.exercises[?(@.movementType == 'COMPOUND')].targetWorkingSets",
                org.hamcrest.Matchers.hasItem(3)))
            .andExpect(jsonPath("$.exercises[?(@.movementType == 'COMPOUND')].muscleFocus",
                org.hamcrest.Matchers.hasItem("Upper Chest")));
    }
}
