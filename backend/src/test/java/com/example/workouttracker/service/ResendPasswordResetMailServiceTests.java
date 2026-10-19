package com.example.workouttracker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class ResendPasswordResetMailServiceTests {

	@Test
	void sendsResetLinkThroughAuthenticatedHttpsRequest() {
		RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		ResendPasswordResetMailService service = new ResendPasswordResetMailService(
				builder.build(), "test-api-key", "Workout Tracker <no-reply@workouts.example.com>");
		server.expect(requestTo("https://api.resend.com/emails"))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("Authorization", "Bearer test-api-key"))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(content().json("""
						{
						  "from": "Workout Tracker <no-reply@workouts.example.com>",
						  "to": ["person@example.com"],
						  "subject": "Reset your Workout Tracker password",
						  "text": "Use this link within 30 minutes to reset your password:\\n\\nhttps://workouts.example.com/reset-password?token=test-token\\n\\nIf you did not request this, you can ignore this email."
						}
						"""))
				.andRespond(withSuccess("{\"id\":\"test-message\"}", MediaType.APPLICATION_JSON));

		service.sendPasswordReset("person@example.com", "https://workouts.example.com/reset-password?token=test-token");
		server.verify();
	}

	@Test
	void deliveryFailureDoesNotExposeProviderResponseOrToken() {
		RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		ResendPasswordResetMailService service = new ResendPasswordResetMailService(
				builder.build(), "test-api-key", "no-reply@workouts.example.com");
		server.expect(requestTo("https://api.resend.com/emails"))
				.andRespond(withStatus(HttpStatus.FORBIDDEN).body("sensitive-provider-response"));

		assertThatThrownBy(() -> service.sendPasswordReset("person@example.com", "https://example.com/?token=secret"))
				.isInstanceOf(MailSendException.class)
				.hasMessage("Account email could not be delivered through Resend.")
				.hasNoCause();
		server.verify();
	}

	@Test
	void selectsResendWithoutRequiringSmtpSender() {
		new ApplicationContextRunner()
				.withUserConfiguration(ResendPasswordResetMailService.class,
						SmtpPasswordResetMailService.class, DisabledPasswordResetMailService.class)
				.withPropertyValues("app.mail.enabled=true", "app.mail.provider=resend",
						"app.mail.from=no-reply@workouts.example.com", "app.mail.resend.api-key=test-api-key")
				.run(context -> {
					assertThat(context).hasNotFailed().hasSingleBean(PasswordResetMailService.class);
					assertThat(context.getBean(PasswordResetMailService.class))
							.isInstanceOf(ResendPasswordResetMailService.class);
				});
	}
}
