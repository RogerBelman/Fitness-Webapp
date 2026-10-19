package com.example.workouttracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailVerificationRequest(
		@NotBlank @Size(max = 128) String token) {
	@Override
	public String toString() {
		return "EmailVerificationRequest[token=[REDACTED]]";
	}
}
