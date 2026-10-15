package com.example.workouttracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.workouttracker.entity.WorkoutTemplate;

public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, Long> {

	List<WorkoutTemplate> findByUserIdOrderByNameAscIdAsc(Long userId);

	Optional<WorkoutTemplate> findByIdAndUserId(Long id, Long userId);
}
