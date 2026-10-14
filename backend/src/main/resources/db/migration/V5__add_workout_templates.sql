create table workout_templates (
    id bigserial primary key,
    name varchar(120) not null,
    notes varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table workout_template_exercises (
    id bigserial primary key,
    workout_template_id bigint not null references workout_templates (id) on delete cascade,
    exercise_id bigint not null references exercises (id),
    exercise_order integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_workout_template_exercises_order_positive check (exercise_order > 0),
    constraint uk_workout_template_exercises_order unique (workout_template_id, exercise_order)
);

create index idx_workout_template_exercises_template_id
    on workout_template_exercises (workout_template_id);
create index idx_workout_template_exercises_exercise_id
    on workout_template_exercises (exercise_id);
