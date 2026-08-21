package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record SetEntryResponse(
		Long id,
		Integer setNumber,
		Integer reps,
		BigDecimal weight,
		Instant createdAt,
		Instant updatedAt) {
}
