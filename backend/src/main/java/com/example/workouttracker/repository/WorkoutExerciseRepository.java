package com.example.workouttracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.WorkoutExercise;

public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, Long> {

	Optional<WorkoutExercise> findFirstByWorkoutIdOrderByExerciseOrderDesc(Long workoutId);

	boolean existsByWorkoutIdAndExerciseOrder(Long workoutId, Integer exerciseOrder);

	boolean existsByWorkoutIdAndExerciseOrderAndIdNot(Long workoutId, Integer exerciseOrder, Long id);

	boolean existsByExerciseId(Long exerciseId);
}
