import { describe, expect, it } from 'vitest';
import { findClashes, InvalidTransition, isDateTaken, suggestDates, transition } from './requests';
import type { DateRequest } from './types';

const base = (over: Partial<DateRequest> = {}): DateRequest => ({
  id: 'r1',
  residentId: 'u1',
  residentName: 'Hamad',
  majlisId: 'm1',
  date: '2026-12-10',
  guests: 200,
  occasion: 'wedding',
  status: 'pending',
  createdAt: 0,
  history: [{ at: 0, status: 'pending', by: 'resident' }],
  ...over,
});

describe('transition', () => {
  it('approves a pending request and stamps the decision', () => {
    const r = transition(base(), { type: 'approve', at: 5 });
    expect(r.status).toBe('approved');
    expect(r.decidedAt).toBe(5);
    expect(r.history.at(-1)).toMatchObject({ status: 'approved', by: 'staff' });
  });

  it('requires a reason to reject', () => {
    expect(() => transition(base(), { type: 'reject', reason: '  ', at: 1 })).toThrow(InvalidTransition);
    expect(transition(base(), { type: 'reject', reason: 'Majlis maintenance', at: 1 })).toMatchObject({
      status: 'rejected',
      reason: 'Majlis maintenance',
    });
  });

  it('suggests another date, and the resident can accept it', () => {
    const s = transition(base(), { type: 'suggest', date: '2026-12-11', at: 1 });
    expect(s).toMatchObject({ status: 'alternative', alternativeDate: '2026-12-11' });
    const a = transition(s, { type: 'acceptAlternative', at: 2 });
    expect(a).toMatchObject({ status: 'approved', date: '2026-12-11' });
    expect(a.alternativeDate).toBeUndefined();
  });

  it('cancels when the resident declines the alternative', () => {
    const s = transition(base(), { type: 'suggest', date: '2026-12-11', at: 1 });
    expect(transition(s, { type: 'declineAlternative', at: 2 }).status).toBe('cancelled');
  });

  it('refuses to approve a date already approved for that majlis', () => {
    const taken = base({ id: 'r0', status: 'approved' });
    expect(() => transition(base(), { type: 'approve', at: 1 }, [taken])).toThrow(InvalidTransition);
  });

  it('refuses decisions on closed requests', () => {
    const closed = base({ status: 'rejected' });
    expect(() => transition(closed, { type: 'approve', at: 1 })).toThrow(InvalidTransition);
  });
});

describe('scheduling helpers', () => {
  const approved = base({ id: 'a', status: 'approved', date: '2026-12-10' }); // Thursday

  it('knows when a date is taken (approved only)', () => {
    expect(isDateTaken([approved], 'm1', '2026-12-10')).toBe(true);
    expect(isDateTaken([base({ status: 'pending' })], 'm1', '2026-12-10')).toBe(false);
    expect(isDateTaken([approved], 'm2', '2026-12-10')).toBe(false);
  });

  it('flags clashes between active requests for the same majlis and date', () => {
    const clashes = findClashes([base({ id: 'x' }), base({ id: 'y' }), base({ id: 'z', date: '2026-12-12' })]);
    expect(clashes['m1|2026-12-10']).toEqual(['x', 'y']);
    expect(clashes['m1|2026-12-12']).toBeUndefined();
  });

  it('ignores rejected and cancelled requests when flagging clashes', () => {
    expect(findClashes([base({ id: 'x' }), base({ id: 'y', status: 'rejected' })])).toEqual({});
  });

  it('suggests the nearest free Thursday/Friday/Saturday first, skipping taken dates', () => {
    // 2026-12-10 is a Thursday and taken; search starts there.
    const out = suggestDates([approved], 'm1', '2026-12-10', 3);
    expect(out).toEqual(['2026-12-11', '2026-12-12', '2026-12-17']);
  });
});
