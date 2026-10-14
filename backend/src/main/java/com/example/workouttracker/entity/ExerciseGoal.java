package com.example.workouttracker.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "exercise_goals", uniqueConstraints = @UniqueConstraint(
		name = "uk_exercise_goals_exercise_metric", columnNames = { "exercise_id", "metric" }))
public class ExerciseGoal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private GoalMetric metric;

	@Column(name = "target_value", nullable = false, precision = 10, scale = 2)
	private BigDecimal targetValue;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ExerciseGoal() {
	}

	public ExerciseGoal(Exercise exercise, GoalMetric metric, BigDecimal targetValue) {
		updateDetails(exercise, metric, targetValue);
	}

	public void updateDetails(Exercise exercise, GoalMetric metric, BigDecimal targetValue) {
		this.exercise = exercise;
		this.metric = metric;
		this.targetValue = targetValue;
	}

	public Long getId() { return id; }
	public Exercise getExercise() { return exercise; }
	public GoalMetric getMetric() { return metric; }
	public BigDecimal getTargetValue() { return targetValue; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}
}
