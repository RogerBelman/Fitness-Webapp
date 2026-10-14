package com.example.workouttracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.ExerciseGoal;
import com.example.workouttracker.entity.GoalMetric;

public interface ExerciseGoalRepository extends JpaRepository<ExerciseGoal, Long> {

	List<ExerciseGoal> findAllByOrderByCreatedAtDescIdDesc();

	boolean existsByExerciseId(Long exerciseId);

	boolean existsByExerciseIdAndMetric(Long exerciseId, GoalMetric metric);

	boolean existsByExerciseIdAndMetricAndIdNot(Long exerciseId, GoalMetric metric, Long id);
}
