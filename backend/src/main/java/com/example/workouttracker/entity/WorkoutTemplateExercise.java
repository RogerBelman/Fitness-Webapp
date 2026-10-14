package com.example.workouttracker.entity;

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
@Table(name = "workout_template_exercises")
public class WorkoutTemplateExercise {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "workout_template_id", nullable = false)
	private WorkoutTemplate workoutTemplate;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Column(name = "exercise_order", nullable = false)
	private Integer exerciseOrder;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected WorkoutTemplateExercise() {
	}

	public WorkoutTemplateExercise(WorkoutTemplate workoutTemplate, Exercise exercise, Integer exerciseOrder) {
		this.workoutTemplate = workoutTemplate;
		this.exercise = exercise;
		this.exerciseOrder = exerciseOrder;
		workoutTemplate.addExercise(this);
	}

	public Long getId() {
		return id;
	}

	public Exercise getExercise() {
		return exercise;
	}

	public WorkoutTemplate getWorkoutTemplate() {
		return workoutTemplate;
	}

	public Integer getExerciseOrder() {
		return exerciseOrder;
	}

	public void updateOrder(Integer exerciseOrder) {
		this.exerciseOrder = exerciseOrder;
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
