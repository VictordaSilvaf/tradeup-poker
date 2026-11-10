import { PlanningService } from '../application/planning-service';
import { LocalRoomRepository } from '../infra/local-room-repository';
export const planning = new PlanningService(
  new LocalRoomRepository(),
  { newId: () => crypto.randomUUID() },
  { now: () => new Date() },
);
