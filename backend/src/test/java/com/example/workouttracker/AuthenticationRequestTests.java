package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.example.workouttracker.dto.ChangePasswordRequest;
import com.example.workouttracker.dto.DeleteAccountRequest;
import com.example.workouttracker.dto.LoginRequest;
import com.example.workouttracker.dto.UserRegistrationRequest;

class AuthenticationRequestTests {

	@Test
	void passwordBearingRequestsRedactSecretsFromLogs() {
		String secret = "private-password";

		assertThat(new LoginRequest("user", secret).toString()).doesNotContain(secret);
		assertThat(new UserRegistrationRequest("user", secret).toString()).doesNotContain(secret);
		assertThat(new ChangePasswordRequest(secret, secret).toString()).doesNotContain(secret);
		assertThat(new DeleteAccountRequest(secret).toString()).doesNotContain(secret);
	}
}
