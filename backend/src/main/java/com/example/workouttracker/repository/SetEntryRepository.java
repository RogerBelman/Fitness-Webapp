package com.example.workouttracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.SetEntry;

public interface SetEntryRepository extends JpaRepository<SetEntry, Long> {

	Optional<SetEntry> findFirstByWorkoutExerciseIdOrderBySetNumberDesc(Long workoutExerciseId);

	Optional<SetEntry> findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(Long exerciseId);

	boolean existsByWorkoutExerciseIdAndSetNumber(Long workoutExerciseId, Integer setNumber);
}
