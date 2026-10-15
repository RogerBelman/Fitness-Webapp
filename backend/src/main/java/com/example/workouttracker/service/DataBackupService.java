package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.workouttracker.dto.DataBackup;
import com.example.workouttracker.dto.DataImportResponse;
import com.example.workouttracker.entity.CardioEntry;
import com.example.workouttracker.entity.AppUser;
import com.example.workouttracker.entity.Exercise;
import com.example.workouttracker.entity.ExerciseGoal;
import com.example.workouttracker.entity.GoalMetric;
import com.example.workouttracker.entity.SetEntry;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.entity.Workout;
import com.example.workouttracker.entity.WorkoutExercise;
import com.example.workouttracker.entity.WorkoutTemplate;
import com.example.workouttracker.entity.WorkoutTemplateExercise;
import com.example.workouttracker.exception.BadRequestException;
import com.example.workouttracker.repository.ExerciseGoalRepository;
import com.example.workouttracker.repository.ExerciseRepository;
import com.example.workouttracker.repository.WorkoutRepository;
import com.example.workouttracker.repository.WorkoutTemplateRepository;

import jakarta.persistence.EntityManager;

@Service
public class DataBackupService {

	private static final int BACKUP_VERSION = 1;

	private final ExerciseRepository exerciseRepository;
	private final WorkoutRepository workoutRepository;
	private final WorkoutTemplateRepository templateRepository;
	private final ExerciseGoalRepository goalRepository;
	private final EntityManager entityManager;
	private final CurrentUserService currentUserService;

	public DataBackupService(
			ExerciseRepository exerciseRepository,
			WorkoutRepository workoutRepository,
			WorkoutTemplateRepository templateRepository,
			ExerciseGoalRepository goalRepository,
			EntityManager entityManager,
			CurrentUserService currentUserService) {
		this.exerciseRepository = exerciseRepository;
		this.workoutRepository = workoutRepository;
		this.templateRepository = templateRepository;
		this.goalRepository = goalRepository;
		this.entityManager = entityManager;
		this.currentUserService = currentUserService;
	}

	@Transactional(readOnly = true)
	public DataBackup exportBackup() {
		Long userId = currentUserService.requireCurrentUser().getId();
		List<DataBackup.ExerciseData> exercises = exerciseRepository.findByUserId(userId).stream()
				.sorted(Comparator.comparing(Exercise::getName, String.CASE_INSENSITIVE_ORDER))
				.map(exercise -> new DataBackup.ExerciseData(
						exercise.getName(), exercise.getMuscleGroup(), exercise.getCategory(),
						exercise.getInstructions(), exercise.getTrainingType()))
				.toList();

		List<DataBackup.WorkoutData> workouts = workoutRepository.findByUserIdOrderByWorkoutDateDescIdDesc(userId).stream()
				.map(workout -> new DataBackup.WorkoutData(
						workout.getWorkoutDate(), workout.getTitle(), workout.getNotes(),
						workout.getWorkoutExercises().stream().map(item -> new DataBackup.WorkoutExerciseData(
								item.getExercise().getName(), item.getExerciseOrder(),
								item.getSetEntries().stream().map(set -> new DataBackup.SetData(
										set.getSetNumber(), set.getReps(), set.getWeight())).toList(),
								item.getCardioEntries().stream().map(entry -> new DataBackup.CardioData(
										entry.getDurationMinutes(), entry.getLevel())).toList())).toList()))
				.toList();

		List<DataBackup.TemplateData> templates = templateRepository.findByUserIdOrderByNameAscIdAsc(userId).stream()
				.map(template -> new DataBackup.TemplateData(
						template.getName(), template.getNotes(),
						template.getExercises().stream().map(item -> new DataBackup.TemplateExerciseData(
								item.getExercise().getName(), item.getExerciseOrder())).toList()))
				.toList();

		List<DataBackup.GoalData> goals = goalRepository.findByExerciseUserIdOrderByCreatedAtDescIdDesc(userId).stream()
				.map(goal -> new DataBackup.GoalData(
						goal.getExercise().getName(), goal.getMetric(), goal.getTargetValue()))
				.toList();

		return new DataBackup(BACKUP_VERSION, Instant.now(), exercises, workouts, templates, goals);
	}

