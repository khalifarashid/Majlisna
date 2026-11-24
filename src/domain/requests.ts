import { addDays, isPreferredWeddingDay } from './dates';
import type { DateRequest, ISODate, RequestStatus } from './types';

/**
 * Date-request lifecycle. The government majlis team decides; Majlisna only records.
 *
 *   pending ──approve──▶ approved
 *      │  └──reject───▶ rejected
 *      │  └──suggest──▶ alternative ──acceptAlternative──▶ approved
 *      │                     └────declineAlternative──▶ cancelled
 *      └──cancel──▶ cancelled
 */
export type RequestAction =
  | { type: 'approve'; at: number; note?: string }
  | { type: 'reject'; at: number; reason: string }
  | { type: 'suggest'; at: number; date: ISODate; note?: string }
  | { type: 'acceptAlternative'; at: number }
  | { type: 'declineAlternative'; at: number }
  | { type: 'cancel'; at: number };

export class InvalidTransition extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransition';
  }
}

const ACTIVE: RequestStatus[] = ['pending', 'approved', 'alternative'];

export function isActive(r: DateRequest): boolean {
  return ACTIVE.includes(r.status);
}

/** A date counts as taken only once the majlis team has approved a request for it. */
export function isDateTaken(requests: DateRequest[], majlisId: string, date: ISODate, exceptId?: string): boolean {
  return requests.some((r) => r.id !== exceptId && r.majlisId === majlisId && r.date === date && r.status === 'approved');
}

export function transition(req: DateRequest, action: RequestAction, others: DateRequest[] = []): DateRequest {
  const staff = (status: RequestStatus, patch: Partial<DateRequest>, note?: string, date?: ISODate): DateRequest => ({
    ...req,
    ...patch,
    status,
    decidedAt: action.at,
    history: [...req.history, { at: action.at, status, by: 'staff', note, date }],
  });
  const resident = (status: RequestStatus, patch: Partial<DateRequest>, date?: ISODate): DateRequest => ({
    ...req,
    ...patch,
    status,
    history: [...req.history, { at: action.at, status, by: 'resident', date }],
  });

  switch (action.type) {
    case 'approve': {
      expect(req, 'pending', 'approve');
      if (isDateTaken(others, req.majlisId, req.date, req.id)) {
        throw new InvalidTransition('This date is already approved for another request at this majlis.');
      }
      return staff('approved', {}, action.note);
    }
    case 'reject': {
      expect(req, 'pending', 'reject');
      const reason = action.reason.trim();
      if (!reason) throw new InvalidTransition('A reason is required to reject a request.');
      return staff('rejected', { reason }, reason);
    }
    case 'suggest': {
      expect(req, 'pending', 'suggest');
      if (action.date === req.date) throw new InvalidTransition('Suggest a different date.');
      if (isDateTaken(others, req.majlisId, action.date, req.id)) {
        throw new InvalidTransition('The suggested date is already taken.');
      }
      return staff('alternative', { alternativeDate: action.date }, action.note, action.date);
    }
    case 'acceptAlternative': {
      expect(req, 'alternative', 'accept the alternative for');
      const date = req.alternativeDate;
      if (!date) throw new InvalidTransition('No alternative date to accept.');
      if (isDateTaken(others, req.majlisId, date, req.id)) {
        throw new InvalidTransition('The suggested date has since been taken.');
      }
      return resident('approved', { date, alternativeDate: undefined }, date);
    }
    case 'declineAlternative': {
      expect(req, 'alternative', 'decline the alternative for');
      return resident('cancelled', { alternativeDate: undefined });
    }
    case 'cancel': {
      if (req.status !== 'pending' && req.status !== 'alternative') {
        throw new InvalidTransition(`Cannot cancel a ${req.status} request.`);
      }
      return resident('cancelled', {});
    }
  }
}

function expect(req: DateRequest, status: RequestStatus, verb: string) {
  if (req.status !== status) throw new InvalidTransition(`Cannot ${verb} a ${req.status} request.`);
}

/** Active requests that share a majlis and date, keyed `majlisId|date`. Only groups of two or more. */
export function findClashes(requests: DateRequest[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const r of requests) {
    if (r.status !== 'pending' && r.status !== 'approved') continue;
    const key = `${r.majlisId}|${r.date}`;
    (groups[key] ??= []).push(r.id);
  }
  return Object.fromEntries(Object.entries(groups).filter(([, ids]) => ids.length > 1));
}

/** Other active requests competing for the same majlis and date. */
export function clashesFor(req: DateRequest, requests: DateRequest[]): DateRequest[] {
  return requests.filter(
    (r) => r.id !== req.id && r.majlisId === req.majlisId && r.date === req.date && (r.status === 'pending' || r.status === 'approved'),
  );
}

/**
 * Nearest free dates for a majlis, starting at `from` (inclusive).
 * Thursday-Saturday come first; other days only fill the gap. Returned in date order.
 */
export function suggestDates(requests: DateRequest[], majlisId: string, from: ISODate, count = 3, horizonDays = 120): ISODate[] {
  const free: ISODate[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const d = addDays(from, i);
    if (!isDateTaken(requests, majlisId, d)) free.push(d);
  }
  const preferred = free.filter(isPreferredWeddingDay).slice(0, count);
  const fill = free.filter((d) => !preferred.includes(d)).slice(0, Math.max(0, count - preferred.length));
  return [...preferred, ...fill].sort();
}
