package com.example.workouttracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.WorkoutTemplateExercise;

public interface WorkoutTemplateExerciseRepository extends JpaRepository<WorkoutTemplateExercise, Long> {

	boolean existsByExerciseId(Long exerciseId);

	Optional<WorkoutTemplateExercise> findFirstByWorkoutTemplateIdOrderByExerciseOrderDesc(Long templateId);

	Optional<WorkoutTemplateExercise> findByWorkoutTemplateIdAndExerciseOrder(
			Long templateId, Integer exerciseOrder);

	boolean existsByWorkoutTemplateIdAndExerciseOrder(Long templateId, Integer exerciseOrder);
}