	@Transactional
	public DataImportResponse importBackup(DataBackup backup) {
		Map<String, DataBackup.ExerciseData> exerciseData = validate(backup);
		AppUser user = currentUserService.requireCurrentUser();
		Long userId = user.getId();

		goalRepository.deleteAll(goalRepository.findByExerciseUserIdOrderByCreatedAtDescIdDesc(userId));
		templateRepository.deleteAll(templateRepository.findByUserIdOrderByNameAscIdAsc(userId));
		workoutRepository.deleteAll(workoutRepository.findByUserIdOrderByWorkoutDateDescIdDesc(userId));
		exerciseRepository.deleteAll(exerciseRepository.findByUserId(userId));
		entityManager.flush();
		entityManager.clear();

		Map<String, Exercise> exercisesByName = new HashMap<>();
		for (DataBackup.ExerciseData item : exerciseData.values()) {
			Exercise exercise = exerciseRepository.save(new Exercise(
					user, item.name().strip(), nullableText(item.muscleGroup()), item.category().strip(),
					nullableText(item.instructions()), item.trainingType()));
			exercisesByName.put(key(item.name()), exercise);
		}

		for (DataBackup.WorkoutData item : backup.workouts()) {
			Workout workout = new Workout(user, item.workoutDate(), nullableText(item.title()), nullableText(item.notes()));
			for (DataBackup.WorkoutExerciseData exerciseDataItem : item.exercises()) {
				Exercise exercise = exercisesByName.get(key(exerciseDataItem.exerciseName()));
				WorkoutExercise workoutExercise = new WorkoutExercise(
						workout, exercise, exerciseDataItem.exerciseOrder());
				for (DataBackup.SetData set : exerciseDataItem.sets()) {
					new SetEntry(workoutExercise, set.setNumber(), set.reps(), set.weight());
				}
				for (DataBackup.CardioData entry : exerciseDataItem.cardioEntries()) {
					new CardioEntry(workoutExercise, entry.durationMinutes(), entry.level());
				}
			}
			workoutRepository.save(workout);
		}

		for (DataBackup.TemplateData item : backup.templates()) {
			WorkoutTemplate template = new WorkoutTemplate(user, item.name().strip(), nullableText(item.notes()));
			for (DataBackup.TemplateExerciseData exercise : item.exercises()) {
				new WorkoutTemplateExercise(
						template, exercisesByName.get(key(exercise.exerciseName())), exercise.exerciseOrder());
			}
			templateRepository.save(template);
		}

		for (DataBackup.GoalData item : backup.goals()) {
			goalRepository.save(new ExerciseGoal(
					exercisesByName.get(key(item.exerciseName())), item.metric(), item.targetValue()));
		}

		return new DataImportResponse(
				backup.exercises().size(), backup.workouts().size(),
				backup.templates().size(), backup.goals().size());
	}

	private Map<String, DataBackup.ExerciseData> validate(DataBackup backup) {
		if (backup == null || backup.version() == null || backup.version() != BACKUP_VERSION) {
			throw invalid("Only backup version 1 is supported.");
		}
		if (backup.exercises() == null || backup.workouts() == null
				|| backup.templates() == null || backup.goals() == null) {
			throw invalid("Backup collections are required.");
		}

		Map<String, DataBackup.ExerciseData> exercises = new HashMap<>();
		for (DataBackup.ExerciseData item : backup.exercises()) {
			if (item == null || blank(item.name()) || item.name().strip().length() > 120
					|| blank(item.category()) || item.category().strip().length() > 80
					|| tooLong(item.muscleGroup(), 80) || tooLong(item.instructions(), 500)
					|| item.trainingType() == null
					|| item.trainingType() == TrainingType.STRENGTH && blank(item.muscleGroup())) {
				throw invalid("Each exercise needs a valid name, category, and training type.");
			}
			if (exercises.putIfAbsent(key(item.name()), item) != null) {
				throw invalid("Exercise names must be unique.");
			}
		}

		for (DataBackup.WorkoutData workout : backup.workouts()) {
			if (workout == null || workout.workoutDate() == null || tooLong(workout.title(), 120)
					|| workout.exercises() == null) {
				throw invalid("Each workout needs a valid date and exercise list.");
			}
			Set<Integer> orders = new HashSet<>();
			Set<String> exerciseNames = new HashSet<>();
			for (DataBackup.WorkoutExerciseData item : workout.exercises()) {
				DataBackup.ExerciseData exercise = requireExercise(exercises, item == null ? null : item.exerciseName());
				if (item.exerciseOrder() == null || item.exerciseOrder() < 1 || !orders.add(item.exerciseOrder())
						|| !exerciseNames.add(key(item.exerciseName()))
						|| item.sets() == null || item.cardioEntries() == null) {
					throw invalid("Workout exercise order and entry lists must be valid.");
				}
				validateEntries(item, exercise.trainingType());
			}
		}

		for (DataBackup.TemplateData template : backup.templates()) {
			if (template == null || blank(template.name()) || template.name().strip().length() > 120
					|| tooLong(template.notes(), 500) || template.exercises() == null) {
				throw invalid("Each template needs a valid name and exercise list.");
			}
			Set<Integer> orders = new HashSet<>();
			Set<String> exerciseNames = new HashSet<>();
			for (DataBackup.TemplateExerciseData item : template.exercises()) {
				requireExercise(exercises, item == null ? null : item.exerciseName());
				if (item.exerciseOrder() == null || item.exerciseOrder() < 1 || !orders.add(item.exerciseOrder())
						|| !exerciseNames.add(key(item.exerciseName()))) {
					throw invalid("Template exercise order must be positive and unique.");
				}
			}
		}

		Set<String> goals = new HashSet<>();
		for (DataBackup.GoalData goal : backup.goals()) {
			DataBackup.ExerciseData exercise = requireExercise(exercises, goal == null ? null : goal.exerciseName());
			if (goal.metric() == null || !positive(goal.targetValue())
					|| goal.targetValue().scale() > 2 || integerDigits(goal.targetValue()) > 8
					|| !metricMatches(exercise.trainingType(), goal.metric())
					|| !goals.add(key(goal.exerciseName()) + ":" + goal.metric())) {
				throw invalid("Each goal must be unique and match its exercise type.");
			}
		}
		return exercises;
	}

