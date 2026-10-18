package com.example.workouttracker.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

	Optional<PasswordResetToken> findByTokenHash(String tokenHash);

	boolean existsByTokenHash(String tokenHash);

	boolean existsByUserIdAndCreatedAtAfter(Long userId, Instant createdAfter);

	void deleteByUserId(Long userId);
}
