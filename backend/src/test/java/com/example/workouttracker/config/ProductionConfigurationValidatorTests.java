package com.example.workouttracker.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ProductionConfigurationValidatorTests {

	@Test
	void acceptsRemoteHttpsProductionSettings() {
		ProductionConfigurationValidator validator = validator(
				"jdbc:postgresql://database.example.com/workouts?sslmode=require",
				"https://workouts.example.com",
				"https://workouts.example.com",
				"smtp.example.com",
				true);

		assertThatCode(validator::validate).doesNotThrowAnyException();
	}

	@Test
	void rejectsLocalProductionSettings() {
		ProductionConfigurationValidator validator = validator(
				"jdbc:postgresql://localhost/workouts",
				"http://localhost:5173",
				"http://localhost:5173",
				"localhost",
				false);

		assertThatThrownBy(validator::validate)
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("SPRING_DATASOURCE_URL");
	}

	private ProductionConfigurationValidator validator(
			String datasourceUrl,
			String frontendBaseUrl,
			String origins,
			String mailHost,
			boolean secureCookie) {
		return new ProductionConfigurationValidator(
				datasourceUrl,
				frontendBaseUrl,
				origins,
				mailHost,
				"no-reply@example.com",
				"smtp-user",
				"smtp-password",
				secureCookie);
	}
}