	private void validateEntries(DataBackup.WorkoutExerciseData item, TrainingType trainingType) {
		if (trainingType == TrainingType.STRENGTH && !item.cardioEntries().isEmpty()
				|| trainingType == TrainingType.CARDIO && !item.sets().isEmpty()) {
			throw invalid("Workout entries must match the exercise training type.");
		}
		Set<Integer> numbers = new HashSet<>();
		for (DataBackup.SetData set : item.sets()) {
			if (set == null || set.setNumber() == null || set.setNumber() < 1 || !numbers.add(set.setNumber())
					|| set.reps() == null || set.reps() < 1 || set.weight() == null
					|| set.weight().signum() < 0 || set.weight().scale() > 2 || integerDigits(set.weight()) > 5) {
				throw invalid("Strength sets contain invalid values.");
			}
		}
		for (DataBackup.CardioData entry : item.cardioEntries()) {
			if (entry == null || !positive(entry.durationMinutes()) || entry.durationMinutes().scale() > 2
					|| integerDigits(entry.durationMinutes()) > 5
					|| entry.level() != null && (entry.level().signum() < 0 || entry.level().scale() > 2
							|| integerDigits(entry.level()) > 3)) {
				throw invalid("Cardio entries contain invalid values.");
			}
		}
	}

	private static DataBackup.ExerciseData requireExercise(
			Map<String, DataBackup.ExerciseData> exercises, String name) {
		DataBackup.ExerciseData item = blank(name) ? null : exercises.get(key(name));
		if (item == null) throw invalid("Every exercise reference must match an exported exercise name.");
		return item;
	}

	private static boolean metricMatches(TrainingType type, GoalMetric metric) {
		return type == TrainingType.CARDIO
				? metric == GoalMetric.CARDIO_DURATION || metric == GoalMetric.CARDIO_LEVEL
				: metric == GoalMetric.STRENGTH_MAX_WEIGHT || metric == GoalMetric.STRENGTH_MAX_VOLUME;
	}

	private static boolean positive(BigDecimal value) {
		return value != null && value.signum() > 0;
	}

	private static int integerDigits(BigDecimal value) {
		return Math.max(0, value.precision() - value.scale());
	}

	private static boolean tooLong(String value, int maximum) {
		return value != null && value.strip().length() > maximum;
	}

	private static boolean blank(String value) {
		return value == null || value.isBlank();
	}

	private static String nullableText(String value) {
		if (value == null) return null;
		String normalized = value.strip();
		return normalized.isEmpty() ? null : normalized;
	}

	private static String key(String value) {
		return value.strip().toLowerCase(Locale.ROOT);
	}

	private static BadRequestException invalid(String message) {
		return new BadRequestException("Invalid backup: " + message);
	}
}
