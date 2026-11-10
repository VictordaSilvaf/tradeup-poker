import type { Room } from '../domain/room';
export interface RoomRepository {
  find(id: string): Promise<Room | null>;
  list(): Promise<Room[]>;
  create(room: Room): Promise<void>;
  update(id: string, transform: (room: Room) => Room): Promise<Room>;
  subscribe(id: string, callback: () => void): () => void;
}
export interface IdentityProvider {
  newId(): string;
}
export interface Clock {
  now(): Date;
}
