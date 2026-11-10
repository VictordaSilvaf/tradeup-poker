const KEY = 'tradeuppoker:recent-rooms:v1';
const MAX = 12;

export const recentRooms = {
  read(): string[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX)
        : [];
    } catch {
      return [];
    }
  },
  remember(roomId: string) {
    try {
      const next = [roomId, ...this.read().filter((id) => id !== roomId)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private mode */
    }
  },
};
