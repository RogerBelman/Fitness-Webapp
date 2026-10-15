package com.example.workouttracker;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class MockMvcCsrfConfig {

	@Bean
	MockMvcBuilderCustomizer csrfByDefault() {
		return builder -> builder.defaultRequest(get("/").with(csrf()));
	}
}
