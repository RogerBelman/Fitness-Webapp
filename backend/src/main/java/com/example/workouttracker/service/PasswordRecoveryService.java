package com.example.workouttracker.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ForgotPasswordRequest;
import com.example.workouttracker.dto.ResetPasswordRequest;
import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.entity.PasswordResetToken;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.repository.AppUserRepository;
import com.example.workouttracker.repository.PasswordResetTokenRepository;

@Service
public class PasswordRecoveryService {

	private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(30);
	private static final Duration REQUEST_COOLDOWN = Duration.ofMinutes(2);
	private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

	private final AppUserRepository userRepository;
	private final PasswordResetTokenRepository tokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final PasswordResetMailService mailService;
	private final SecureRandom secureRandom = new SecureRandom();
	private final String frontendBaseUrl;

	public PasswordRecoveryService(
			AppUserRepository userRepository,
			PasswordResetTokenRepository tokenRepository,
			PasswordEncoder passwordEncoder,
			PasswordResetMailService mailService,
			@Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
		this.userRepository = userRepository;
		this.tokenRepository = tokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.mailService = mailService;
		this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
	}

	@Transactional
	public void requestReset(ForgotPasswordRequest request) {
		String email = request.email().strip().toLowerCase(Locale.ROOT);
		userRepository.findByEmailIgnoreCase(email).ifPresent(user -> createAndSendToken(user, email));
	}

	@Transactional(noRollbackFor = BadRequestException.class)
	public String resetPassword(ResetPasswordRequest request) {
		PasswordResetToken resetToken = tokenRepository.findByTokenHash(hash(request.token()))
				.orElseThrow(() -> new BadRequestException("This password reset link is invalid or expired."));
		if (!resetToken.getExpiresAt().isAfter(Instant.now())) {
			tokenRepository.delete(resetToken);
			throw new BadRequestException("This password reset link is invalid or expired.");
		}
		validatePasswordLength(request.newPassword());

		AppUser user = resetToken.getUser();
		user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
		tokenRepository.deleteByUserId(user.getId());
		return user.getUsername();
	}

	private void createAndSendToken(AppUser user, String email) {
		if (tokenRepository.existsByUserIdAndCreatedAtAfter(
				user.getId(), Instant.now().minus(REQUEST_COOLDOWN))) {
			return;
		}
		tokenRepository.deleteByUserId(user.getId());
		String token = generateToken();
		tokenRepository.save(new PasswordResetToken(
				user, hash(token), Instant.now().plus(TOKEN_LIFETIME)));
		mailService.sendPasswordReset(email, frontendBaseUrl + "/reset-password?token=" + token);
	}

	private String generateToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hash(String token) {
		try {
			return HexFormat.of().formatHex(
					MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is not available.", exception);
		}
	}

	private void validatePasswordLength(String password) {
		if (password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
			throw new BadRequestException("new password must be 72 UTF-8 bytes or less.");
		}
	}
}
