package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
		@NotBlank(message = "token is required.")
		@Size(max = 100, message = "token is invalid.")
		String token,

		@NotBlank(message = "newPassword is required.")
		@Size(min = 8, max = 72, message = "newPassword must be between 8 and 72 characters.")
		String newPassword) {

	@Override
	public String toString() {
		return "ResetPasswordRequest[token=[REDACTED], newPassword=[REDACTED]]";
	}
}
