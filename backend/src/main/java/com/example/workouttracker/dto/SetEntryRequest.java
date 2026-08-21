package com.example.workouttracker.dto;

import java.math.BigDecimal;

public record SetEntryRequest(
		Integer setNumber,
		Integer reps,
		BigDecimal weight) {
}
