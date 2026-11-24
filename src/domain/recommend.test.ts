import { describe, expect, it } from 'vitest';
import { scoreEvents } from './recommend';
import { seedEvents } from './seed';

const today = '2026-11-24';

describe('scoreEvents', () => {
  it('ranks events that match the resident interests first and explains why', () => {
    const top = scoreEvents(seedEvents(today), ['poetry'], today, 1);
    expect(top[0]).toMatchObject({ eventId: 'e-nabati', matched: 'poetry' });
  });

  it('never recommends past events', () => {
    const events = seedEvents(today).map((e) => ({ ...e, date: '2026-01-01' }));
    expect(scoreEvents(events, ['heritage'], today)).toEqual([]);
  });

  it('still returns picks when the resident has no interests', () => {
    expect(scoreEvents(seedEvents(today), [], today, 3)).toHaveLength(3);
  });
});
