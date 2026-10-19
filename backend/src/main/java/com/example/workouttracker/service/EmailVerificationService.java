package com.example.workouttracker.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.entity.EmailVerificationToken;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.repository.AppUserRepository;
import com.example.workouttracker.repository.EmailVerificationTokenRepository;

@Service
public class EmailVerificationService {
	private final AppUserRepository users;
	private final EmailVerificationTokenRepository tokens;
	private final PasswordResetMailService mail;
	private final String frontendBaseUrl;
	private final SecureRandom random = new SecureRandom();

	public EmailVerificationService(AppUserRepository users, EmailVerificationTokenRepository tokens,
			PasswordResetMailService mail, @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
		this.users = users;
		this.tokens = tokens;
		this.mail = mail;
		this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void sendVerification(Long userId) {
		AppUser user = users.findLockedById(userId).orElseThrow(() -> new BadRequestException("Account not found."));
		if (user.isEmailVerified()) return;
		if (user.getEmail() == null) throw new BadRequestException("Add a recovery email in Settings first.");
		if (tokens.existsByUserIdAndCreatedAtAfter(userId, Instant.now().minus(Duration.ofMinutes(2)))) {
			throw new BadRequestException("Please wait two minutes before requesting another verification email.");
		}
		tokens.deleteByUserId(userId);
		byte[] bytes = new byte[32];
		random.nextBytes(bytes);
		String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		tokens.save(new EmailVerificationToken(user, hash(token)));
		mail.sendEmailVerification(user.getEmail(), frontendBaseUrl + "/verify-email?token=" + token);
	}

	@Transactional
	public void verify(String token) {
		String tokenHash = hash(token);
		EmailVerificationToken initial = tokens.findByTokenHash(tokenHash).orElseThrow(this::invalidToken);
		AppUser user = users.findLockedById(initial.getUser().getId()).orElseThrow(this::invalidToken);
		EmailVerificationToken current = tokens.findByTokenHash(tokenHash).orElseThrow(this::invalidToken);
		if (!current.getExpiresAt().isAfter(Instant.now()) || !current.getEmail().equals(user.getEmail())) {
			throw invalidToken();
		}
		user.verifyEmail();
		tokens.deleteByUserId(user.getId());
	}

	private BadRequestException invalidToken() {
		return new BadRequestException("This verification link is invalid or expired. Request a new one from Settings.");
	}

	private String hash(String token) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is not available.", exception);
		}
	}
}
