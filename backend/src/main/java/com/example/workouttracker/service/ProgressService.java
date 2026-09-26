package com.example.workouttracker.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.ExercisePersonalRecordResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
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
		Exercise exercise = exerciseRepository.findById(exerciseId)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
		SetEntry personalRecord = setEntryRepository
				.findFirstByWorkoutExercise_Exercise_IdOrderByWeightDescRepsDescIdDesc(exerciseId)
				.orElse(null);

		return ProgressMapper.toPersonalRecordResponse(exercise, personalRecord);
	}
}
