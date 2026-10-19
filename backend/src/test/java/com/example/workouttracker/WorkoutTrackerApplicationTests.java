package com.example.workouttracker;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
		webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
		properties = "app.auth.rate-limit.enabled=true")
class WorkoutTrackerApplicationTests {

	@Test
	void contextLoads() {
	}

}
