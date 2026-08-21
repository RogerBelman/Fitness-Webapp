create table exercises (
    id bigserial primary key,
    name varchar(120) not null,
    muscle_group varchar(80) not null,
    category varchar(80) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uk_exercises_name unique (name)
);

create table workouts (
    id bigserial primary key,
    workout_date date not null default current_date,
    title varchar(120),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table workout_exercises (
    id bigserial primary key,
    workout_id bigint not null references workouts (id) on delete cascade,
    exercise_id bigint not null references exercises (id),
    exercise_order integer not null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_workout_exercises_order_positive check (exercise_order > 0),
    constraint uk_workout_exercises_order unique (workout_id, exercise_order)
);

create table set_entries (
    id bigserial primary key,
    workout_exercise_id bigint not null references workout_exercises (id) on delete cascade,
    set_number integer not null,
    reps integer not null,
    weight numeric(7, 2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_set_entries_set_number_positive check (set_number > 0),
    constraint ck_set_entries_reps_positive check (reps > 0),
    constraint ck_set_entries_weight_non_negative check (weight >= 0),
    constraint uk_set_entries_workout_exercise_set unique (workout_exercise_id, set_number)
);

create index idx_exercises_muscle_group on exercises (muscle_group);
create index idx_exercises_category on exercises (category);
create index idx_workouts_workout_date on workouts (workout_date);
create index idx_workout_exercises_workout_id on workout_exercises (workout_id);
create index idx_workout_exercises_exercise_id on workout_exercises (exercise_id);
create index idx_set_entries_workout_exercise_id on set_entries (workout_exercise_id);
