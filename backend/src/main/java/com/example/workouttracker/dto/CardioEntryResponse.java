package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record CardioEntryResponse(Long id, BigDecimal durationMinutes, BigDecimal level,
		Instant createdAt, Instant updatedAt) { }
