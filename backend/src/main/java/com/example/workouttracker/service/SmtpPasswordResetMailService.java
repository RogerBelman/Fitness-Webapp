package com.example.workouttracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
@ConditionalOnExpression("'${app.mail.provider:smtp}' == 'smtp'")
public class SmtpPasswordResetMailService implements PasswordResetMailService {

	private final JavaMailSender mailSender;
	private final String fromAddress;

	public SmtpPasswordResetMailService(
			JavaMailSender mailSender,
			@Value("${app.mail.from:no-reply@workout-tracker.local}") String fromAddress) {
		this.mailSender = mailSender;
		this.fromAddress = fromAddress;
	}

	@Override
	public void sendPasswordReset(String email, String resetUrl) {
		send(email, "Reset your Workout Tracker password",
				"Use this link within 30 minutes to reset your password:\n\n" + resetUrl
						+ "\n\nIf you did not request this, you can ignore this email.");
	}

	@Override
	public void sendEmailVerification(String email, String verificationUrl) {
		send(email, "Verify your Workout Tracker email",
				"Confirm your email address using this link within 24 hours:\n\n" + verificationUrl
						+ "\n\nIf you did not request this, you can ignore this email.");
	}

	private void send(String email, String subject, String text) {
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(fromAddress);
		message.setTo(email);
		message.setSubject(subject);
		message.setText(text);
		mailSender.send(message);
	}
}
