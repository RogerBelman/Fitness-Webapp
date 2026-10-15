package com.example.workouttracker;

import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.repository.AppUserRepository;

class TestUserSupport {

	private final AppUserRepository users;

	TestUserSupport(AppUserRepository users) {
		this.users = users;
	}

	AppUser owner() {
		return users.findByUsernameIgnoreCase(MockMvcCsrfConfig.TEST_USERNAME).orElseThrow();
	}
}
