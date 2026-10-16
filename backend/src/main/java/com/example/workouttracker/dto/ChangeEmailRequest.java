package com.example.workouttracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeEmailRequest(
		@NotBlank(message = "email is required.")
		@Email(message = "email must be valid.")
		@Size(max = 254, message = "email must be 254 characters or less.")
		String email,

		@NotBlank(message = "currentPassword is required.")
		@Size(max = 72, message = "currentPassword must be 72 characters or less.")
		String currentPassword) {

	@Override
	public String toString() {
		return "ChangeEmailRequest[email=" + email + ", currentPassword=[REDACTED]]";
	}
}
