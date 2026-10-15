package com.example.workouttracker.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.UserRegistrationRequest;
import com.example.workouttracker.dto.UserResponse;
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

	public UserAccountService(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
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
		return new UserResponse(user.getId(), user.getUsername(), user.getCreatedAt());
	}

	@Transactional(readOnly = true)
	public UserResponse findByUsername(String username) {
		AppUser user = userRepository.findByUsernameIgnoreCase(username)
				.orElseThrow(() -> new ResourceNotFoundException("User account not found."));
		return new UserResponse(user.getId(), user.getUsername(), user.getCreatedAt());
	}
}
