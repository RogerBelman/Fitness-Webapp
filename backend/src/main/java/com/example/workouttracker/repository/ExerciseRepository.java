package com.example.workouttracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.Exercise;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

	List<Exercise> findByMuscleGroupIgnoreCase(String muscleGroup);

	List<Exercise> findByCategoryIgnoreCase(String category);

	List<Exercise> findByMuscleGroupIgnoreCaseAndCategoryIgnoreCase(String muscleGroup, String category);

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
