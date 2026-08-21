package com.example.workouttracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.Workout;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {

	List<Workout> findAllByOrderByWorkoutDateDescIdDesc();
}
