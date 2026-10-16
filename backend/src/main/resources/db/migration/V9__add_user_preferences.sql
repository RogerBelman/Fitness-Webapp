alter table app_users
    add column weight_unit varchar(2) not null default 'lb';

alter table app_users
    add constraint ck_app_users_weight_unit
    check (weight_unit in ('lb', 'kg'));
