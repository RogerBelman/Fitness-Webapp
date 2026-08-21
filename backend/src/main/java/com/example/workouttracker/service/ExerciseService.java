package com.example.workouttracker.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.ExerciseResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.ExerciseMapper;
import com.example.workouttracker.repository.ExerciseRepository;

@Service
@Transactional
public class ExerciseService {

	private final ExerciseRepository exerciseRepository;

	public ExerciseService(ExerciseRepository exerciseRepository) {
		this.exerciseRepository = exerciseRepository;
	}

	@Transactional(readOnly = true)
	public List<ExerciseResponse> findAll(Optional<String> muscleGroup, Optional<String> category) {
		Optional<String> normalizedMuscleGroup = muscleGroup.map(String::trim).filter(value -> !value.isBlank());
		Optional<String> normalizedCategory = category.map(String::trim).filter(value -> !value.isBlank());

		List<Exercise> exercises;
		if (normalizedMuscleGroup.isPresent() && normalizedCategory.isPresent()) {
			exercises = exerciseRepository.findByMuscleGroupIgnoreCaseAndCategoryIgnoreCase(
					normalizedMuscleGroup.get(),
					normalizedCategory.get());
		} else if (normalizedMuscleGroup.isPresent()) {
			exercises = exerciseRepository.findByMuscleGroupIgnoreCase(normalizedMuscleGroup.get());
		} else if (normalizedCategory.isPresent()) {
			exercises = exerciseRepository.findByCategoryIgnoreCase(normalizedCategory.get());
		} else {
			exercises = exerciseRepository.findAll();
		}

		return exercises.stream()
				.map(ExerciseMapper::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public ExerciseResponse findById(Long id) {
		return ExerciseMapper.toResponse(getExercise(id));
	}

	public ExerciseResponse create(ExerciseRequest request) {
		ExerciseValues values = normalize(request);
		if (exerciseRepository.existsByNameIgnoreCase(values.name())) {
			throw new DuplicateResourceException("Exercise name already exists.");
		}

		Exercise exercise = new Exercise(values.name(), values.muscleGroup(), values.category());
		return ExerciseMapper.toResponse(exerciseRepository.save(exercise));
	}

	public ExerciseResponse update(Long id, ExerciseRequest request) {
		Exercise exercise = getExercise(id);
		ExerciseValues values = normalize(request);

		if (exerciseRepository.existsByNameIgnoreCaseAndIdNot(values.name(), id)) {
			throw new DuplicateResourceException("Exercise name already exists.");
		}

		exercise.updateDetails(values.name(), values.muscleGroup(), values.category());
		return ExerciseMapper.toResponse(exercise);
	}

	public void delete(Long id) {
		if (!exerciseRepository.existsById(id)) {
			throw new ResourceNotFoundException("Exercise not found.");
		}

		exerciseRepository.deleteById(id);
	}

	private Exercise getExercise(Long id) {
		return exerciseRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}

	private ExerciseValues normalize(ExerciseRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		return new ExerciseValues(
				requiredText(request.name(), "name"),
				requiredText(request.muscleGroup(), "muscleGroup"),
				requiredText(request.category(), "category"));
	}

	private String requiredText(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new BadRequestException(fieldName + " is required.");
		}

		return value.trim();
	}

	private record ExerciseValues(String name, String muscleGroup, String category) {
	}
}
