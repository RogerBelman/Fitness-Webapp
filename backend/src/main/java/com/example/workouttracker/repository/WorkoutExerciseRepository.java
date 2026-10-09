package com.example.workouttracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.WorkoutExercise;

public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, Long> {

	Optional<WorkoutExercise> findFirstByWorkoutIdOrderByExerciseOrderDesc(Long workoutId);

	Optional<WorkoutExercise> findByWorkoutIdAndExerciseOrder(Long workoutId, Integer exerciseOrder);

	boolean existsByWorkoutIdAndExerciseOrder(Long workoutId, Integer exerciseOrder);

	boolean existsByExerciseId(Long exerciseId);
}
