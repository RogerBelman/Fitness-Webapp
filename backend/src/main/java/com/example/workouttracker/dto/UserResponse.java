package com.example.workouttracker.dto;

import java.time.Instant;

public record UserResponse(Long id, String username, String weightUnit, Instant createdAt) { }
