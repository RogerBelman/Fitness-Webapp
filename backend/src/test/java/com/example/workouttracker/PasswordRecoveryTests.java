package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.repository.PasswordResetTokenRepository;
import com.example.workouttracker.service.PasswordResetMailService;

import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PasswordRecoveryTests {

	@Autowired private MockMvc mvc;
	@Autowired private EntityManager entityManager;
	@Autowired private JdbcTemplate jdbcTemplate;
	@Autowired private PasswordResetTokenRepository tokenRepository;
	@MockitoBean private PasswordResetMailService mailService;

	@Test
	void resetsThePasswordOnceAndExpiresExistingSessions() throws Exception {
		register("recovery_user", "recovery@example.com", "current-password");
		MockHttpSession activeSession = login("recovery_user", "current-password");

		mvc.perform(post("/api/auth/password/forgot")
				.contentType("application/json")
				.content("{\"email\":\"RECOVERY@example.com\"}"))
				.andExpect(status().isNoContent());

		ArgumentCaptor<String> resetUrl = ArgumentCaptor.forClass(String.class);
		verify(mailService).sendPasswordReset(eq("recovery@example.com"), resetUrl.capture());
		String token = resetUrl.getValue().substring(resetUrl.getValue().indexOf("token=") + 6);

		mvc.perform(post("/api/auth/password/reset")
				.contentType("application/json")
				.content("{\"token\":\"" + token + "\",\"newPassword\":\"updated-password\"}"))
				.andExpect(status().isNoContent());

		mvc.perform(get("/api/auth/me").session(activeSession))
				.andExpect(status().isUnauthorized());
		loginRequest("recovery_user", "current-password").andExpect(status().isUnauthorized());
		loginRequest("recovery_user", "updated-password").andExpect(status().isOk());

		mvc.perform(post("/api/auth/password/reset")
				.contentType("application/json")
				.content("{\"token\":\"" + token + "\",\"newPassword\":\"another-password\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void returnsTheSameResponseForAnUnknownEmail() throws Exception {
		mvc.perform(post("/api/auth/password/forgot")
				.contentType("application/json")
				.content("{\"email\":\"missing@example.com\"}"))
				.andExpect(status().isNoContent());

		verifyNoInteractions(mailService);
	}

	@Test
	void removesAnExpiredTokenWhenItIsRejected() throws Exception {
		register("expired_recovery_user", "expired@example.com", "current-password");
		mvc.perform(post("/api/auth/password/forgot")
				.contentType("application/json")
				.content("{\"email\":\"expired@example.com\"}"))
				.andExpect(status().isNoContent());

		ArgumentCaptor<String> resetUrl = ArgumentCaptor.forClass(String.class);
		verify(mailService).sendPasswordReset(eq("expired@example.com"), resetUrl.capture());
		String token = resetUrl.getValue().substring(resetUrl.getValue().indexOf("token=") + 6);
		String tokenHash = sha256(token);
		jdbcTemplate.update(
				"update password_reset_tokens set expires_at = now() - interval '1 minute' where token_hash = ?",
				tokenHash);
		entityManager.clear();

		mvc.perform(post("/api/auth/password/reset")
				.contentType("application/json")
				.content("{\"token\":\"" + token + "\",\"newPassword\":\"updated-password\"}"))
				.andExpect(status().isBadRequest());

		assertThat(tokenRepository.existsByTokenHash(tokenHash)).isFalse();
	}

	private void register(String username, String email, String password) throws Exception {
		mvc.perform(post("/api/auth/register")
				.contentType("application/json")
				.content("{\"username\":\"" + username + "\",\"email\":\"" + email
						+ "\",\"password\":\"" + password + "\"}"))
				.andExpect(status().isCreated());
	}

	private MockHttpSession login(String username, String password) throws Exception {
		return (MockHttpSession) loginRequest(username, password)
				.andExpect(status().isOk())
				.andReturn().getRequest().getSession(false);
	}

	private org.springframework.test.web.servlet.ResultActions loginRequest(String username, String password)
			throws Exception {
		return mvc.perform(post("/api/auth/login")
				.contentType("application/json")
				.content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"));
	}

	private String sha256(String value) throws Exception {
		return HexFormat.of().formatHex(
				MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
	}
}
