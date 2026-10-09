package com.example.workouttracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.workouttracker.entity.CardioEntry;

public interface CardioEntryRepository extends JpaRepository<CardioEntry, Long> {
	boolean existsByWorkoutExercise_Exercise_Id(Long exerciseId);
}
