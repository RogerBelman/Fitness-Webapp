package com.example.workouttracker.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.workouttracker.dto.ApiErrorResponse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

@Component
@ConditionalOnProperty(name = "app.auth.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final Map<String, Limit> LIMITS = Map.of(
			"POST /api/auth/login", new Limit(10, Duration.ofMinutes(1)),
			"POST /api/auth/register", new Limit(5, Duration.ofHours(1)),
			"POST /api/auth/password/forgot", new Limit(5, Duration.ofMinutes(15)),
			"POST /api/auth/password/reset", new Limit(10, Duration.ofMinutes(15)),
			"POST /api/auth/email/verify", new Limit(10, Duration.ofMinutes(15)),
			"POST /api/auth/email/verification", new Limit(5, Duration.ofMinutes(15)));
	private static final int CLEANUP_THRESHOLD = 10_000;

	private final JsonMapper jsonMapper;
	private final Clock clock;
	private final ConcurrentHashMap<String, AttemptWindow> attempts = new ConcurrentHashMap<>();

	@Autowired
	public AuthRateLimitFilter(JsonMapper jsonMapper) {
		this(jsonMapper, Clock.systemUTC());
	}

	AuthRateLimitFilter(JsonMapper jsonMapper, Clock clock) {
		this.jsonMapper = jsonMapper;
		this.clock = clock;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		String route = request.getMethod() + " " + request.getRequestURI();
		Limit limit = LIMITS.get(route);
		if (limit == null) {
			filterChain.doFilter(request, response);
			return;
		}

		Instant now = clock.instant();
		Decision decision = recordAttempt(route + "|" + request.getRemoteAddr(), limit, now);
		if (decision.allowed()) {
			filterChain.doFilter(request, response);
			return;
		}

		response.setStatus(429);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
		jsonMapper.writeValue(response.getOutputStream(), new ApiErrorResponse(
				now,
				429,
				"Too Many Requests",
				"Too many authentication attempts. Please try again later.",
				request.getRequestURI(),
				Map.of()));
	}

	private Decision recordAttempt(String key, Limit limit, Instant now) {
		if (attempts.size() > CLEANUP_THRESHOLD) {
			attempts.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
		}

		AttemptWindow window = attempts.computeIfAbsent(key, ignored -> new AttemptWindow(limit.window()));
		synchronized (window) {
			window.removeExpired(now);
			if (window.timestamps.size() >= limit.maximumAttempts()) {
				long retryAfter = Math.max(1,
						Duration.between(now, window.timestamps.peekFirst().plus(limit.window())).toSeconds());
				return new Decision(false, retryAfter);
			}
			window.timestamps.addLast(now);
			return new Decision(true, 0);
		}
	}

	private record Limit(int maximumAttempts, Duration window) { }

	private record Decision(boolean allowed, long retryAfterSeconds) { }

	private static final class AttemptWindow {
		private final ArrayDeque<Instant> timestamps = new ArrayDeque<>();
		private final Duration duration;

		private AttemptWindow(Duration duration) {
			this.duration = duration;
		}

		private void removeExpired(Instant now) {
			Instant cutoff = now.minus(duration);
			while (!timestamps.isEmpty() && !timestamps.peekFirst().isAfter(cutoff)) {
				timestamps.removeFirst();
			}
		}

		private boolean isExpired(Instant now) {
			synchronized (this) {
				removeExpired(now);
				return timestamps.isEmpty();
			}
		}
	}
}
