package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePreferencesRequest(
		@NotBlank(message = "weightUnit is required.")
		@Pattern(regexp = "lb|kg", message = "weightUnit must be lb or kg.")
		String weightUnit) { }
