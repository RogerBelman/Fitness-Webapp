ALTER TABLE exercises
    ADD COLUMN movement_type varchar(16),
    ADD COLUMN rep_range_min integer,
    ADD COLUMN rep_range_max integer,
    ADD COLUMN duration_min_minutes numeric(7,2),
    ADD COLUMN duration_max_minutes numeric(7,2),
    ADD CONSTRAINT ck_exercise_movement_type CHECK (movement_type IN ('COMPOUND', 'ISOLATION')),
    ADD CONSTRAINT ck_exercise_rep_range CHECK (
        (rep_range_min IS NULL) = (rep_range_max IS NULL)
        AND (rep_range_min IS NULL OR (rep_range_min > 0 AND rep_range_max >= rep_range_min))),
    ADD CONSTRAINT ck_exercise_duration_range CHECK (
        (duration_min_minutes IS NULL) = (duration_max_minutes IS NULL)
        AND (duration_min_minutes IS NULL OR (duration_min_minutes > 0 AND duration_max_minutes >= duration_min_minutes))),
    ADD CONSTRAINT ck_exercise_strength_defaults CHECK (
        training_type = 'STRENGTH' OR (movement_type IS NULL AND rep_range_min IS NULL AND rep_range_max IS NULL)),
    ADD CONSTRAINT ck_exercise_cardio_defaults CHECK (
        training_type = 'CARDIO' OR (duration_min_minutes IS NULL AND duration_max_minutes IS NULL));
