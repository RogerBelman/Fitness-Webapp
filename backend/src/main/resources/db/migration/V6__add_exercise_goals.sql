create table exercise_goals (
    id bigserial primary key,
    exercise_id bigint not null references exercises (id),
    metric varchar(32) not null,
    target_value numeric(10, 2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_exercise_goals_target_positive check (target_value > 0),
    constraint uk_exercise_goals_exercise_metric unique (exercise_id, metric)
);

create index idx_exercise_goals_exercise_id on exercise_goals (exercise_id);
