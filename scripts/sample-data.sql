-- Run with refresh-sample-data.ps1. Sample rows are deliberately labeled.
-- All cleanup and inserts succeed or roll back together.
begin;

\if :replace_all
delete from exercise_goals;
delete from workout_templates;
delete from workouts;
delete from exercises;
\else
delete from exercise_goals
where exercise_id in (
    select id from exercises where instructions like '[Sample data]%'
);
delete from workout_templates where notes like '[Sample data]%';
delete from workout_template_exercises
where exercise_id in (
    select id from exercises where instructions like '[Sample data]%'
);
delete from workouts where notes like '[Sample data]%';
\endif

create temporary table sample_exercises (
    code text primary key, name text, muscle_group text, training_type text, instructions text, base_weight numeric
) on commit drop;
insert into sample_exercises values
('bench', 'Sample Bench Press', 'Chest', 'STRENGTH', 'Use the same bench and grip for consistent logging. Record the total barbell weight.', 95),
('press', 'Sample Dumbbell Shoulder Press', 'Shoulders', 'STRENGTH', 'Use a seated setup. Record the weight of one dumbbell consistently.', 20),
('squat', 'Sample Back Squat', 'Legs', 'STRENGTH', 'Use a consistent stance and depth. Record the total barbell weight.', 115),
('deadlift', 'Sample Romanian Deadlift', 'Legs', 'STRENGTH', 'Use the same barbell setup and range of motion. Record the total barbell weight.', 95),
('row', 'Sample Cable Row', 'Back', 'STRENGTH', 'Use the same cable station and handle. Record the displayed stack weight.', 70),
('pulldown', 'Sample Lat Pulldown', 'Back', 'STRENGTH', 'Use the same machine and grip. Record the displayed stack weight.', 75),
('bike', 'Sample Stationary Bike', null, 'CARDIO', 'Use the same bike for level comparisons. Log separate entries when resistance changes.', null),
('stairs', 'Sample Stair Climber', null, 'CARDIO', 'Use the same machine for level comparisons. Record duration in minutes.', null),
('walk', 'Sample Outdoor Walk', null, 'CARDIO', 'Record walking duration. Leave machine level blank for outdoor walks.', null);

-- Reuse sample exercises referenced by retained workouts, but never overwrite a
-- same-name personal exercise.
do $$
begin
    if exists (
        select 1
        from exercises exercise
        join sample_exercises sample on sample.name = exercise.name
        where exercise.instructions is null
           or exercise.instructions not like '[Sample data]%'
    ) then
        raise exception 'A non-sample exercise has the same name as a sample exercise.';
    end if;
end $$;

insert into exercises (name, muscle_group, category, training_type, instructions)
select name, muscle_group, 'None', training_type, '[Sample data] ' || instructions
from sample_exercises
on conflict (name) do update set
    muscle_group = excluded.muscle_group,
    category = excluded.category,
    training_type = excluded.training_type,
    instructions = excluded.instructions,
    updated_at = now();

create temporary table sample_workouts (sequence integer, days_ago integer, kind integer, block integer, workout_id bigint) on commit drop;
insert into sample_workouts (sequence, days_ago, kind, block)
select n, (3 - n / 3) * 7 + (2 - n % 3) * 2, n % 3, n / 3 from generate_series(0, 11) n;

do $$
declare sample record; inserted_id bigint;
begin
    for sample in select * from sample_workouts order by sequence loop
        insert into workouts (workout_date, title, notes)
        values (
            current_setting('app.sample_date')::date - sample.days_ago,
            case sample.kind when 0 then 'Sample Push And Bike' when 1 then 'Sample Lower And Stairs' else 'Sample Pull And Walk' end,
            '[Sample data] Training block ' || (sample.block + 1) || '. Fictional entries for exploring workouts and progress.'
        ) returning id into inserted_id;
        update sample_workouts set workout_id = inserted_id where sequence = sample.sequence;
    end loop;
end $$;

insert into workout_exercises (workout_id, exercise_id, exercise_order)
select w.workout_id, e.id, choice.exercise_order
from sample_workouts w
join (values
    (0, 'bench', 1), (0, 'press', 2), (0, 'bike', 3),
    (1, 'squat', 1), (1, 'deadlift', 2), (1, 'stairs', 3),
    (2, 'row', 1), (2, 'pulldown', 2), (2, 'walk', 3)
) choice(kind, code, exercise_order) on choice.kind = w.kind
join sample_exercises se on se.code = choice.code
join exercises e on e.name = se.name;

insert into set_entries (workout_exercise_id, set_number, reps, weight)
select we.id, s, case when s = 3 then 8 else 10 end, se.base_weight + w.block * 5
from sample_workouts w
join workout_exercises we on we.workout_id = w.workout_id
join exercises e on e.id = we.exercise_id
join sample_exercises se on se.name = e.name
cross join generate_series(1, 3) s
where se.training_type = 'STRENGTH';

insert into cardio_entries (workout_exercise_id, duration_minutes, level)
select we.id,
    case se.code when 'bike' then 12 + w.block * 3 when 'stairs' then 10 + w.block * 2 else 20 + w.block * 5 end,
    case se.code when 'bike' then 3 + w.block when 'stairs' then 2 + w.block else null end
from sample_workouts w
join workout_exercises we on we.workout_id = w.workout_id
join exercises e on e.id = we.exercise_id
join sample_exercises se on se.name = e.name
where se.training_type = 'CARDIO';

-- A second interval demonstrates summed duration and the highest recorded level.
insert into cardio_entries (workout_exercise_id, duration_minutes, level)
select we.id, 5, 2
from sample_workouts w
join workout_exercises we on we.workout_id = w.workout_id
join exercises e on e.id = we.exercise_id
where e.name = 'Sample Stationary Bike';

insert into workout_templates (name, notes) values
('Sample Push And Bike', '[Sample data] Reusable strength and cardio routine.'),
('Sample Lower And Stairs', '[Sample data] Reusable lower-body and cardio routine.'),
('Sample Pull And Walk', '[Sample data] Reusable pull and outdoor cardio routine.');

insert into workout_template_exercises (workout_template_id, exercise_id, exercise_order)
select template.id, exercise.id, choice.exercise_order
from (values
    ('Sample Push And Bike', 'Sample Bench Press', 1),
    ('Sample Push And Bike', 'Sample Dumbbell Shoulder Press', 2),
    ('Sample Push And Bike', 'Sample Stationary Bike', 3),
    ('Sample Lower And Stairs', 'Sample Back Squat', 1),
    ('Sample Lower And Stairs', 'Sample Romanian Deadlift', 2),
    ('Sample Lower And Stairs', 'Sample Stair Climber', 3),
    ('Sample Pull And Walk', 'Sample Cable Row', 1),
    ('Sample Pull And Walk', 'Sample Lat Pulldown', 2),
    ('Sample Pull And Walk', 'Sample Outdoor Walk', 3)
) choice(template_name, exercise_name, exercise_order)
join workout_templates template on template.name = choice.template_name
join exercises exercise on exercise.name = choice.exercise_name;

insert into exercise_goals (exercise_id, metric, target_value)
select exercise.id, goal.metric, goal.target_value
from (values
    ('Sample Bench Press', 'STRENGTH_MAX_WEIGHT', 120.00),
    ('Sample Stationary Bike', 'CARDIO_DURATION', 30.00)
) goal(exercise_name, metric, target_value)
join exercises exercise on exercise.name = goal.exercise_name;

commit;
