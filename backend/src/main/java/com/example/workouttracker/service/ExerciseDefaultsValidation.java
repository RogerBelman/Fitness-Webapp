package com.example.workouttracker.service;

import java.math.BigDecimal;
import java.util.List;
import com.example.workouttracker.entity.MovementType;
import com.example.workouttracker.entity.TrainingType;
import com.example.workouttracker.exception.BadRequestException;

public final class ExerciseDefaultsValidation {
    private static final List<String> MUSCLE_GROUPS = List.of("Chest", "Back", "Legs", "Shoulders", "Arms", "Core");

    private ExerciseDefaultsValidation() { }

    public static String normalizeMuscleGroup(TrainingType type, String group) {
        if (type == TrainingType.CARDIO) {
            return null;
        }
        if (group == null || group.isBlank()) {
            throw new BadRequestException("muscleGroup is required for strength exercises.");
        }
        return MUSCLE_GROUPS.stream().filter(allowed -> allowed.equalsIgnoreCase(group.strip()))
                .findFirst().orElseThrow(() -> new BadRequestException(
                        "muscleGroup must be Chest, Back, Legs, Shoulders, Arms, or Core. Use muscleFocus for more specific details."));
    }

    public static String normalizeMuscleFocus(TrainingType type, String focus) {
        if (focus != null && focus.length() > 80) {
            throw new BadRequestException("muscleFocus must be 80 characters or less.");
        }
        if (focus == null || focus.isBlank()) {
            return null;
        }
        if (type != TrainingType.STRENGTH) {
            throw new BadRequestException("Muscle focus applies only to strength exercises.");
        }
        return focus.strip();
    }

    public static void validate(TrainingType type, MovementType movement,
            Integer repMin, Integer repMax, BigDecimal durationMin, BigDecimal durationMax, Integer workingSets) {
        if (type != TrainingType.STRENGTH && (movement != null || repMin != null || repMax != null || workingSets != null)) {
            throw new BadRequestException("Movement type, working sets, and rep range apply only to strength exercises.");
        }
        if (workingSets != null && workingSets <= 0) {
            throw new BadRequestException("Target working sets must be greater than zero.");
        }
        if (type != TrainingType.CARDIO && (durationMin != null || durationMax != null)) {
            throw new BadRequestException("Duration range applies only to cardio exercises.");
        }
        if ((repMin == null) != (repMax == null)
                || repMin != null && (repMin <= 0 || repMax < repMin)) {
            throw new BadRequestException("Rep range needs both bounds, greater than zero, with minimum no greater than maximum.");
        }
        if (invalidDuration(durationMin) || invalidDuration(durationMax)
                || durationMin != null && durationMax != null && durationMax.compareTo(durationMin) < 0) {
            throw new BadRequestException("Duration targets must be from 0.01 to 99999.99 minutes with up to two decimal places. If both are supplied, minimum must not exceed maximum.");
        }
    }

    private static boolean invalidDuration(BigDecimal value) {
        return value != null && (value.signum() <= 0
                || value.compareTo(new BigDecimal("99999.99")) > 0
                || value.stripTrailingZeros().scale() > 2);
    }
}
