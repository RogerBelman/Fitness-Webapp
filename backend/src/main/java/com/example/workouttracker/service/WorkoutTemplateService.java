package com.example.workouttracker.service;

import java.util.List;
import java.util.Comparator;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.StartTemplateWorkoutRequest;
import com.example.workouttracker.dto.AddWorkoutExerciseRequest;
import com.example.workouttracker.dto.UpdateWorkoutExerciseRequest;
import com.example.workouttracker.dto.WorkoutDetailResponse;
import com.example.workouttracker.dto.WorkoutTemplateRequest;
import com.example.workouttracker.dto.WorkoutTemplateResponse;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.entity.WorkoutTemplate;
import com.example.workouttracker.entity.WorkoutTemplateExercise;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.exception.DuplicateResourceException;
import com.example.workouttracker.exception.ResourceNotFoundException;
import com.example.workouttracker.mapper.WorkoutMapper;
import com.example.workouttracker.mapper.WorkoutTemplateMapper;
import com.example.workouttracker.repository.WorkoutExerciseRepository;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.repository.WorkoutTemplateExerciseRepository;
import com.example.workouttracker.repository.WorkoutTemplateRepository;

@Service
@Transactional
public class WorkoutTemplateService {

	private final WorkoutTemplateRepository templateRepository;
	private final WorkoutTemplateExerciseRepository templateExerciseRepository;
	private final WorkoutRepository workoutRepository;
	private final WorkoutExerciseRepository workoutExerciseRepository;
	private final ExerciseRepository exerciseRepository;
	private final CurrentUserService currentUserService;

	public WorkoutTemplateService(
			WorkoutTemplateRepository templateRepository,
			WorkoutTemplateExerciseRepository templateExerciseRepository,
			WorkoutRepository workoutRepository,
			WorkoutExerciseRepository workoutExerciseRepository,
			ExerciseRepository exerciseRepository,
			CurrentUserService currentUserService) {
		this.templateRepository = templateRepository;
		this.templateExerciseRepository = templateExerciseRepository;
		this.workoutRepository = workoutRepository;
		this.workoutExerciseRepository = workoutExerciseRepository;
		this.exerciseRepository = exerciseRepository;
		this.currentUserService = currentUserService;
	}

	@Transactional(readOnly = true)
	public List<WorkoutTemplateResponse> findAll() {
		Long userId = currentUserService.requireCurrentUser().getId();
		return templateRepository.findByUserIdOrderByNameAscIdAsc(userId).stream()
				.map(WorkoutTemplateMapper::toResponse)
				.toList();
	}

	public WorkoutTemplateResponse create(WorkoutTemplateRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		AppUser user = currentUserService.requireCurrentUser();
		WorkoutTemplate template = templateRepository.save(new WorkoutTemplate(user,
				TextFormatting.titleCase(request.name()),
				optionalText(request.notes())));
		templateRepository.flush();
		return WorkoutTemplateMapper.toResponse(template);
	}

	public WorkoutTemplateResponse createFromWorkout(Long workoutId) {
		Workout source = getWorkout(workoutId);
		String name = source.getTitle() == null || source.getTitle().isBlank()
				? "Workout Template"
				: source.getTitle();
		WorkoutTemplate template = templateRepository.save(
				new WorkoutTemplate(source.getUser(), name, source.getNotes()));
		List<WorkoutTemplateExercise> exercises = source.getWorkoutExercises().stream()
				.map(item -> new WorkoutTemplateExercise(
						template, item.getExercise(), item.getExerciseOrder()))
				.toList();
		templateExerciseRepository.saveAll(exercises);
		templateExerciseRepository.flush();
		return WorkoutTemplateMapper.toResponse(template);
	}

	public WorkoutTemplateResponse update(Long id, WorkoutTemplateRequest request) {
		WorkoutTemplate template = getTemplate(id);
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		template.updateDetails(
				TextFormatting.titleCase(request.name()),
				optionalText(request.notes()));
		templateRepository.flush();
		return WorkoutTemplateMapper.toResponse(template);
	}

	public void delete(Long id) {
		templateRepository.delete(getTemplate(id));
	}

