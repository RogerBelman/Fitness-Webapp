alter table exercises add column training_type varchar(16) not null default 'STRENGTH';
alter table exercises add constraint ck_exercises_training_type check (training_type in ('STRENGTH', 'CARDIO'));
alter table exercises alter column muscle_group drop not null;

-- Preserve legacy sets rather than reinterpret reps or weight as cardio data.
update exercises exercise
set training_type = 'CARDIO'
where lower(trim(exercise.category)) = 'cardio'
  and not exists (
      select 1 from workout_exercises workout_exercise
      join set_entries set_entry on set_entry.workout_exercise_id = workout_exercise.id
      where workout_exercise.exercise_id = exercise.id
  );

create table cardio_entries (
    id bigserial primary key,
    workout_exercise_id bigint not null references workout_exercises (id) on delete cascade,
    duration_minutes numeric(7, 2) not null,
    level numeric(5, 2),
    notes varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_cardio_entries_duration_positive check (duration_minutes > 0),
    constraint ck_cardio_entries_level_non_negative check (level >= 0)
);
create index idx_cardio_entries_workout_exercise_id on cardio_entries (workout_exercise_id);
