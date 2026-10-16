package com.example.workouttracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
		@NotBlank(message = "email is required.")
		@Email(message = "email must be valid.")
		@Size(max = 254, message = "email must be 254 characters or less.")
		String email) { }
