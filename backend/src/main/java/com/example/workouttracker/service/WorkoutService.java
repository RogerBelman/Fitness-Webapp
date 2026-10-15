package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.SetEntryRequest;
import com.example.workouttracker.dto.SetEntryResponse;
import com.example.workouttracker.dto.UpdateWorkoutExerciseRequest;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutExerciseResponse;
import com.example.workouttracker.dto.WorkoutRequest;
import com.example.workouttracker.dto.WorkoutResponse;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.entity.TrainingType;
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
	private final CurrentUserService currentUserService;

	public WorkoutService(
			WorkoutRepository workoutRepository,
			ExerciseRepository exerciseRepository,
			WorkoutExerciseRepository workoutExerciseRepository,
			SetEntryRepository setEntryRepository,
			CurrentUserService currentUserService) {
		this.workoutRepository = workoutRepository;
		this.exerciseRepository = exerciseRepository;
		this.workoutExerciseRepository = workoutExerciseRepository;
		this.setEntryRepository = setEntryRepository;
		this.currentUserService = currentUserService;
	}

	@Transactional(readOnly = true)
	public List<WorkoutResponse> findAll() {
		Long userId = currentUserService.requireCurrentUser().getId();
		return workoutRepository.findByUserIdOrderByWorkoutDateDescIdDesc(userId).stream()
				.map(WorkoutMapper::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public WorkoutDetailResponse findById(Long id) {
		return WorkoutMapper.toDetailResponse(getWorkout(id));
	}

	public WorkoutResponse create(WorkoutRequest request) {
		AppUser user = currentUserService.requireCurrentUser();
		WorkoutValues values = normalizeWorkout(request);
		Workout workout = new Workout(user, values.workoutDate(), values.title(), values.notes());
		return WorkoutMapper.toResponse(workoutRepository.save(workout));
	}

	public WorkoutResponse update(Long id, WorkoutRequest request) {
		Workout workout = getWorkout(id);
		WorkoutValues values = normalizeWorkout(request);
		workout.updateDetails(request.workoutDate() == null ? workout.getWorkoutDate() : values.workoutDate(),
				values.title(), values.notes());
		workoutRepository.flush();
		return WorkoutMapper.toResponse(workout);
	}

	public void delete(Long id) {
		workoutRepository.delete(getWorkout(id));
	}

	public WorkoutExerciseResponse updateExercise(Long id, UpdateWorkoutExerciseRequest request) {
		WorkoutExercise workoutExercise = getWorkoutExercise(id);
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		Integer order = request.exerciseOrder() == null ? workoutExercise.getExerciseOrder()
				: requiredPositive(request.exerciseOrder(), "exerciseOrder");
		Integer currentOrder = workoutExercise.getExerciseOrder();
		if (order.equals(currentOrder)) {
			return WorkoutMapper.toWorkoutExerciseResponse(workoutExercise);
		}

		Long workoutId = workoutExercise.getWorkout().getId();
		workoutExerciseRepository.findByWorkoutIdAndExerciseOrder(workoutId, order)
				.filter(existing -> !existing.getId().equals(id))
				.ifPresent(existing -> swapExerciseOrder(workoutId, workoutExercise, existing,
						currentOrder, order));
		if (workoutExercise.getExerciseOrder().equals(order)) {
			return WorkoutMapper.toWorkoutExerciseResponse(workoutExercise);
		}

		workoutExercise.updateDetails(order);
		workoutExerciseRepository.flush();
		return WorkoutMapper.toWorkoutExerciseResponse(workoutExercise);
	}

	private void swapExerciseOrder(Long workoutId, WorkoutExercise movingExercise,
			WorkoutExercise displacedExercise, Integer movingExerciseOrder, Integer requestedOrder) {
		Integer highestOrder = workoutExerciseRepository.findFirstByWorkoutIdOrderByExerciseOrderDesc(workoutId)
				.map(WorkoutExercise::getExerciseOrder)
				.orElse(0);
		if (highestOrder.equals(Integer.MAX_VALUE)) {
			throw new BadRequestException("Exercise order cannot be changed because the maximum order was reached.");
		}

		movingExercise.updateDetails(highestOrder + 1);
		workoutExerciseRepository.flush();
		displacedExercise.updateDetails(movingExerciseOrder);
		workoutExerciseRepository.flush();
		movingExercise.updateDetails(requestedOrder);
		workoutExerciseRepository.flush();
	}

	public void deleteExercise(Long id) {
		WorkoutExercise workoutExercise = getWorkoutExercise(id);
		workoutExercise.getWorkout().removeWorkoutExercise(workoutExercise);
		workoutExerciseRepository.delete(workoutExercise);
	}

	public SetEntryResponse updateSet(Long id, SetEntryRequest request) {
		SetEntry setEntry = getSetEntry(id);
		requireStrength(setEntry.getWorkoutExercise());
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		Long workoutExerciseId = setEntry.getWorkoutExercise().getId();
		SetValues values = normalizeSet(workoutExerciseId,
				new SetEntryRequest(request.setNumber() == null ? setEntry.getSetNumber() : request.setNumber(),
						request.reps(), request.weight()));
		if (setEntryRepository.existsByWorkoutExerciseIdAndSetNumberAndIdNot(
				workoutExerciseId, values.setNumber(), id)) {
			throw new DuplicateResourceException("Set number already exists for this workout exercise.");
		}
		setEntry.updateDetails(values.setNumber(), values.reps(), values.weight());
		setEntryRepository.flush();
		return WorkoutMapper.toSetEntryResponse(setEntry);
	}

	public void deleteSet(Long id) {
		SetEntry setEntry = getSetEntry(id);
		setEntry.getWorkoutExercise().removeSetEntry(setEntry);
		setEntryRepository.delete(setEntry);
	}

	private SetEntry getSetEntry(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return setEntryRepository.findByIdAndWorkoutExerciseWorkoutUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Set not found."));
	}

	public WorkoutExerciseResponse addExercise(Long workoutId, AddWorkoutExerciseRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		Workout workout = getWorkout(workoutId);
		Exercise exercise = getExercise(requiredPositiveLong(request.exerciseId(), "exerciseId"));
		Integer exerciseOrder = resolveExerciseOrder(workoutId, request.exerciseOrder());
		if (workoutExerciseRepository.existsByWorkoutIdAndExerciseOrder(workoutId, exerciseOrder)) {
			throw new DuplicateResourceException("Workout exercise order already exists.");
		}

		WorkoutExercise workoutExercise = new WorkoutExercise(workout, exercise, exerciseOrder);
		return WorkoutMapper.toWorkoutExerciseResponse(workoutExerciseRepository.save(workoutExercise));
	}

	public SetEntryResponse addSet(Long workoutExerciseId, SetEntryRequest request) {
		WorkoutExercise workoutExercise = getWorkoutExercise(workoutExerciseId);
		requireStrength(workoutExercise);
		SetValues values = normalizeSet(workoutExerciseId, request);

		if (setEntryRepository.existsByWorkoutExerciseIdAndSetNumber(workoutExerciseId, values.setNumber())) {
			throw new DuplicateResourceException("Set number already exists for this workout exercise.");
		}

		SetEntry setEntry = new SetEntry(workoutExercise, values.setNumber(), values.reps(), values.weight());
		return WorkoutMapper.toSetEntryResponse(setEntryRepository.save(setEntry));
	}

	private Workout getWorkout(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return workoutRepository.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Workout not found."));
	}

	private void requireStrength(WorkoutExercise exercise) {
		if (exercise.getExercise().getTrainingType() != TrainingType.STRENGTH) {
			throw new BadRequestException("Cardio exercises use duration and level instead of strength sets.");
		}
	}

	private Exercise getExercise(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return exerciseRepository.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
	}

	private WorkoutExercise getWorkoutExercise(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return workoutExerciseRepository.findByIdAndWorkoutUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Workout exercise not found."));
	}

	private WorkoutValues normalizeWorkout(WorkoutRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}

		LocalDate workoutDate = request.workoutDate() == null ? LocalDate.now() : request.workoutDate();
		return new WorkoutValues(workoutDate, TextFormatting.titleCase(request.title()), optionalText(request.notes()));
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
		if (weight.compareTo(new BigDecimal("99999.99")) > 0 || weight.stripTrailingZeros().scale() > 2) {
			throw new BadRequestException("weight must have at most 5 integer digits and 2 decimal places.");
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
