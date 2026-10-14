package com.example.workouttracker.mapper;

import java.util.Comparator;

import com.example.workouttracker.dto.WorkoutTemplateExerciseResponse;
import com.example.workouttracker.dto.WorkoutTemplateResponse;
import com.example.workouttracker.entity.WorkoutTemplate;

public final class WorkoutTemplateMapper {

	private WorkoutTemplateMapper() {
	}

	public static WorkoutTemplateResponse toResponse(WorkoutTemplate template) {
		return new WorkoutTemplateResponse(
				template.getId(),
				template.getName(),
				template.getNotes(),
				template.getExercises().stream()
						.sorted(Comparator.comparing(item -> item.getExerciseOrder()))
						.map(item -> new WorkoutTemplateExerciseResponse(
								item.getId(),
								item.getExerciseOrder(),
								ExerciseMapper.toResponse(item.getExercise())))
						.toList(),
				template.getCreatedAt(),
				template.getUpdatedAt());
	}
}
