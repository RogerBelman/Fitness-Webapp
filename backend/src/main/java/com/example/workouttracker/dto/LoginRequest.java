package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank(message = "username or email is required.")
		String username,

		@NotBlank(message = "password is required.")
		String password) {

	@Override
	public String toString() {
		return "LoginRequest[username=" + username + ", password=[REDACTED]]";
	}
}
