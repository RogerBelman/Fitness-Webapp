package com.example.workouttracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.workouttracker.entity.SetEntry;

public interface SetEntryRepository extends JpaRepository<SetEntry, Long> {

	Optional<SetEntry> findFirstByWorkoutExerciseIdOrderBySetNumberDesc(Long workoutExerciseId);

	Optional<SetEntry> findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(Long exerciseId);

	@Query("""
			select setEntry
			from SetEntry setEntry
			join fetch setEntry.workoutExercise workoutExercise
			join fetch workoutExercise.workout workout
			where workoutExercise.exercise.id = :exerciseId
			order by workout.workoutDate asc, workout.id asc, setEntry.setNumber asc
			""")
	List<SetEntry> findAllForExerciseHistory(@Param("exerciseId") Long exerciseId);

	boolean existsByWorkoutExerciseIdAndSetNumber(Long workoutExerciseId, Integer setNumber);

	boolean existsByWorkoutExerciseIdAndSetNumberAndIdNot(Long workoutExerciseId, Integer setNumber, Long id);
}
