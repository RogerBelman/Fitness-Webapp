package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteAccountRequest(
		@NotBlank(message = "current password is required.")
		@Size(max = 72, message = "current password must be 72 characters or less.")
		String currentPassword) {

	@Override
	public String toString() {
		return "DeleteAccountRequest[currentPassword=[REDACTED]]";
	}
}
