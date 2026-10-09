package com.example.workouttracker.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record CardioEntryRequest(
		@NotNull(message = "durationMinutes is required.")
		@DecimalMin(value = "0.01", message = "durationMinutes must be greater than 0.")
		@Digits(integer = 5, fraction = 2, message = "durationMinutes supports up to 5 integer digits and 2 decimals.")
		BigDecimal durationMinutes,
		@DecimalMin(value = "0", message = "level must be greater than or equal to 0.")
		@Digits(integer = 3, fraction = 2, message = "level supports up to 3 integer digits and 2 decimals.")
		BigDecimal level) { }
