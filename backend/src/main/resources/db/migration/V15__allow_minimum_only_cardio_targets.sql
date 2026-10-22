ALTER TABLE exercises
    DROP CONSTRAINT ck_exercise_duration_range,
    ADD CONSTRAINT ck_exercise_duration_range CHECK (
        (duration_min_minutes IS NULL AND duration_max_minutes IS NULL)
        OR (duration_min_minutes IS NOT NULL AND duration_min_minutes > 0
            AND (duration_max_minutes IS NULL OR duration_max_minutes >= duration_min_minutes)));
