package com.example.workouttracker.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.CardioEntryRequest;
import com.example.workouttracker.dto.CardioEntryResponse;
import com.example.workouttracker.entity.CardioEntry;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.WorkoutMapper;
import com.example.workouttracker.repository.CardioEntryRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;

@Service
@Transactional
public class CardioService {
	private final WorkoutExerciseRepository workoutExercises;
	private final CardioEntryRepository entries;

	public CardioService(WorkoutExerciseRepository workoutExercises, CardioEntryRepository entries) {
		this.workoutExercises = workoutExercises;
		this.entries = entries;
	}

	public CardioEntryResponse create(Long workoutExerciseId, CardioEntryRequest request) {
		WorkoutExercise exercise = workoutExercises.findById(workoutExerciseId)
				.orElseThrow(() -> new ResourceNotFoundException("Workout exercise not found."));
		requireCardio(exercise);
		Values values = normalize(request);
		CardioEntry entry = new CardioEntry(exercise, values.duration(), values.level());
		return WorkoutMapper.toCardioEntryResponse(entries.save(entry));
	}

	public CardioEntryResponse update(Long id, CardioEntryRequest request) {
		CardioEntry entry = getEntry(id);
		requireCardio(entry.getWorkoutExercise());
		Values values = normalize(request);
		entry.updateDetails(values.duration(), values.level());
		entries.flush();
		return WorkoutMapper.toCardioEntryResponse(entry);
	}

	public void delete(Long id) {
		CardioEntry entry = getEntry(id);
		entry.getWorkoutExercise().removeCardioEntry(entry);
		entries.delete(entry);
	}

	private CardioEntry getEntry(Long id) {
		return entries.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cardio entry not found."));
	}

	private void requireCardio(WorkoutExercise exercise) {
		if (exercise.getExercise().getTrainingType() != TrainingType.CARDIO) {
			throw new BadRequestException("Strength exercises use sets, reps, and weight instead of cardio entries.");
		}
	}

	private Values normalize(CardioEntryRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		BigDecimal duration = request.durationMinutes();
		if (duration == null || duration.signum() <= 0) {
			throw new BadRequestException("durationMinutes must be greater than 0.");
		}
		checkNumber(duration, new BigDecimal("99999.99"), "durationMinutes");
		BigDecimal level = request.level();
		if (level != null) {
			checkNumber(level, new BigDecimal("999.99"), "level");
		}
		return new Values(duration, level);
	}

	private void checkNumber(BigDecimal value, BigDecimal maximum, String field) {
		if (value.signum() < 0 || value.compareTo(maximum) > 0 || value.stripTrailingZeros().scale() > 2) {
			throw new BadRequestException(field + " is outside its supported range or has more than 2 decimal places.");
		}
	}

	private record Values(BigDecimal duration, BigDecimal level) {
	}
}
