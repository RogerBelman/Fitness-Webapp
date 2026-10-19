package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.example.workouttracker.repository.AppUserRepository;
import com.example.workouttracker.service.PasswordResetMailService;

@SpringBootTest
@AutoConfigureMockMvc
class EmailVerificationTests {
	@Autowired private MockMvc mvc;
	@Autowired private AppUserRepository users;
	@Autowired private JdbcTemplate jdbc;
	@MockitoBean private PasswordResetMailService mail;
	private String username;
	private String email;

	@BeforeEach
	void uniqueAccount() {
		username = "verify_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
		email = username + "@example.com";
	}

	@AfterEach
	void cleanup() {
		users.findByUsernameIgnoreCase(username).ifPresent(users::delete);
	}

	@Test
	void emailLoginKeepsCanonicalUsernameAndAllowsUnverifiedAccess() throws Exception {
		register();
		var result = mvc.perform(post("/api/auth/login").contentType("application/json")
				.content("{\"username\":\"  " + email.toUpperCase() + "  \",\"password\":\"test-password\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.username").value(username))
				.andExpect(jsonPath("$.emailVerified").value(false)).andReturn();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
		mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(username));
	}

	@Test
	void verificationIsHashedSingleUseAndNeedsNoLogin() throws Exception {
		register();
		String token = sentToken(email);
		String stored = jdbc.queryForObject("select token_hash from email_verification_tokens where user_id = ?",
				String.class, users.findByUsernameIgnoreCase(username).orElseThrow().getId());
		assertThat(stored).hasSize(64).isNotEqualTo(token);
		verifyToken(token, 204);
		assertThat(users.findByUsernameIgnoreCase(username).orElseThrow().isEmailVerified()).isTrue();
		verifyToken(token, 400);
	}

	@Test
	void rejectsExpiredLinks() throws Exception {
		register();
		String token = sentToken(email);
		jdbc.update("update email_verification_tokens set expires_at = now() - interval '1 second' where user_id = ?",
				users.findByUsernameIgnoreCase(username).orElseThrow().getId());
		verifyToken(token, 400);
		assertThat(users.findByUsernameIgnoreCase(username).orElseThrow().isEmailVerified()).isFalse();
	}

	@Test
	void resendIsAuthenticatedThrottledAndReplacesOldLink() throws Exception {
		register();
		String oldToken = sentToken(email);
		mvc.perform(post("/api/auth/email/verification")).andExpect(status().isUnauthorized());
		mvc.perform(post("/api/auth/email/verification").with(user(username))).andExpect(status().isBadRequest());
		jdbc.update("update email_verification_tokens set created_at = now() - interval '3 minutes' where user_id = ?",
				users.findByUsernameIgnoreCase(username).orElseThrow().getId());
		clearInvocations(mail);
		mvc.perform(post("/api/auth/email/verification").with(user(username))).andExpect(status().isNoContent());
		String freshToken = sentToken(email);
		assertThat(freshToken).isNotEqualTo(oldToken);
		verifyToken(oldToken, 400);
		verifyToken(freshToken, 204);
	}

	@Test
	void correctingEmailInvalidatesOldLinkAndRequiresVerificationAgain() throws Exception {
		register();
		String oldToken = sentToken(email);
		String corrected = "corrected_" + email;
		mvc.perform(put("/api/auth/email").with(user(username)).contentType("application/json")
				.content("{\"email\":\"" + corrected + "\",\"currentPassword\":\"test-password\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.emailVerified").value(false));
		verifyToken(oldToken, 400);
		verifyToken(sentToken(corrected), 204);
		mvc.perform(put("/api/auth/email").with(user(username)).contentType("application/json")
				.content("{\"email\":\"" + corrected + "\",\"currentPassword\":\"test-password\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.emailVerified").value(true));
		mvc.perform(put("/api/auth/email").with(user(username)).contentType("application/json")
				.content("{\"email\":\"" + email + "\",\"currentPassword\":\"test-password\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.emailVerified").value(false));
	}

	@Test
	void deliveryFailureDoesNotLoseNewAccount() throws Exception {
		doThrow(new MailSendException("Test failure")).when(mail).sendEmailVerification(eq(email), anyString());
		register();
		assertThat(users.findByUsernameIgnoreCase(username)).isPresent();
		mvc.perform(post("/api/auth/login").contentType("application/json")
				.content("{\"username\":\"" + username + "\",\"password\":\"test-password\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void failedResendPreservesPreviousWorkingLink() throws Exception {
		register();
		String previous = sentToken(email);
		jdbc.update("update email_verification_tokens set created_at = now() - interval '3 minutes' where user_id = ?",
				users.findByUsernameIgnoreCase(username).orElseThrow().getId());
		doThrow(new MailSendException("Test failure")).when(mail).sendEmailVerification(eq(email), anyString());
		mvc.perform(post("/api/auth/email/verification").with(user(username)))
				.andExpect(status().isInternalServerError());
		verifyToken(previous, 204);
	}

	private void register() throws Exception {
		mvc.perform(post("/api/auth/register").contentType("application/json")
				.content("{\"username\":\"" + username + "\",\"email\":\"" + email + "\",\"password\":\"test-password\"}"))
				.andExpect(status().isCreated());
	}

	private String sentToken(String destination) {
		ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
		verify(mail).sendEmailVerification(eq(destination), url.capture());
		return url.getValue().substring(url.getValue().indexOf("token=") + 6);
	}

	private void verifyToken(String token, int statusCode) throws Exception {
		mvc.perform(post("/api/auth/email/verify").contentType("application/json")
				.content("{\"token\":\"" + token + "\"}"))
				.andExpect(status().is(statusCode));
	}
}
