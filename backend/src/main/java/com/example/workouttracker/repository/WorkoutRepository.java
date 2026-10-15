package com.example.workouttracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.Workout;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {

	List<Workout> findByUserIdOrderByWorkoutDateDescIdDesc(Long userId);

	Optional<Workout> findByIdAndUserId(Long id, Long userId);
}
