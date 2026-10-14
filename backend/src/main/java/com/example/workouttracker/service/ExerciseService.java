package com.example.workouttracker.service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExerciseRequest;
import com.example.workouttracker.dto.ExerciseResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.ExerciseMapper;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.ExerciseGoalRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutTemplateExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.repository.CardioEntryRepository;

@Service
@Transactional
public class ExerciseService {

	private final ExerciseRepository exerciseRepository;
	private final WorkoutExerciseRepository workoutExerciseRepository;
	private final SetEntryRepository setEntryRepository;
	private final CardioEntryRepository cardioEntryRepository;
	private final WorkoutTemplateExerciseRepository workoutTemplateExerciseRepository;
	private final ExerciseGoalRepository exerciseGoalRepository;

	public ExerciseService(ExerciseRepository exerciseRepository, WorkoutExerciseRepository workoutExerciseRepository,
			SetEntryRepository setEntryRepository, CardioEntryRepository cardioEntryRepository,
			WorkoutTemplateExerciseRepository workoutTemplateExerciseRepository,
			ExerciseGoalRepository exerciseGoalRepository) {
		this.exerciseRepository = exerciseRepository;
		this.workoutExerciseRepository = workoutExerciseRepository;
		this.setEntryRepository = setEntryRepository;
		this.cardioEntryRepository = cardioEntryRepository;
		this.workoutTemplateExerciseRepository = workoutTemplateExerciseRepository;
		this.exerciseGoalRepository = exerciseGoalRepository;
	}

	@Transactional(readOnly = true)
	public List<ExerciseResponse> findAll(Optional<String> muscleGroup, Optional<String> category,
			Optional<String> trainingType) {
		TrainingType requestedType = trainingType.filter(value -> !value.isBlank()).map(value -> {
			try {
				return TrainingType.valueOf(value.trim().toUpperCase(Locale.ROOT));
			} catch (IllegalArgumentException exception) {
				throw new BadRequestException("trainingType must be STRENGTH or CARDIO.");
			}
		}).orElse(null);
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
				.filter(exercise -> requestedType == null || exercise.getTrainingType() == requestedType)
				.map(ExerciseMapper::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public ExerciseResponse findById(Long id) {
		return ExerciseMapper.toResponse(getExercise(id));
	}

	public ExerciseResponse create(ExerciseRequest request) {
		ExerciseValues values = normalize(request, TrainingType.STRENGTH);
		if (exerciseRepository.existsByNameIgnoreCase(values.name())) {
			throw new DuplicateResourceException("Exercise name already exists.");
		}

		Exercise exercise = new Exercise(values.name(), values.muscleGroup(), values.category(), values.instructions(), values.trainingType());
		return ExerciseMapper.toResponse(exerciseRepository.save(exercise));
	}

	public ExerciseResponse update(Long id, ExerciseRequest request) {
		Exercise exercise = getExercise(id);
		ExerciseValues values = normalize(request, exercise.getTrainingType());
		if (values.trainingType() != exercise.getTrainingType()
				&& (setEntryRepository.existsByWorkoutExercise_Exercise_Id(id)
						|| cardioEntryRepository.existsByWorkoutExercise_Exercise_Id(id))) {
			throw new DuplicateResourceException("Remove logged entries before changing an exercise's training type.");
		}

		if (exerciseRepository.existsByNameIgnoreCaseAndIdNot(values.name(), id)) {
			throw new DuplicateResourceException("Exercise name already exists.");
		}

		exercise.updateDetails(values.name(), values.muscleGroup(), values.category(), values.instructions(), values.trainingType());
		exerciseRepository.flush();
		return ExerciseMapper.toResponse(exercise);
	}

	public void delete(Long id) {
		if (!exerciseRepository.existsById(id)) {
			throw new ResourceNotFoundException("Exercise not found.");
		}

		if (workoutExerciseRepository.existsByExerciseId(id)) {
			throw new DuplicateResourceException(
					"Exercise is used in workout history. Remove it from those workouts before deleting it from the library.");
		}
		if (workoutTemplateExerciseRepository.existsByExerciseId(id)) {
			throw new DuplicateResourceException(
					"Exercise is used in a workout template. Remove that template before deleting it from the library.");
		}
		if (exerciseGoalRepository.existsByExerciseId(id)) {
			throw new DuplicateResourceException(
					"Exercise has an active goal. Delete the goal before deleting the exercise.");
		}
		exerciseRepository.deleteById(id);
		exerciseRepository.flush();
	}

	private Exercise getExercise(Long id) {
		return exerciseRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}

	private ExerciseValues normalize(ExerciseRequest request, TrainingType defaultType) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		TrainingType type = request.trainingType() == null ? defaultType : request.trainingType();
		String equipment = optionalText(request.category());
		return new ExerciseValues(
				requiredText(TextFormatting.titleCase(request.name()), "name"),
				type == TrainingType.STRENGTH ? requiredText(request.muscleGroup(), "muscleGroup") : optionalText(request.muscleGroup()),
				equipment == null ? "None" : equipment,
				optionalInstructions(request.instructions()), type);
	}

	private String optionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private String optionalInstructions(String instructions) {
		if (instructions == null || instructions.isBlank()) {
			return null;
		}
		if (instructions.length() > 500) {
			throw new BadRequestException("instructions must be 500 characters or less.");
		}
		return instructions.trim();
	}

	private String requiredText(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new BadRequestException(fieldName + " is required.");
		}

		return value.trim();
	}

	private record ExerciseValues(String name, String muscleGroup, String category, String instructions, TrainingType trainingType) {
	}
}
