package com.example.workouttracker.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.CsrfTokenResponse;
import com.example.workouttracker.dto.ChangePasswordRequest;
import com.example.workouttracker.dto.ChangeEmailRequest;
import com.example.workouttracker.dto.DeleteAccountRequest;
import com.example.workouttracker.dto.LoginRequest;
import com.example.workouttracker.dto.ForgotPasswordRequest;
import com.example.workouttracker.dto.ResetPasswordRequest;
import com.example.workouttracker.dto.UserRegistrationRequest;
import com.example.workouttracker.dto.UserResponse;
import com.example.workouttracker.dto.UpdatePreferencesRequest;
import com.example.workouttracker.service.UserAccountService;
import com.example.workouttracker.service.UserSessionService;
import com.example.workouttracker.service.PasswordRecoveryService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UserAccountService userAccountService;
	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository securityContextRepository;
	private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
	private final UserSessionService userSessionService;
	private final PasswordRecoveryService passwordRecoveryService;

	public AuthController(
			UserAccountService userAccountService,
			AuthenticationManager authenticationManager,
			SecurityContextRepository securityContextRepository,
			SessionAuthenticationStrategy sessionAuthenticationStrategy,
			UserSessionService userSessionService,
			PasswordRecoveryService passwordRecoveryService) {
		this.userAccountService = userAccountService;
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
		this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
		this.userSessionService = userSessionService;
		this.passwordRecoveryService = passwordRecoveryService;
	}

	@PostMapping("/register")
	public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(userAccountService.register(request));
	}

	@GetMapping("/csrf")
	public CsrfTokenResponse csrf(CsrfToken csrfToken) {
		return new CsrfTokenResponse(csrfToken.getHeaderName(), csrfToken.getToken());
	}

	@PostMapping("/login")
	public UserResponse login(
			@Valid @RequestBody LoginRequest request,
			HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		Authentication authentication = authenticationManager.authenticate(
				UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
		sessionAuthenticationStrategy.onAuthentication(authentication, httpRequest, httpResponse);

		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(authentication);
		SecurityContextHolder.setContext(context);
		securityContextRepository.saveContext(context, httpRequest, httpResponse);

		return userAccountService.findByUsername(authentication.getName());
	}

	@GetMapping("/me")
	public UserResponse currentUser(Authentication authentication) {
		return userAccountService.findByUsername(authentication.getName());
	}

	@PutMapping("/preferences")
	public UserResponse updatePreferences(@Valid @RequestBody UpdatePreferencesRequest request) {
		return userAccountService.updatePreferences(request);
	}

	@PutMapping("/email")
	public UserResponse changeRecoveryEmail(@Valid @RequestBody ChangeEmailRequest request) {
		return userAccountService.changeRecoveryEmail(request);
	}

	@PostMapping("/password/forgot")
	public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		passwordRecoveryService.requestReset(request);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/password/reset")
	public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		String username = passwordRecoveryService.resetPassword(request);
		userSessionService.expireAllSessions(username);
		return ResponseEntity.noContent().build();
	}

	@PutMapping("/password")
	public ResponseEntity<Void> changePassword(
			@Valid @RequestBody ChangePasswordRequest request,
			Authentication authentication,
			HttpServletRequest httpRequest) {
		userAccountService.changePassword(request);
		userSessionService.expireAllSessions(authentication.getName());
		endSession(httpRequest);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/account")
	public ResponseEntity<Void> deleteAccount(
			@Valid @RequestBody DeleteAccountRequest request,
			Authentication authentication,
			HttpServletRequest httpRequest) {
		userAccountService.deleteCurrentAccount(request);
		userSessionService.expireAllSessions(authentication.getName());
		endSession(httpRequest);
		return ResponseEntity.noContent().build();
	}

	private void endSession(HttpServletRequest request) {
		if (request.getSession(false) != null) {
			request.getSession(false).invalidate();
		}
		SecurityContextHolder.clearContext();
	}
}
