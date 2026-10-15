package com.example.workouttracker.entity;

import java.time.Instant;
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
@Table(name = "workout_templates")
public class WorkoutTemplate {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(length = 500)
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@OneToMany(mappedBy = "workoutTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("exerciseOrder ASC")
	private List<WorkoutTemplateExercise> exercises = new ArrayList<>();

	protected WorkoutTemplate() {
	}

	public WorkoutTemplate(String name, String notes) {
		this(null, name, notes);
	}

	public WorkoutTemplate(AppUser user, String name, String notes) {
		this.user = user;
		this.name = name;
		this.notes = notes;
	}

	public Long getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public String getName() {
		return name;
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

	public List<WorkoutTemplateExercise> getExercises() {
		return exercises;
	}

	public void updateDetails(String name, String notes) {
		this.name = name;
		this.notes = notes;
	}

	void addExercise(WorkoutTemplateExercise exercise) {
		if (!exercises.contains(exercise)) {
			exercises.add(exercise);
		}
	}

	public void removeExercise(WorkoutTemplateExercise exercise) {
		exercises.remove(exercise);
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
