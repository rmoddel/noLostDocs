create unique index if not exists subscriptions_provider_subscription_id_key
on public.subscriptions (provider_subscription_id)
where provider_subscription_id is not null;

create unique index if not exists subscriptions_user_provider_key
on public.subscriptions (user_id, provider);
