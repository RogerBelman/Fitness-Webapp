package com.example.workouttracker.dto;

import java.util.List;

public record CardioProgressResponse(
        Long exerciseId,
        String exerciseName,
        List<CardioProgressPointResponse> history) {
}
