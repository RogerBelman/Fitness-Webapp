package com.example.workouttracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.Exercise;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

	List<Exercise> findByUserId(Long userId);

	List<Exercise> findByUserIdAndMuscleGroupIgnoreCase(Long userId, String muscleGroup);

	List<Exercise> findByUserIdAndCategoryIgnoreCase(Long userId, String category);

	List<Exercise> findByUserIdAndMuscleGroupIgnoreCaseAndCategoryIgnoreCase(
			Long userId, String muscleGroup, String category);

	Optional<Exercise> findByIdAndUserId(Long id, Long userId);

	boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

	boolean existsByUserIdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long id);
}
