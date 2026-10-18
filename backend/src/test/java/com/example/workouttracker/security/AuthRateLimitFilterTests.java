package com.example.workouttracker.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import tools.jackson.databind.json.JsonMapper;

class AuthRateLimitFilterTests {

	@Test
	void limitsRepeatedLoginAttemptsFromTheSameAddress() throws Exception {
		AuthRateLimitFilter filter = new AuthRateLimitFilter(
				JsonMapper.builder().build(),
				Clock.fixed(Instant.parse("2026-10-17T12:00:00Z"), ZoneOffset.UTC));
		AtomicInteger allowedRequests = new AtomicInteger();

		for (int attempt = 0; attempt < 10; attempt++) {
			MockHttpServletResponse response = sendLogin(filter, allowedRequests);
			assertThat(response.getStatus()).isEqualTo(200);
		}

		MockHttpServletResponse blocked = sendLogin(filter, allowedRequests);
		assertThat(blocked.getStatus()).isEqualTo(429);
		assertThat(blocked.getHeader("Retry-After")).isEqualTo("60");
		assertThat(blocked.getContentAsString()).contains("Too many authentication attempts");
		assertThat(allowedRequests).hasValue(10);
	}

	@Test
	void allowsRoutesOutsideAuthenticationLimits() throws Exception {
		AuthRateLimitFilter filter = new AuthRateLimitFilter(
				JsonMapper.builder().build(),
				Clock.systemUTC());
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/workouts");
		MockHttpServletResponse response = new MockHttpServletResponse();
		AtomicInteger allowedRequests = new AtomicInteger();

		filter.doFilter(request, response, (servletRequest, servletResponse) ->
				allowedRequests.incrementAndGet());

		assertThat(allowedRequests).hasValue(1);
		assertThat(response.getStatus()).isEqualTo(200);
	}

	private MockHttpServletResponse sendLogin(
			AuthRateLimitFilter filter,
			AtomicInteger allowedRequests) throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
		request.setRemoteAddr("203.0.113.10");
		MockHttpServletResponse response = new MockHttpServletResponse();
		filter.doFilter(request, response, (servletRequest, servletResponse) ->
				allowedRequests.incrementAndGet());
		return response;
	}
}
