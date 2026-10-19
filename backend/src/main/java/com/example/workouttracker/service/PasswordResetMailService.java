package com.example.workouttracker.service;

public interface PasswordResetMailService {

	void sendPasswordReset(String email, String resetUrl);

	void sendEmailVerification(String email, String verificationUrl);
}
