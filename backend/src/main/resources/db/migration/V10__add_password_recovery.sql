alter table app_users
    add column email varchar(254);

create unique index uk_app_users_email
    on app_users (lower(email))
    where email is not null;

create table password_reset_tokens (
    id bigserial primary key,
    user_id bigint not null references app_users(id) on delete cascade,
    token_hash varchar(64) not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    constraint uk_password_reset_tokens_hash unique (token_hash)
);

create index ix_password_reset_tokens_user_id
    on password_reset_tokens(user_id);
