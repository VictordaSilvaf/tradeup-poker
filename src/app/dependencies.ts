import { PlanningService } from '../application/planning-service';
import type { RoomRepository } from '../application/ports';
import { hasSupabaseEnv } from '../infra/env';
import { LocalRoomRepository } from '../infra/local-room-repository';
import { SupabaseRoomRepository } from '../infra/supabase-room-repository';

function createRoomRepository(): RoomRepository {
  if (hasSupabaseEnv()) return new SupabaseRoomRepository();
  console.warn(
    '[TradeUpPoker] Supabase não configurado — usando armazenamento local. Copie .env.example para .env.',
  );
  return new LocalRoomRepository();
}

export const planning = new PlanningService(
  createRoomRepository(),
  { newId: () => crypto.randomUUID() },
  { now: () => new Date() },
);

export const isRealtimeEnabled = hasSupabaseEnv();
