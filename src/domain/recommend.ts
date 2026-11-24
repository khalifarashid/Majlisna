import { diffDays } from './dates';
import type { CommunityEvent, Interest, ISODate } from './types';

export interface ScoredEvent {
  eventId: string;
  score: number;
  /** The interest that matched best, used to explain the pick. */
  matched: Interest | null;
}

/**
 * Baseline recommender (and the fallback when AI is off or unavailable):
 * +3 per matching interest, +1 if within a week, small penalty if nearly full.
 * Past events are dropped.
 */
export function scoreEvents(events: CommunityEvent[], interests: Interest[], today: ISODate, limit = 3): ScoredEvent[] {
  return events
    .filter((e) => diffDays(e.date, today) >= 0)
    .map((e) => {
      const hits = e.tags.filter((t) => interests.includes(t));
      const days = diffDays(e.date, today);
      const soon = days <= 7 ? 1 : 0;
      const full = e.going >= e.capacity ? -2 : 0;
      return { eventId: e.id, score: hits.length * 3 + soon + full, matched: hits[0] ?? null };
    })
    .sort((a, b) => b.score - a.score || a.eventId.localeCompare(b.eventId))
    .slice(0, limit);
}
