ALTER TABLE exercises
    ADD COLUMN muscle_focus varchar(80),
    ADD CONSTRAINT ck_exercise_muscle_focus CHECK (
        muscle_focus IS NULL
        OR (training_type = 'STRENGTH' AND length(trim(muscle_focus)) > 0));
