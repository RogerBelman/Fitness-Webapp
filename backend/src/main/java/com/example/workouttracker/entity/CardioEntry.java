package com.example.workouttracker.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "cardio_entries")
public class CardioEntry {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "workout_exercise_id", nullable = false)
	private WorkoutExercise workoutExercise;

	@Column(name = "duration_minutes", nullable = false, precision = 7, scale = 2)
	private BigDecimal durationMinutes;

	@Column(precision = 5, scale = 2)
	private BigDecimal level;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected CardioEntry() {
	}

	public CardioEntry(WorkoutExercise workoutExercise, BigDecimal durationMinutes, BigDecimal level) {
		this.workoutExercise = workoutExercise;
		updateDetails(durationMinutes, level);
		workoutExercise.addCardioEntry(this);
	}

	public void updateDetails(BigDecimal durationMinutes, BigDecimal level) {
		this.durationMinutes = durationMinutes;
		this.level = level;
	}

	public Long getId() {
		return id;
	}

	public WorkoutExercise getWorkoutExercise() {
		return workoutExercise;
	}

	public BigDecimal getDurationMinutes() {
		return durationMinutes;
	}

	public BigDecimal getLevel() {
		return level;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
		updatedAt = createdAt;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}
}
