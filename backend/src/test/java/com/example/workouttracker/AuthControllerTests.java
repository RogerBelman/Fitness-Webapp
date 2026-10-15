package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.repository.AppUserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTests {

	@Autowired private MockMvc mvc;
	@Autowired private AppUserRepository users;
	@Autowired private PasswordEncoder passwordEncoder;

	@Test
	void registersAUserWithANormalizedUsernameAndHashedPassword() throws Exception {
		mvc.perform(post("/api/auth/register")
				.contentType("application/json")
				.content("{\"username\":\"Learning_User\",\"password\":\"correct horse battery staple\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.username").value("learning_user"))
				.andExpect(jsonPath("$", not(hasKey("password"))))
				.andExpect(jsonPath("$", not(hasKey("passwordHash"))));

		AppUser saved = users.findByUsernameIgnoreCase("LEARNING_USER").orElseThrow();
		org.assertj.core.api.Assertions.assertThat(saved.getPasswordHash())
				.isNotEqualTo("correct horse battery staple");
		org.assertj.core.api.Assertions.assertThat(
				passwordEncoder.matches("correct horse battery staple", saved.getPasswordHash())).isTrue();
	}

	@Test
	void rejectsDuplicateUsernamesIgnoringCase() throws Exception {
		register("case_user", "first-password").andExpect(status().isCreated());
		register("CASE_USER", "second-password")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("That username is already registered."));
	}

	@Test
	void validatesUsernameAndPasswordBeforeSaving() throws Exception {
		mvc.perform(post("/api/auth/register")
				.contentType("application/json")
				.content("{\"username\":\"no spaces allowed\",\"password\":\"short\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.fieldErrors.username").exists())
				.andExpect(jsonPath("$.fieldErrors.password").exists());
	}

	@Test
	void rejectsPasswordsThatExceedTheBcryptByteLimit() throws Exception {
		register("unicode_user", "é".repeat(40))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("password must be 72 UTF-8 bytes or less."));
	}

	@Test
	void logsInAndRestoresTheUserFromTheSession() throws Exception {
		register("session_user", "session-password").andExpect(status().isCreated());

		MvcResult loginResult = login("SESSION_USER", "session-password")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("session_user"))
				.andReturn();
		MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
		assertThat(session).isNotNull();

		mvc.perform(get("/api/auth/me").session(session))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("session_user"));
	}

	@Test
	void rejectsInvalidCredentialsWithoutRevealingWhichValueWasWrong() throws Exception {
		register("known_user", "correct-password").andExpect(status().isCreated());

		login("known_user", "wrong-password")
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Invalid username or password."));
		login("missing_user", "wrong-password")
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Invalid username or password."));
	}

	@Test
	void requiresAuthenticationForCurrentUser() throws Exception {
		mvc.perform(get("/api/auth/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Authentication is required."));
	}

	@Test
	void providesACsrfTokenForBrowserWrites() throws Exception {
		mvc.perform(get("/api/auth/csrf"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
				.andExpect(jsonPath("$.token").isNotEmpty());
	}

	@Test
	void rejectsAnUnsafeRequestWithAnInvalidCsrfToken() throws Exception {
		mvc.perform(post("/api/auth/login")
				.with(csrf().useInvalidToken())
				.contentType("application/json")
				.content("{\"username\":\"someone\",\"password\":\"some-password\"}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("Request could not be verified."));
	}

	@Test
	void logsOutAndInvalidatesTheSession() throws Exception {
		register("logout_user", "logout-password").andExpect(status().isCreated());
		MvcResult loginResult = login("logout_user", "logout-password")
				.andExpect(status().isOk())
				.andReturn();
		MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

		mvc.perform(post("/api/auth/logout").session(session))
				.andExpect(status().isNoContent());
		assertThat(session.isInvalid()).isTrue();
	}

	@Test
	void keepsWorkoutRoutesPublicDuringTheAuthenticationPhase() throws Exception {
		mvc.perform(get("/api/workouts"))
				.andExpect(status().isOk());
	}

	@Test
	void allowsTheLocalFrontendToSendSessionCookies() throws Exception {
		mvc.perform(options("/api/auth/login")
				.header("Origin", "http://localhost:5173")
				.header("Access-Control-Request-Method", "POST"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
				.andExpect(header().string("Access-Control-Allow-Credentials", "true"));
	}

	private org.springframework.test.web.servlet.ResultActions register(String username, String password)
			throws Exception {
		return mvc.perform(post("/api/auth/register")
				.contentType("application/json")
				.content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"));
	}

	private org.springframework.test.web.servlet.ResultActions login(String username, String password)
			throws Exception {
		return mvc.perform(post("/api/auth/login")
				.contentType("application/json")
				.content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"));
	}
}
