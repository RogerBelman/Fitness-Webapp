package com.example.workouttracker;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.repository.AppUserRepository;

@Configuration(proxyBeanMethods = false)
class MockMvcCsrfConfig {
	static final String TEST_USERNAME = "integration_test_user";

	@Bean
	MockMvcBuilderCustomizer csrfByDefault() {
		return builder -> builder.defaultRequest(get("/").with(csrf()).with(request -> {
			if (!request.getRequestURI().startsWith("/api/auth/")) {
				return user(TEST_USERNAME).postProcessRequest(request);
			}
			return request;
		}));
	}

	@Bean
	ApplicationRunner testUser(AppUserRepository users, PasswordEncoder passwordEncoder) {
		return arguments -> {
			if (!users.existsByUsernameIgnoreCase(TEST_USERNAME)) {
				users.save(new AppUser(TEST_USERNAME, passwordEncoder.encode("integration-test-password")));
			}
		};
	}

	@Bean
	TestUserSupport testUserSupport(AppUserRepository users) {
		return new TestUserSupport(users);
	}
}
