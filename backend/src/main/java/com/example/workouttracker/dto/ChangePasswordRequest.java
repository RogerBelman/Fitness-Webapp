package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
		@NotBlank(message = "current password is required.")
		@Size(max = 72, message = "current password must be 72 characters or less.")
		String currentPassword,
		@NotBlank(message = "new password is required.")
		@Size(min = 8, max = 72, message = "new password must be between 8 and 72 characters.")
		String newPassword) {

	@Override
	public String toString() {
		return "ChangePasswordRequest[currentPassword=[REDACTED], newPassword=[REDACTED]]";
	}
}
