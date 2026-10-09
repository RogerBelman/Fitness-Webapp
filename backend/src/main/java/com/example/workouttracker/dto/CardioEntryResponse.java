package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record CardioEntryResponse(Long id, BigDecimal durationMinutes, BigDecimal level, String notes,
		Instant createdAt, Instant updatedAt) { }
