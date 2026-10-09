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
@Table(name = "set_entries")
public class SetEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "workout_exercise_id", nullable = false)
	private WorkoutExercise workoutExercise;

	@Column(name = "set_number", nullable = false)
	private Integer setNumber;

	@Column(nullable = false)
	private Integer reps;

	@Column(nullable = false, precision = 7, scale = 2)
	private BigDecimal weight;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected SetEntry() {
	}

	public SetEntry(WorkoutExercise workoutExercise, Integer setNumber, Integer reps, BigDecimal weight) {
		this.workoutExercise = workoutExercise;
		this.setNumber = setNumber;
		this.reps = reps;
		this.weight = weight;
		workoutExercise.addSetEntry(this);
	}

	public Long getId() {
		return id;
	}

	public void updateDetails(Integer setNumber, Integer reps, BigDecimal weight) {
		this.setNumber = setNumber;
		this.reps = reps;
		this.weight = weight;
	}

	public WorkoutExercise getWorkoutExercise() {
		return workoutExercise;
	}

	public Integer getSetNumber() {
		return setNumber;
	}

	public Integer getReps() {
		return reps;
	}

	public BigDecimal getWeight() {
		return weight;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

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
