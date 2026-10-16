package com.example.workouttracker.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.stereotype.Service;

@Service
public class UserSessionService {

	private final SessionRegistry sessionRegistry;

	public UserSessionService(SessionRegistry sessionRegistry) {
		this.sessionRegistry = sessionRegistry;
	}

	public void expireAllSessions(String username) {
		sessionRegistry.getAllPrincipals().stream()
				.filter(principal -> username.equalsIgnoreCase(usernameOf(principal)))
				.flatMap(principal -> sessionRegistry.getAllSessions(principal, false).stream())
				.forEach(session -> session.expireNow());
	}

	private String usernameOf(Object principal) {
		if (principal instanceof UserDetails userDetails) {
			return userDetails.getUsername();
		}
		return principal instanceof String value ? value : "";
	}
}
