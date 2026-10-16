package com.example.workouttracker.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.UserRegistrationRequest;
import com.example.workouttracker.dto.UserResponse;
import com.example.workouttracker.dto.ChangePasswordRequest;
import com.example.workouttracker.dto.DeleteAccountRequest;
import com.example.workouttracker.dto.UpdatePreferencesRequest;
import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.repository.AppUserRepository;

@Service
public class UserAccountService {

	private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

	private final AppUserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final CurrentUserService currentUserService;
	private final DataBackupService dataBackupService;

	public UserAccountService(
			AppUserRepository userRepository,
			PasswordEncoder passwordEncoder,
			CurrentUserService currentUserService,
			DataBackupService dataBackupService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.currentUserService = currentUserService;
		this.dataBackupService = dataBackupService;
	}

	@Transactional
	public UserResponse register(UserRegistrationRequest request) {
		String username = request.username().strip().toLowerCase(Locale.ROOT);
		if (userRepository.existsByUsernameIgnoreCase(username)) {
			throw new DuplicateResourceException("That username is already registered.");
		}
		if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
			throw new BadRequestException("password must be 72 UTF-8 bytes or less.");
		}

		AppUser user = userRepository.save(new AppUser(username, passwordEncoder.encode(request.password())));
		return toResponse(user);
	}

	@Transactional(readOnly = true)
	public UserResponse findByUsername(String username) {
		AppUser user = userRepository.findByUsernameIgnoreCase(username)
				.orElseThrow(() -> new ResourceNotFoundException("User account not found."));
		return toResponse(user);
	}

	@Transactional
	public UserResponse updatePreferences(UpdatePreferencesRequest request) {
		AppUser user = currentUserService.requireCurrentUser();
		user.changeWeightUnit(request.weightUnit());
		return toResponse(user);
	}

	@Transactional
	public void changePassword(ChangePasswordRequest request) {
		AppUser user = currentUserService.requireCurrentUser();
		requireMatchingPassword(user, request.currentPassword());
		validatePasswordLength(request.newPassword());
		if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
			throw new BadRequestException("New password must be different from the current password.");
		}
		user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
	}

	@Transactional
	public void deleteCurrentAccount(DeleteAccountRequest request) {
		AppUser user = currentUserService.requireCurrentUser();
		requireMatchingPassword(user, request.currentPassword());
		dataBackupService.deleteDataForUser(user.getId());
		userRepository.delete(user);
	}

	private void requireMatchingPassword(AppUser user, String password) {
		if (!passwordEncoder.matches(password, user.getPasswordHash())) {
			throw new BadRequestException("Current password is incorrect.");
		}
	}

	private void validatePasswordLength(String password) {
		if (password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
			throw new BadRequestException("new password must be 72 UTF-8 bytes or less.");
		}
	}

	private UserResponse toResponse(AppUser user) {
		return new UserResponse(
				user.getId(),
				user.getUsername(),
				user.getWeightUnit(),
				user.getCreatedAt());
	}
}
