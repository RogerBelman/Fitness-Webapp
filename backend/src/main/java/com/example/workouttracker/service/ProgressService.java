package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExercisePersonalRecordResponse;
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

	public ProgressService(
			ExerciseRepository exerciseRepository,
			SetEntryRepository setEntryRepository) {
		this.exerciseRepository = exerciseRepository;
		this.setEntryRepository = setEntryRepository;
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

	private ExerciseProgressPointResponse toProgressPoint(
			Workout workout,
			List<SetEntry> setEntries) {
		BigDecimal maxWeight = setEntries.stream()
				.map(SetEntry::getWeight)
				.max(BigDecimal::compareTo)
				.orElse(BigDecimal.ZERO);
		BigDecimal totalVolume = setEntries.stream()
				.map(setEntry -> setEntry.getWeight().multiply(BigDecimal.valueOf(setEntry.getReps())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		return new ExerciseProgressPointResponse(
				workout.getId(),
				workout.getWorkoutDate(),
				setEntries.size(),
				maxWeight,
				totalVolume);
	}

	private Exercise getExercise(Long exerciseId) {
		return exerciseRepository.findById(exerciseId)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}
}
