package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExerciseGoalRequest;
import com.example.workouttracker.dto.ExerciseGoalResponse;
import com.example.workouttracker.entity.CardioEntry;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.ExerciseGoal;
import com.example.workouttracker.entity.GoalMetric;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.ExerciseMapper;
import com.example.workouttracker.repository.CardioEntryRepository;
import com.example.workouttracker.repository.ExerciseGoalRepository;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;

@Service
@Transactional
public class ExerciseGoalService {

	private final ExerciseGoalRepository goalRepository;
	private final ExerciseRepository exerciseRepository;
	private final SetEntryRepository setEntryRepository;
	private final CardioEntryRepository cardioEntryRepository;

	public ExerciseGoalService(ExerciseGoalRepository goalRepository, ExerciseRepository exerciseRepository,
			SetEntryRepository setEntryRepository, CardioEntryRepository cardioEntryRepository) {
		this.goalRepository = goalRepository;
		this.exerciseRepository = exerciseRepository;
		this.setEntryRepository = setEntryRepository;
		this.cardioEntryRepository = cardioEntryRepository;
	}

	@Transactional(readOnly = true)
	public List<ExerciseGoalResponse> findAll() {
		return goalRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
				.map(this::toResponse)
				.toList();
	}

	public ExerciseGoalResponse create(ExerciseGoalRequest request) {
		Exercise exercise = getExercise(request.exerciseId());
		validateMetric(exercise, request.metric());
		if (goalRepository.existsByExerciseIdAndMetric(exercise.getId(), request.metric())) {
			throw new DuplicateResourceException("A goal for this exercise and metric already exists.");
		}
		return toResponse(goalRepository.save(new ExerciseGoal(exercise, request.metric(), request.targetValue())));
	}

	public ExerciseGoalResponse update(Long id, ExerciseGoalRequest request) {
		ExerciseGoal goal = getGoal(id);
		Exercise exercise = getExercise(request.exerciseId());
		validateMetric(exercise, request.metric());
		if (goalRepository.existsByExerciseIdAndMetricAndIdNot(exercise.getId(), request.metric(), id)) {
			throw new DuplicateResourceException("A goal for this exercise and metric already exists.");
		}
		goal.updateDetails(exercise, request.metric(), request.targetValue());
		goalRepository.flush();
		return toResponse(goal);
	}

	public void delete(Long id) {
		goalRepository.delete(getGoal(id));
	}

	private ExerciseGoalResponse toResponse(ExerciseGoal goal) {
		BigDecimal currentValue = currentValue(goal);
		return new ExerciseGoalResponse(goal.getId(), ExerciseMapper.toResponse(goal.getExercise()), goal.getMetric(),
				goal.getTargetValue(), currentValue, currentValue.compareTo(goal.getTargetValue()) >= 0,
				goal.getCreatedAt(), goal.getUpdatedAt());
	}

	private BigDecimal currentValue(ExerciseGoal goal) {
		Long exerciseId = goal.getExercise().getId();
		return switch (goal.getMetric()) {
			case STRENGTH_MAX_WEIGHT -> setEntryRepository.findAllForExerciseHistory(exerciseId).stream()
					.map(SetEntry::getWeight).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
			case STRENGTH_MAX_VOLUME -> maxStrengthVolume(exerciseId);
			case CARDIO_DURATION -> maxCardioDuration(exerciseId);
			case CARDIO_LEVEL -> cardioEntryRepository.findAllForExerciseHistory(exerciseId).stream()
					.map(CardioEntry::getLevel).filter(value -> value != null)
					.max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
		};
	}

	private BigDecimal maxStrengthVolume(Long exerciseId) {
		Map<Workout, BigDecimal> totals = new LinkedHashMap<>();
		for (SetEntry entry : setEntryRepository.findAllForExerciseHistory(exerciseId)) {
			Workout workout = entry.getWorkoutExercise().getWorkout();
			BigDecimal volume = entry.getWeight().multiply(BigDecimal.valueOf(entry.getReps()));
			totals.merge(workout, volume, BigDecimal::add);
		}
		return totals.values().stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
	}

	private BigDecimal maxCardioDuration(Long exerciseId) {
		Map<Workout, BigDecimal> totals = new LinkedHashMap<>();
		for (CardioEntry entry : cardioEntryRepository.findAllForExerciseHistory(exerciseId)) {
			Workout workout = entry.getWorkoutExercise().getWorkout();
			totals.merge(workout, entry.getDurationMinutes(), BigDecimal::add);
		}
		return totals.values().stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
	}

	private void validateMetric(Exercise exercise, GoalMetric metric) {
		boolean strengthMetric = metric == GoalMetric.STRENGTH_MAX_WEIGHT
				|| metric == GoalMetric.STRENGTH_MAX_VOLUME;
		if (strengthMetric != (exercise.getTrainingType() == TrainingType.STRENGTH)) {
			throw new BadRequestException("Goal metric must match the exercise training type.");
		}
	}

	private Exercise getExercise(Long id) {
		return exerciseRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}

	private ExerciseGoal getGoal(Long id) {
		return goalRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise goal not found."));
	}
}