	public WorkoutTemplateResponse addExercise(Long templateId, AddWorkoutExerciseRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		WorkoutTemplate template = getTemplate(templateId);
		Long exerciseId = requiredPositiveLong(request.exerciseId(), "exerciseId");
		Long userId = currentUserService.requireCurrentUser().getId();
		var exercise = exerciseRepository.findByIdAndUserId(exerciseId, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Exercise not found."));
		Integer order = resolveExerciseOrder(templateId, request.exerciseOrder());
		if (templateExerciseRepository.existsByWorkoutTemplateIdAndExerciseOrder(templateId, order)) {
			throw new DuplicateResourceException("Template exercise order already exists.");
		}
		templateExerciseRepository.save(new WorkoutTemplateExercise(template, exercise, order));
		templateExerciseRepository.flush();
		return WorkoutTemplateMapper.toResponse(template);
	}

	public WorkoutTemplateResponse updateExercise(Long id, UpdateWorkoutExerciseRequest request) {
		WorkoutTemplateExercise moving = getTemplateExercise(id);
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		Integer requestedOrder = request.exerciseOrder() == null
				? moving.getExerciseOrder()
				: requiredPositive(request.exerciseOrder(), "exerciseOrder");
		Integer currentOrder = moving.getExerciseOrder();
		if (!requestedOrder.equals(currentOrder)) {
			Long templateId = moving.getWorkoutTemplate().getId();
			templateExerciseRepository.findByWorkoutTemplateIdAndExerciseOrder(templateId, requestedOrder)
					.filter(existing -> !existing.getId().equals(id))
					.ifPresent(existing -> swapExerciseOrder(
							templateId, moving, existing, currentOrder, requestedOrder));
			if (!moving.getExerciseOrder().equals(requestedOrder)) {
				moving.updateOrder(requestedOrder);
				templateExerciseRepository.flush();
			}
		}
		return WorkoutTemplateMapper.toResponse(moving.getWorkoutTemplate());
	}

	public void deleteExercise(Long id) {
		WorkoutTemplateExercise exercise = getTemplateExercise(id);
		exercise.getWorkoutTemplate().removeExercise(exercise);
		templateExerciseRepository.delete(exercise);
	}

	public WorkoutDetailResponse startWorkout(Long id, StartTemplateWorkoutRequest request) {
		if (request == null) {
			throw new BadRequestException("Request body is required.");
		}
		WorkoutTemplate template = getTemplate(id);
		String title = request.title() == null
				? template.getName()
				: TextFormatting.titleCase(request.title());
		String notes = request.notes() == null
				? template.getNotes()
				: optionalText(request.notes());
		Workout workout = workoutRepository.save(
				new Workout(template.getUser(), request.workoutDate(), title, notes));
		List<WorkoutExercise> exercises = template.getExercises().stream()
				.sorted(Comparator.comparing(WorkoutTemplateExercise::getExerciseOrder))
				.map(item -> new WorkoutExercise(workout, item.getExercise(), item.getExerciseOrder()))
				.toList();
		workoutExerciseRepository.saveAll(exercises);
		workoutExerciseRepository.flush();
		return WorkoutMapper.toDetailResponse(workout);
	}

	private WorkoutTemplate getTemplate(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return templateRepository.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Workout template not found."));
	}

	private WorkoutTemplateExercise getTemplateExercise(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return templateExerciseRepository.findByIdAndWorkoutTemplateUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Workout template exercise not found."));
	}

	private Integer resolveExerciseOrder(Long templateId, Integer requestedOrder) {
		if (requestedOrder != null) {
			return requiredPositive(requestedOrder, "exerciseOrder");
		}
		return templateExerciseRepository.findFirstByWorkoutTemplateIdOrderByExerciseOrderDesc(templateId)
				.map(item -> item.getExerciseOrder() + 1)
				.orElse(1);
	}

	private void swapExerciseOrder(Long templateId, WorkoutTemplateExercise moving,
			WorkoutTemplateExercise displaced, Integer currentOrder, Integer requestedOrder) {
		Integer highestOrder = templateExerciseRepository
				.findFirstByWorkoutTemplateIdOrderByExerciseOrderDesc(templateId)
				.map(WorkoutTemplateExercise::getExerciseOrder)
				.orElse(0);
		if (highestOrder.equals(Integer.MAX_VALUE)) {
			throw new BadRequestException("Exercise order cannot be changed because the maximum order was reached.");
		}
		moving.updateOrder(highestOrder + 1);
		templateExerciseRepository.flush();
		displaced.updateOrder(currentOrder);
		templateExerciseRepository.flush();
		moving.updateOrder(requestedOrder);
		templateExerciseRepository.flush();
	}

	private Long requiredPositiveLong(Long value, String fieldName) {
		if (value == null || value <= 0) {
			throw new BadRequestException(fieldName + " must be greater than 0.");
		}
		return value;
	}

	private Integer requiredPositive(Integer value, String fieldName) {
		if (value == null || value <= 0) {
			throw new BadRequestException(fieldName + " must be greater than 0.");
		}
		return value;
	}

	private Workout getWorkout(Long id) {
		Long userId = currentUserService.requireCurrentUser().getId();
		return workoutRepository.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Workout not found."));
	}

	private String optionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
