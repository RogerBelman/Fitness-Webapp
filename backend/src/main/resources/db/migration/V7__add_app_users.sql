create table app_users (
    id bigserial primary key,
    username varchar(50) not null,
    password_hash varchar(100) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uk_app_users_username unique (username),
    constraint ck_app_users_username_lowercase check (username = lower(username))
);
