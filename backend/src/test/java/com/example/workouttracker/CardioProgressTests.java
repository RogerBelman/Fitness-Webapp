package com.example.workouttracker;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

import com.example.workouttracker.entity.*;
import com.example.workouttracker.repository.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CardioProgressTests {
    @Autowired private MockMvc mvc;
    @Autowired private ExerciseRepository exercises;
    @Autowired private WorkoutRepository workouts;
    @Autowired private WorkoutExerciseRepository workoutExercises;
    @Autowired private CardioEntryRepository entries;

    @Test
    void groupsIntervalsAndRepeatedExerciseRowsByWorkoutAndOrdersByDate() throws Exception {
        Exercise exercise = cardio();
        Workout later = workout("2026-09-20");
        Workout earlier = workout("2026-09-10");
        WorkoutExercise firstRow = row(earlier, exercise, 1);
        log(firstRow, "10.25", "3");
        log(firstRow, "5.50", null);
        log(row(earlier, exercise, 2), "4.25", "6");
        log(row(later, exercise, 1), "25", "4");
        log(row(earlier, cardio(), 3), "100", "99");
        row(workout("2026-09-25"), exercise, 1); // No logged entries: no history point.

        mvc.perform(get(path(exercise)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.exerciseId").value(exercise.getId()))
            .andExpect(jsonPath("$.exerciseName").value(exercise.getName()))
            .andExpect(jsonPath("$.history", hasSize(2)))
            .andExpect(jsonPath("$.history[0].workoutId").value(earlier.getId()))
            .andExpect(jsonPath("$.history[0].workoutDate").value("2026-09-10"))
            .andExpect(jsonPath("$.history[0].totalEntries").value(3))
            .andExpect(jsonPath("$.history[0].totalDurationMinutes").value(20))
            .andExpect(jsonPath("$.history[0].maxLevel").value(6))
            .andExpect(jsonPath("$.history[1].totalDurationMinutes").value(25));
    }

    @Test
    void distinguishesMissingLevelFromZeroAndKeepsSameDayWorkoutsSeparate() throws Exception {
        Exercise exercise = cardio();
        Workout first = workout("2026-09-20");
        Workout second = workout("2026-09-20");
        log(row(second, exercise, 1), "12", "0");
        log(row(first, exercise, 1), "10", null);
        mvc.perform(get(path(exercise)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.history", hasSize(2)))
            .andExpect(jsonPath("$.history[0].workoutId").value(first.getId()))
            .andExpect(jsonPath("$.history[0].maxLevel").doesNotExist())
            .andExpect(jsonPath("$.history[1].workoutId").value(second.getId()))
            .andExpect(jsonPath("$.history[1].maxLevel").value(0));
    }

    @Test
    void reflectsEditsAndDeletes() throws Exception {
        Exercise exercise = cardio();
        WorkoutExercise row = row(workout("2026-09-20"), exercise, 1);
        CardioEntry entry = log(row, "10", "5");
        mvc.perform(put("/api/cardio-entries/{id}", entry.getId())
                .contentType("application/json").content("{\"durationMinutes\":22.5}"))
            .andExpect(status().isOk());
        mvc.perform(get(path(exercise)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.history[0].totalDurationMinutes").value(22.5))
            .andExpect(jsonPath("$.history[0].maxLevel").doesNotExist());
        mvc.perform(delete("/api/cardio-entries/{id}", entry.getId()))
            .andExpect(status().isNoContent());
        mvc.perform(get(path(exercise))).andExpect(status().isOk())
            .andExpect(jsonPath("$.history", hasSize(0)));
    }

    @Test
    void returnsEmptyHistoryWithoutEntries() throws Exception {
        mvc.perform(get(path(cardio()))).andExpect(status().isOk())
            .andExpect(jsonPath("$.history", hasSize(0)));
    }

    @Test
    void rejectsStrengthExercise() throws Exception {
        Exercise strength = exercises.save(new Exercise("Strength " + UUID.randomUUID(), "Chest", "None"));
        mvc.perform(get(path(strength))).andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMissingExercise() throws Exception {
        mvc.perform(get("/api/progress/exercises/9223372036854775807/cardio-history"))
            .andExpect(status().isNotFound());
    }

    private Exercise cardio() {
        return exercises.save(new Exercise("Bike " + UUID.randomUUID(), null, "None", null, TrainingType.CARDIO));
    }

    private Workout workout(String date) {
        return workouts.save(new Workout(LocalDate.parse(date), "Cardio test", null));
    }

    private WorkoutExercise row(Workout workout, Exercise exercise, int order) {
        return workoutExercises.save(new WorkoutExercise(workout, exercise, order));
    }

    private CardioEntry log(WorkoutExercise row, String duration, String level) {
        return entries.save(new CardioEntry(row, new BigDecimal(duration), level == null ? null : new BigDecimal(level)));
    }

    private String path(Exercise exercise) {
        return "/api/progress/exercises/" + exercise.getId() + "/cardio-history";
    }
}
