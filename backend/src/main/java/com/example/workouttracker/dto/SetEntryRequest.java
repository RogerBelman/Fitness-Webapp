package com.example.workouttracker.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SetEntryRequest(
		@Positive(message = "setNumber must be greater than 0.")
		Integer setNumber,

		@NotNull(message = "reps is required.")
		@Positive(message = "reps must be greater than 0.")
		Integer reps,

		@NotNull(message = "weight is required.")
		@DecimalMin(value = "0.0", message = "weight must be greater than or equal to 0.")
		BigDecimal weight) {
}
