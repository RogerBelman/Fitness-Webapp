alter table exercises add column user_id bigint references app_users (id);
alter table workouts add column user_id bigint references app_users (id);
alter table workout_templates add column user_id bigint references app_users (id);

-- Preserve existing development data when an account already exists. If an
-- older installation has data but no account, those rows remain unowned and
-- invisible until they are intentionally replaced or assigned.
update exercises set user_id = (select min(id) from app_users) where user_id is null;
update workouts set user_id = (select min(id) from app_users) where user_id is null;
update workout_templates set user_id = (select min(id) from app_users) where user_id is null;

-- NOT VALID skips the legacy-row scan while still enforcing ownership for all
-- new and updated rows.
alter table exercises add constraint ck_exercises_user_required
    check (user_id is not null) not valid;
alter table workouts add constraint ck_workouts_user_required
    check (user_id is not null) not valid;
alter table workout_templates add constraint ck_workout_templates_user_required
    check (user_id is not null) not valid;

alter table exercises drop constraint uk_exercises_name;
create unique index uk_exercises_user_name_ci on exercises (user_id, lower(name));

create index idx_exercises_user_id on exercises (user_id);
create index idx_workouts_user_id on workouts (user_id);
create index idx_workout_templates_user_id on workout_templates (user_id);
