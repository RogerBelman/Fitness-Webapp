package com.example.workouttracker.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "exercises")
public class Exercise {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 120)
	private String name;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@Column(name = "muscle_group", length = 80)
	private String muscleGroup;

	@Column(nullable = false, length = 80)
	private String category;

	@Column(length = 500)
	private String instructions;

	@Enumerated(EnumType.STRING)
	@Column(name = "training_type", nullable = false, length = 16)
	private TrainingType trainingType = TrainingType.STRENGTH;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Exercise() {
	}

	public Exercise(String name, String muscleGroup, String category) {
		this(name, muscleGroup, category, null);
	}

	public Exercise(String name, String muscleGroup, String category, String instructions) {
		this(name, muscleGroup, category, instructions, TrainingType.STRENGTH);
	}

	public Exercise(String name, String muscleGroup, String category, String instructions, TrainingType trainingType) {
		this(null, name, muscleGroup, category, instructions, trainingType);
	}

	public Exercise(AppUser user, String name, String muscleGroup, String category) {
		this(user, name, muscleGroup, category, null, TrainingType.STRENGTH);
	}

	public Exercise(AppUser user, String name, String muscleGroup, String category, String instructions) {
		this(user, name, muscleGroup, category, instructions, TrainingType.STRENGTH);
	}

	public Exercise(AppUser user, String name, String muscleGroup, String category, String instructions, TrainingType trainingType) {
		this.user = user;
		updateDetails(name, muscleGroup, category, instructions, trainingType);
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public AppUser getUser() {
		return user;
	}

	public String getMuscleGroup() {
		return muscleGroup;
	}

	public String getCategory() {
		return category;
	}

	public String getInstructions() {
		return instructions;
	}

	public TrainingType getTrainingType() {
		return trainingType;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void updateDetails(String name, String muscleGroup, String category, String instructions) {
		updateDetails(name, muscleGroup, category, instructions, trainingType);
	}

	public void updateDetails(String name, String muscleGroup, String category, String instructions, TrainingType trainingType) {
		this.name = name;
		this.muscleGroup = muscleGroup;
		this.category = category;
		this.instructions = instructions;
		this.trainingType = trainingType;
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
