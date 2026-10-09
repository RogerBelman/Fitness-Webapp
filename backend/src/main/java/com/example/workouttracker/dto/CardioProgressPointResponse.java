package com.example.workouttracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CardioProgressPointResponse(
        Long workoutId,
        LocalDate workoutDate,
        int totalEntries,
        BigDecimal totalDurationMinutes,
        BigDecimal maxLevel) {
}
