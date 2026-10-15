package com.example.workouttracker.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "workouts")
public class Workout {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@Column(name = "workout_date", nullable = false)
	private LocalDate workoutDate;

	@Column(length = 120)
	private String title;

	@Column
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@OneToMany(mappedBy = "workout", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("exerciseOrder ASC")
	private List<WorkoutExercise> workoutExercises = new ArrayList<>();

	protected Workout() {
	}

	public Workout(LocalDate workoutDate, String title, String notes) {
		this(null, workoutDate, title, notes);
	}

	public Workout(AppUser user, LocalDate workoutDate, String title, String notes) {
		this.user = user;
		this.workoutDate = workoutDate;
		this.title = title;
		this.notes = notes;
	}

	public Long getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public void updateDetails(LocalDate workoutDate, String title, String notes) {
		this.workoutDate = workoutDate;
		this.title = title;
		this.notes = notes;
	}

	public void removeWorkoutExercise(WorkoutExercise workoutExercise) {
		workoutExercises.remove(workoutExercise);
	}

	public LocalDate getWorkoutDate() {
		return workoutDate;
	}

	public String getTitle() {
		return title;
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

	public List<WorkoutExercise> getWorkoutExercises() {
		return workoutExercises;
	}

	void addWorkoutExercise(WorkoutExercise workoutExercise) {
		if (!workoutExercises.contains(workoutExercise)) {
			workoutExercises.add(workoutExercise);
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
