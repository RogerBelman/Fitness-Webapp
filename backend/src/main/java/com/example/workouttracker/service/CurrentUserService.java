package com.example.workouttracker.service;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.repository.AppUserRepository;

@Service
public class CurrentUserService {

	private final AppUserRepository userRepository;

	public CurrentUserService(AppUserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public AppUser requireCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated()
				|| authentication instanceof AnonymousAuthenticationToken) {
			throw new ResourceNotFoundException("User account not found.");
		}
		return userRepository.findByUsernameIgnoreCase(authentication.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User account not found."));
	}
}
