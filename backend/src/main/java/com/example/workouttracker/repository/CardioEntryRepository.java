package com.example.workouttracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.example.workouttracker.entity.CardioEntry;

public interface CardioEntryRepository extends JpaRepository<CardioEntry, Long> {
	boolean existsByWorkoutExercise_Exercise_Id(Long exerciseId);

	@Query("""
			select entry from CardioEntry entry
			join fetch entry.workoutExercise workoutExercise
			join fetch workoutExercise.workout workout
			where workoutExercise.exercise.id = :exerciseId
			order by workout.workoutDate asc, workout.id asc, entry.id asc
			""")
	List<CardioEntry> findAllForExerciseHistory(@Param("exerciseId") Long exerciseId);
}
