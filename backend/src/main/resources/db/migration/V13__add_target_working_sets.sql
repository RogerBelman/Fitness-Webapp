ALTER TABLE exercises
    ADD COLUMN target_working_sets integer,
    ADD CONSTRAINT ck_exercise_working_sets CHECK (
        target_working_sets IS NULL OR (training_type = 'STRENGTH' AND target_working_sets > 0));
