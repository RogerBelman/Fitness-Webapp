package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.SetEntryRequest;
import com.example.workouttracker.dto.SetEntryResponse;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutExerciseResponse;
import com.example.workouttracker.dto.WorkoutRequest;
import com.example.workouttracker.dto.WorkoutResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.WorkoutMapper;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.SetEntryRepository;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;

@Service
@Transactional
public class WorkoutService {

	private final WorkoutRepository workoutRepository;
	private final ExerciseRepository exerciseRepository;
	private final WorkoutExerciseRepository workoutExerciseRepository;
	private final SetEntryRepository setEntryRepository;

	public WorkoutService(
			WorkoutRepository workoutRepository,
			ExerciseRepository exerciseRepository,
			WorkoutExerciseRepository workoutExerciseRepository,
			SetEntryRepository setEntryRepository) {
		this.workoutRepository = workoutRepository;
		this.exerciseRepository = exerciseRepository;
		this.workoutExerciseRepository = workoutExerciseRepository;
		this.setEntryRepository = setEntryRepository;
	}

	@Transactional(readOnly = true)
	public List<WorkoutResponse> findAll() {
		return workoutRepository.findAllByOrderByWorkoutDateDescIdDesc().stream()
				.map(WorkoutMapper::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public WorkoutDetailResponse findById(Long id) {
		return WorkoutMapper.toDetailResponse(getWorkout(id));
	}

	public WorkoutResponse create(WorkoutRequest request) {
		WorkoutValues values = normalizeWorkout(request);
		Workout workout = new Workout(values.workoutDate(), values.title(), values.notes());
		return WorkoutMapper.toResponse(workoutRepository.save(workout));
	}

	public WorkoutExerciseResponse addExercise(Long workoutId, AddWorkoutExerciseRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		Workout workout = getWorkout(workoutId);
		Exercise exercise = getExercise(requiredPositiveLong(request.exerciseId(), "exerciseId"));
		Integer exerciseOrder = resolveExerciseOrder(workoutId, request.exerciseOrder());
		String notes = optionalText(request.notes());

		if (workoutExerciseRepository.existsByWorkoutIdAndExerciseOrder(workoutId, exerciseOrder)) {
			throw new DuplicateResourceException("Workout exercise order already exists.");
		}

		WorkoutExercise workoutExercise = new WorkoutExercise(workout, exercise, exerciseOrder, notes);
		return WorkoutMapper.toWorkoutExerciseResponse(workoutExerciseRepository.save(workoutExercise));
	}

	public SetEntryResponse addSet(Long workoutExerciseId, SetEntryRequest request) {
		WorkoutExercise workoutExercise = getWorkoutExercise(workoutExerciseId);
		SetValues values = normalizeSet(workoutExerciseId, request);

		if (setEntryRepository.existsByWorkoutExerciseIdAndSetNumber(workoutExerciseId, values.setNumber())) {
			throw new DuplicateResourceException("Set number already exists for this workout exercise.");
		}

		SetEntry setEntry = new SetEntry(workoutExercise, values.setNumber(), values.reps(), values.weight());
		return WorkoutMapper.toSetEntryResponse(setEntryRepository.save(setEntry));
	}

	private Workout getWorkout(Long id) {
		return workoutRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Workout not found."));
	}

	private Exercise getExercise(Long id) {
		return exerciseRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}

	private WorkoutExercise getWorkoutExercise(Long id) {
		return workoutExerciseRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Workout exercise not found."));
	}

	private WorkoutValues normalizeWorkout(WorkoutRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		LocalDate workoutDate = request.workoutDate() == null ? LocalDate.now() : request.workoutDate();
		return new WorkoutValues(workoutDate, optionalText(request.title()), optionalText(request.notes()));
	}

	private Integer resolveExerciseOrder(Long workoutId, Integer requestedOrder) {
		if (requestedOrder != null) {
			return requiredPositive(requestedOrder, "exerciseOrder");
		}

		return workoutExerciseRepository.findFirstByWorkoutIdOrderByExerciseOrderDesc(workoutId)
				.map(workoutExercise -> workoutExercise.getExerciseOrder() + 1)
				.orElse(1);
	}

	private SetValues normalizeSet(Long workoutExerciseId, SetEntryRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		Integer setNumber = resolveSetNumber(workoutExerciseId, request.setNumber());
		Integer reps = requiredPositive(request.reps(), "reps");
		BigDecimal weight = requiredWeight(request.weight());

		return new SetValues(setNumber, reps, weight);
	}

	private Integer resolveSetNumber(Long workoutExerciseId, Integer requestedSetNumber) {
		if (requestedSetNumber != null) {
			return requiredPositive(requestedSetNumber, "setNumber");
		}

		return setEntryRepository.findFirstByWorkoutExerciseIdOrderBySetNumberDesc(workoutExerciseId)
				.map(setEntry -> setEntry.getSetNumber() + 1)
				.orElse(1);
	}

	private Long requiredLong(Long value, String fieldName) {
		if (value == null) {
			throw new BadRequestException(fieldName + " is required.");
		}

		return value;
	}

	private Long requiredPositiveLong(Long value, String fieldName) {
		Long requiredValue = requiredLong(value, fieldName);
		if (requiredValue <= 0) {
			throw new BadRequestException(fieldName + " must be greater than 0.");
		}

		return requiredValue;
	}

	private Integer requiredPositive(Integer value, String fieldName) {
		if (value == null) {
			throw new BadRequestException(fieldName + " is required.");
		}
		if (value <= 0) {
			throw new BadRequestException(fieldName + " must be greater than 0.");
		}

		return value;
	}

	private BigDecimal requiredWeight(BigDecimal weight) {
		if (weight == null) {
			throw new BadRequestException("weight is required.");
		}
		if (weight.compareTo(BigDecimal.ZERO) < 0) {
			throw new BadRequestException("weight must be greater than or equal to 0.");
		}

		return weight;
	}

	private String optionalText(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}

		return value.trim();
	}

	private record WorkoutValues(LocalDate workoutDate, String title, String notes) {
	}

	private record SetValues(Integer setNumber, Integer reps, BigDecimal weight) {
	}
}
