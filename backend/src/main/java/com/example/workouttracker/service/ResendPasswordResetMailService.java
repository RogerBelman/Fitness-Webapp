package com.example.workouttracker.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.mail.MailSendException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
@ConditionalOnExpression("'${app.mail.provider:smtp}' == 'resend'")
public class ResendPasswordResetMailService implements PasswordResetMailService {

	private final RestClient client;
	private final String apiKey;
	private final String fromAddress;

	@Autowired
	public ResendPasswordResetMailService(
			@Value("${app.mail.resend.api-key}") String apiKey,
			@Value("${app.mail.from}") String fromAddress) {
		this(createClient(), apiKey, fromAddress);
	}

	ResendPasswordResetMailService(RestClient client, String apiKey, String fromAddress) {
		this.client = client;
		this.apiKey = apiKey;
		this.fromAddress = fromAddress;
	}

	@Override
	public void sendPasswordReset(String email, String resetUrl) {
		send(email, "Reset your Workout Tracker password",
				"Use this link within 30 minutes to reset your password:\n\n" + resetUrl
						+ "\n\nIf you did not request this, you can ignore this email.");
	}

	@Override
	public void sendEmailVerification(String email, String verificationUrl) {
		send(email, "Verify your Workout Tracker email",
				"Confirm your email address using this link within 24 hours:\n\n" + verificationUrl
						+ "\n\nIf you did not request this, you can ignore this email.");
	}

	private void send(String email, String subject, String text) {
		try {
			client.post()
					.uri("/emails")
					.headers(headers -> headers.setBearerAuth(apiKey))
					.contentType(MediaType.APPLICATION_JSON)
					.body(Map.of(
							"from", fromAddress,
							"to", List.of(email),
							"subject", subject,
							"text", text))
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientException exception) {
			// Do not expose provider response bodies, recipient addresses, or reset tokens in logs.
			throw new MailSendException("Account email could not be delivered through Resend.");
		}
	}

	private static RestClient createClient() {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(Duration.ofSeconds(5));
		factory.setReadTimeout(Duration.ofSeconds(10));
		return RestClient.builder().baseUrl("https://api.resend.com").requestFactory(factory).build();
	}
}
