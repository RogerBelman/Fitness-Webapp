package com.example.workouttracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
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
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(fromAddress);
		message.setTo(email);
		message.setSubject("Reset your Workout Tracker password");
		message.setText("Use this link within 30 minutes to reset your password:\n\n" + resetUrl
				+ "\n\nIf you did not request this, you can ignore this email.");
		mailSender.send(message);
	}
}
