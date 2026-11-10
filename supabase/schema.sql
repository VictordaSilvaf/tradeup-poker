-- TradeUpPoker — schema + RLS + RPCs
-- Preferir aplicar via MCP/CLI (migration). Também pode colar no SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id text primary key check (char_length(id) between 4 and 64),
  payload jsonb not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_payload_is_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists rooms_updated_at_idx on public.rooms (updated_at desc);

alter table public.rooms enable row level security;
alter table public.rooms force row level security;

-- Sem políticas abertas de SELECT/UPDATE: acesso só via RPCs security definer.
revoke all on table public.rooms from anon, authenticated, public;
grant usage on schema public to anon, authenticated;

drop policy if exists rooms_no_direct_access on public.rooms;

create or replace function public.get_room(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.rooms%rowtype;
begin
  if p_id is null or char_length(p_id) < 4 or char_length(p_id) > 64 then
    return null;
  end if;

  select * into row from public.rooms where id = p_id;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'id', row.id,
    'payload', row.payload,
    'version', row.version,
    'created_at', row.created_at,
    'updated_at', row.updated_at
  );
end;
$$;

create or replace function public.create_room(p_id text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null or char_length(p_id) < 4 or char_length(p_id) > 64 then
    raise exception 'INVALID_ROOM_ID' using errcode = 'P0001';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  insert into public.rooms (id, payload, version)
  values (p_id, p_payload, 1);
  return jsonb_build_object('id', p_id, 'payload', p_payload, 'version', 1);
exception
  when unique_violation then
    raise exception 'ROOM_EXISTS' using errcode = 'P0001';
end;
$$;

create or replace function public.save_room(p_id text, p_version integer, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_version integer;
begin
  if p_id is null or char_length(p_id) < 4 or char_length(p_id) > 64 then
    raise exception 'INVALID_ROOM_ID' using errcode = 'P0001';
  end if;
  if p_version is null or p_version < 1 then
    raise exception 'INVALID_VERSION' using errcode = 'P0001';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  update public.rooms
  set
    payload = p_payload,
    version = version + 1,
    updated_at = now()
  where id = p_id and version = p_version
  returning version into new_version;

  if new_version is null then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'id', p_id,
    'payload', p_payload,
    'version', new_version
  );
end;
$$;

revoke all on function public.get_room(text) from public;
revoke all on function public.create_room(text, jsonb) from public;
revoke all on function public.save_room(text, integer, jsonb) from public;

grant execute on function public.get_room(text) to anon, authenticated;
grant execute on function public.create_room(text, jsonb) to anon, authenticated;
grant execute on function public.save_room(text, integer, jsonb) to anon, authenticated;

-- Realtime: o client assina broadcast no tópico room:{id}.
-- O trigger publica mudanças sem expor SELECT direto na tabela.
create or replace function public.broadcast_room_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(
    jsonb_build_object('room_id', NEW.id, 'version', NEW.version),
    'room_changed',
    'room:' || NEW.id,
    false
  );
  return NEW;
exception
  when undefined_function then
    -- Ambientes sem realtime.send continuam funcionando (polling no client).
    return NEW;
  when others then
    return NEW;
end;
$$;

drop trigger if exists rooms_broadcast_change on public.rooms;
create trigger rooms_broadcast_change
  after insert or update on public.rooms
  for each row execute function public.broadcast_room_change();

-- Trigger não deve ser chamável via /rest/v1/rpc.
revoke all on function public.broadcast_room_change() from public, anon, authenticated;

-- Nota de modelo de segurança:
-- - Tabela rooms sem acesso direto (RLS + revoke).
-- - Código da sala é o segredo compartilhado (RPC anon).
-- - Máscara de votos no client (maskRoomVotes); get_room precisa do payload
--   completo para optimistic locking em save_room.
