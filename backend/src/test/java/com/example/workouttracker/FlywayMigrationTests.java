package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class FlywayMigrationTests {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void createsWorkoutTrackerTables() {
		List<String> tableNames = jdbcTemplate.queryForList(
				"""
				select table_name
				from information_schema.tables
				where table_schema = current_schema()
					and table_name in ('app_users', 'exercises', 'exercise_goals', 'workouts', 'workout_exercises', 'set_entries',
						'workout_templates', 'workout_template_exercises')
				order by table_name
				""",
				String.class);

		assertThat(tableNames).containsExactly("app_users", "exercise_goals", "exercises", "set_entries", "workout_exercises",
				"workout_template_exercises", "workout_templates", "workouts");
	}

	@Test
	void recordsMigrationHistory() {
		Integer successfulMigrations = jdbcTemplate.queryForObject(
				"""
				select count(*)
				from flyway_schema_history
				where success = true
				""",
				Integer.class);

		assertThat(successfulMigrations).isGreaterThanOrEqualTo(1);
	}

	@Test
	void removesSessionExerciseNoteColumns() {
		List<String> columns = jdbcTemplate.queryForList(
				"""
				select table_name || '.' || column_name
				from information_schema.columns
				where table_schema = current_schema()
				  and table_name in ('workout_exercises', 'cardio_entries')
				  and column_name = 'notes'
				""",
				String.class);

		assertThat(columns).isEmpty();
	}

	@Test
	void addsOwnershipToEachUserDataRoot() {
		List<String> columns = jdbcTemplate.queryForList(
				"""
				select table_name || '.' || column_name
				from information_schema.columns
				where table_schema = current_schema()
				  and table_name in ('exercises', 'workouts', 'workout_templates')
				  and column_name = 'user_id'
				order by table_name
				""",
				String.class);

		assertThat(columns).containsExactly(
				"exercises.user_id", "workout_templates.user_id", "workouts.user_id");
	}
}
