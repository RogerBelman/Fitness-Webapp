package com.example.workouttracker.repository;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.workouttracker.entity.EmailVerificationToken;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
	Optional<EmailVerificationToken> findByTokenHash(String tokenHash);
	boolean existsByUserIdAndCreatedAtAfter(Long userId, Instant createdAfter);
	void deleteByUserId(Long userId);
}
