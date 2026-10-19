package com.example.workouttracker.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.repository.AppUserRepository;

@Service
public class AppUserDetailsService implements UserDetailsService {

	private final AppUserRepository userRepository;

	public AppUserDetailsService(AppUserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		String identifier = username.strip();
		AppUser user = (identifier.contains("@")
				? userRepository.findByEmailIgnoreCase(identifier)
				: userRepository.findByUsernameIgnoreCase(identifier))
				.orElseThrow(() -> new UsernameNotFoundException("User account not found."));

		return User.withUsername(user.getUsername())
				.password(user.getPasswordHash())
				.roles("USER")
				.build();
	}
}
