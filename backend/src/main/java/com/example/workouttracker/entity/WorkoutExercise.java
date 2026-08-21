package com.example.workouttracker.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "workout_exercises")
public class WorkoutExercise {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "workout_id", nullable = false)
	private Workout workout;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Column(name = "exercise_order", nullable = false)
	private Integer exerciseOrder;

	@Column
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@OneToMany(mappedBy = "workoutExercise", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("setNumber ASC")
	private List<SetEntry> setEntries = new ArrayList<>();

	protected WorkoutExercise() {
	}

	public WorkoutExercise(Workout workout, Exercise exercise, Integer exerciseOrder, String notes) {
		this.workout = workout;
		this.exercise = exercise;
		this.exerciseOrder = exerciseOrder;
		this.notes = notes;
		workout.addWorkoutExercise(this);
	}

	public Long getId() {
		return id;
	}

	public Workout getWorkout() {
		return workout;
	}

	public Exercise getExercise() {
		return exercise;
	}

	public Integer getExerciseOrder() {
		return exerciseOrder;
	}

	public String getNotes() {
		return notes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public List<SetEntry> getSetEntries() {
		return setEntries;
	}

	void addSetEntry(SetEntry setEntry) {
		if (!setEntries.contains(setEntry)) {
			setEntries.add(setEntry);
		}
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
