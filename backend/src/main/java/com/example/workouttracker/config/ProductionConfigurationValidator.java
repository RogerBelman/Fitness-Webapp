package com.example.workouttracker.config;

import java.net.URI;
import java.util.Arrays;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@Profile("prod")
public class ProductionConfigurationValidator {

	private final String datasourceUrl;
	private final String frontendBaseUrl;
	private final String allowedOrigins;
	private final String mailHost;
	private final String mailFrom;
	private final String mailUsername;
	private final String mailPassword;
	private final boolean secureCookie;

	public ProductionConfigurationValidator(
			@Value("${spring.datasource.url}") String datasourceUrl,
			@Value("${app.frontend-base-url}") String frontendBaseUrl,
			@Value("${app.cors.allowed-origins}") String allowedOrigins,
			@Value("${spring.mail.host}") String mailHost,
			@Value("${app.mail.from}") String mailFrom,
			@Value("${spring.mail.username}") String mailUsername,
			@Value("${spring.mail.password}") String mailPassword,
			@Value("${server.servlet.session.cookie.secure}") boolean secureCookie) {
		this.datasourceUrl = datasourceUrl;
		this.frontendBaseUrl = frontendBaseUrl;
		this.allowedOrigins = allowedOrigins;
		this.mailHost = mailHost;
		this.mailFrom = mailFrom;
		this.mailUsername = mailUsername;
		this.mailPassword = mailPassword;
		this.secureCookie = secureCookie;
	}

	@PostConstruct
	public void validate() {
		requireRemoteValue("SPRING_DATASOURCE_URL", datasourceUrl);
		requireHttpsUrl("APP_FRONTEND_BASE_URL", frontendBaseUrl);
		String[] origins = Arrays.stream(allowedOrigins.split(","))
				.map(String::strip)
				.filter(value -> !value.isBlank())
				.toArray(String[]::new);
		if (origins.length == 0) {
			throw invalid("APP_CORS_ALLOWED_ORIGINS must contain at least one HTTPS origin.");
		}
		for (String origin : origins) {
			requireHttpsUrl("APP_CORS_ALLOWED_ORIGINS", origin);
		}
		requireRemoteValue("SPRING_MAIL_HOST", mailHost);
		requireText("APP_MAIL_FROM", mailFrom);
		requireText("SPRING_MAIL_USERNAME", mailUsername);
		requireText("SPRING_MAIL_PASSWORD", mailPassword);
		if (!secureCookie) {
			throw invalid("SESSION_COOKIE_SECURE must be true in production.");
		}
	}

	private void requireHttpsUrl(String variable, String value) {
		requireText(variable, value);
		URI uri;
		try {
			uri = URI.create(value);
		} catch (IllegalArgumentException exception) {
			throw invalid(variable + " must be a valid HTTPS URL.");
		}
		if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || isLocal(uri.getHost())) {
			throw invalid(variable + " must be a non-local HTTPS URL.");
		}
	}

	private void requireRemoteValue(String variable, String value) {
		requireText(variable, value);
		if (isLocal(value)) {
			throw invalid(variable + " must not point to localhost in production.");
		}
	}

	private void requireText(String variable, String value) {
		if (value == null || value.isBlank() || value.startsWith("${")) {
			throw invalid(variable + " is required in production.");
		}
	}

	private boolean isLocal(String value) {
		String normalized = value.toLowerCase(Locale.ROOT);
		return normalized.contains("localhost")
				|| normalized.contains("127.0.0.1")
				|| normalized.contains("[::1]");
	}

	private IllegalStateException invalid(String message) {
		return new IllegalStateException("Invalid production configuration: " + message);
	}
}
