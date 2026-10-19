package com.example.workouttracker.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
public class DisabledPasswordResetMailService implements PasswordResetMailService {

	@Override
	public void sendPasswordReset(String email, String resetUrl) {
		// Mail delivery is intentionally disabled until app.mail.enabled is configured.
	}

	@Override
	public void sendEmailVerification(String email, String verificationUrl) {
		// Email delivery is disabled in this environment.
	}
}
