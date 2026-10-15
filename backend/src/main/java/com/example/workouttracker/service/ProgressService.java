package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExercisePersonalRecordResponse;
import com.example.workouttracker.dto.CardioProgressResponse;
import com.example.workouttracker.dto.CardioProgressPointResponse;
import com.example.workouttracker.entity.CardioEntry;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.repository.CardioEntryRepository;
import com.example.workouttracker.dto.ExerciseProgressPointResponse;
import com.example.workouttracker.dto.ExerciseProgressResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.ProgressMapper;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;

@Service
@Transactional(readOnly = true)
public class ProgressService {

	private final ExerciseRepository exerciseRepository;
	private final SetEntryRepository setEntryRepository;
	private final CardioEntryRepository cardioEntryRepository;
	private final CurrentUserService currentUserService;

	public ProgressService(
			ExerciseRepository exerciseRepository,
			SetEntryRepository setEntryRepository,
			CardioEntryRepository cardioEntryRepository,
			CurrentUserService currentUserService) {
		this.exerciseRepository = exerciseRepository;
		this.setEntryRepository = setEntryRepository;
		this.cardioEntryRepository = cardioEntryRepository;
		this.currentUserService = currentUserService;
	}

	public ExercisePersonalRecordResponse findPersonalRecord(Long exerciseId) {
		Exercise exercise = getExercise(exerciseId);
		SetEntry personalRecord = setEntryRepository
				.findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(exerciseId)
				.orElse(null);

		return ProgressMapper.toPersonalRecordResponse(exercise, personalRecord);
	}

	public ExerciseProgressResponse findHistory(Long exerciseId) {
		Exercise exercise = getExercise(exerciseId);
		List<SetEntry> setEntries = setEntryRepository.findAllForExerciseHistory(exerciseId);
		Map<Workout, List<SetEntry>> setsByWorkout = new LinkedHashMap<>();

		for (SetEntry setEntry : setEntries) {
			Workout workout = setEntry.getWorkoutExercise().getWorkout();
			setsByWorkout.computeIfAbsent(workout, key -> new ArrayList<>()).add(setEntry);
		}

		List<ExerciseProgressPointResponse> history = setsByWorkout.entrySet().stream()
				.map(entry -> toProgressPoint(entry.getKey(), entry.getValue()))
				.toList();

		return new ExerciseProgressResponse(exercise.getId(), exercise.getName(), history);
	}

	public CardioProgressResponse findCardioHistory(Long exerciseId) {
		Exercise exercise = getExercise(exerciseId);
		if (exercise.getTrainingType() != TrainingType.CARDIO) {
			throw new BadRequestException("Cardio progress is available only for cardio exercises.");
		}
		Map<Workout, List<CardioEntry>> entriesByWorkout = new LinkedHashMap<>();
		for (CardioEntry entry : cardioEntryRepository.findAllForExerciseHistory(exerciseId)) {
			Workout workout = entry.getWorkoutExercise().getWorkout();
			entriesByWorkout.computeIfAbsent(workout, key -> new ArrayList<>()).add(entry);
		}
		List<CardioProgressPointResponse> history = entriesByWorkout.entrySet().stream()
				.map(group -> new CardioProgressPointResponse(
						group.getKey().getId(), group.getKey().getWorkoutDate(), group.getValue().size(),
						group.getValue().stream().map(CardioEntry::getDurationMinutes)
								.reduce(BigDecimal.ZERO, BigDecimal::add),
						group.getValue().stream().map(CardioEntry::getLevel).filter(Objects::nonNull)
								.max(BigDecimal::compareTo).orElse(null)))
				.toList();
		return new CardioProgressResponse(exercise.getId(), exercise.getName(), history);
	}

	private ExerciseProgressPointResponse toProgressPoint(
			Workout workout,
			List<SetEntry> setEntries) {
		SetEntry bestSet = setEntries.stream()
				.max((left, right) -> {
					int weightComparison = left.getWeight().compareTo(right.getWeight());
					return weightComparison != 0
							? weightComparison
							: left.getReps().compareTo(right.getReps());
				})
				.orElseThrow();
		BigDecimal totalVolume = setEntries.stream()
				.map(setEntry -> setEntry.getWeight().multiply(BigDecimal.valueOf(setEntry.getReps())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		return new ExerciseProgressPointResponse(
				workout.getId(),
				workout.getWorkoutDate(),
				setEntries.size(),
				bestSet.getWeight(),
				bestSet.getReps(),
				totalVolume);
	}

	private Exercise getExercise(Long exerciseId) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return exerciseRepository.findByIdAndUserId(exerciseId, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}
}
