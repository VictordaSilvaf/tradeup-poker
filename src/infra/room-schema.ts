import { z } from 'zod';
import type { Room } from '../domain/room';

export const roomPayloadSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  ownerId: z.string(),
  deck: z.enum(['fibonacci', 'simplified', 'tshirt']),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1).max(30),
      vote: z.string().nullable(),
      voted: z.boolean().optional(),
      spectator: z.boolean(),
    }),
  ),
  revealed: z.boolean(),
  round: z.number().int().positive(),
  issues: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      done: z.boolean(),
      estimate: z.number().nullable(),
    }),
  ),
  activeIssueId: z.string().nullable(),
  history: z.array(
    z.object({
      id: z.string(),
      number: z.number(),
      title: z.string(),
      votes: z.array(z.string()),
      finishedAt: z.string(),
    }),
  ),
  createdAt: z.string(),
  timerEndsAt: z.number().nullable(),
  revealEndsAt: z.number().nullable().optional(),
});

export function parseRoomPayload(payload: unknown): Room {
  const result = roomPayloadSchema.safeParse(payload);
  if (!result.success) throw new Error('Invalid room payload');
  return {
    ...result.data,
    revealEndsAt: result.data.revealEndsAt ?? null,
    participants: result.data.participants.map((participant) => ({
      ...participant,
      voted: participant.voted ?? participant.vote !== null,
    })),
  };
}
