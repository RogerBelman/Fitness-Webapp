package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRegistrationRequest(
		@NotBlank(message = "username is required.")
		@Size(min = 3, max = 50, message = "username must be between 3 and 50 characters.")
		@Pattern(regexp = "^[A-Za-z0-9_]+$", message = "username may contain only letters, numbers, and underscores.")
		String username,

		@NotBlank(message = "email is required.")
		@Email(message = "email must be valid.")
		@Size(max = 254, message = "email must be 254 characters or less.")
		String email,

		@NotBlank(message = "password is required.")
		@Size(min = 8, max = 72, message = "password must be between 8 and 72 characters.")
		String password) {

	@Override
	public String toString() {
		return "UserRegistrationRequest[username=" + username + ", email=" + email + ", password=[REDACTED]]";
	}
}
