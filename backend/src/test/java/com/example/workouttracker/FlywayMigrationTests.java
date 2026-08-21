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
				where table_schema = 'public'
					and table_name in ('exercises', 'workouts', 'workout_exercises', 'set_entries')
				order by table_name
				""",
				String.class);

		assertThat(tableNames).containsExactly("exercises", "set_entries", "workout_exercises", "workouts");
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
}
