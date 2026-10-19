package com.example.workouttracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EmailVerificationListener {
	private static final Logger log = LoggerFactory.getLogger(EmailVerificationListener.class);
	private final EmailVerificationService verification;

	public EmailVerificationListener(EmailVerificationService verification) {
		this.verification = verification;
	}

	@TransactionalEventListener
	public void afterAccountSaved(EmailVerificationRequested event) {
		try {
			verification.sendVerification(event.userId());
		} catch (RuntimeException exception) {
			// Account creation/email correction must succeed even if delivery is unavailable.
			log.warn("Verification email could not be sent. The account can request another from Settings.");
		}
	}
}
