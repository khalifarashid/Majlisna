import { splitCommission } from '../domain/money';
import { InvalidTransition, isDateTaken, transition } from '../domain/requests';
import {
  MAJLISES,
  ME,
  SERVICES,
  VENDORS,
  seedAnnouncements,
  seedEvents,
  seedIssues,
  seedNotifications,
  seedOrders,
  seedRequests,
  seedReviews,
} from '../domain/seed';
import type {
  AiPrefs,
  Announcement,
  AppNotification,
  CommunityEvent,
  DateRequest,
  Interest,
  ISODate,
  Issue,
  IssueCategory,
  L10n,
  Majlis,
  Occasion,
  Order,
  OrderStatus,
  Review,
  Role,
  Service,
  Vendor,
} from '../domain/types';

export const STATE_VERSION = 1;

export interface State {
  version: typeof STATE_VERSION;
  seededOn: ISODate;
  role: Role;
  me: { id: string; name: string };
  interests: Interest[];
  aiPrefs: AiPrefs;
  /** Which sample vendor the vendor portal is signed in as. */
  vendorId: string;
  majlises: Majlis[];
  events: CommunityEvent[];
  vendors: Vendor[];
  services: Service[];
  requests: DateRequest[];
  orders: Order[];
  announcements: Announcement[];
  reviews: Review[];
  issues: Issue[];
  notifications: AppNotification[];
  rsvps: string[];
  cart: string[];
}

export type Decision = { kind: 'approve' } | { kind: 'reject'; reason: string } | { kind: 'suggest'; date: ISODate; note?: string };

export type Action =
  | { type: 'setRole'; role: Role }
  | { type: 'setInterests'; interests: Interest[] }
  | { type: 'setAiPrefs'; prefs: Partial<AiPrefs> }
  | { type: 'setVendor'; vendorId: string }
  | { type: 'toggleRsvp'; eventId: string }
  | { type: 'submitRequest'; majlisId: string; date: ISODate; guests: number; occasion: Occasion; note?: string; at: number }
  | { type: 'decideRequest'; id: string; decision: Decision; at: number }
  | { type: 'respondAlternative'; id: string; accept: boolean; at: number }
  | { type: 'cancelRequest'; id: string; at: number }
  | { type: 'toggleCart'; serviceId: string }
  | { type: 'checkout'; requestId: string; at: number }
  | { type: 'vendorUpdateOrder'; id: string; status: Exclude<OrderStatus, 'awaiting_vendor'>; at: number }
  | { type: 'postAnnouncement'; majlisId: string; title: string; body: string; at: number }
  | { type: 'postEvent'; event: Omit<CommunityEvent, 'id' | 'going'>; at: number }
  | { type: 'reportIssue'; majlisId: string; category: IssueCategory; text: string; at: number }
  | { type: 'updateIssue'; id: string; status: Issue['status'] }
  | { type: 'addReview'; vendorId: string; rating: number; text: string; at: number }
  | { type: 'markRead'; role: Role }
  | { type: 'reset'; today: ISODate; at: number }
  | { type: 'replace'; state: State };

export function createInitialState(today: ISODate, now: number): State {
  return {
    version: STATE_VERSION,
    seededOn: today,
    role: 'resident',
    me: ME,
    interests: ['heritage', 'poetry', 'family'],
    aiPrefs: { enabled: true, personalise: true },
    vendorId: 'dallah',
    majlises: MAJLISES,
    events: seedEvents(today),
    vendors: VENDORS,
    services: SERVICES,
    requests: seedRequests(today, now),
    orders: seedOrders(today, now),
    announcements: seedAnnouncements(today, now),
    reviews: seedReviews(now),
    issues: seedIssues(now),
    notifications: seedNotifications(now),
    rsvps: [],
    cart: [],
  };
}

let counter = 0;
export function uid(prefix: string): string {
  counter = (counter + 1) % 1000;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

const same = (text: string): L10n => ({ en: text, ar: text });

function notify(s: State, to: Role, text: L10n, at: number): AppNotification[] {
  return [{ id: uid('n'), to, at, text, read: false }, ...s.notifications].slice(0, 60);
}

function majlisName(s: State, id: string): L10n {
  return s.majlises.find((m) => m.id === id)?.name ?? same(id);
}

const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  awaiting_vendor: ['confirmed', 'declined'],
  confirmed: ['completed', 'declined'],
  declined: [],
  completed: [],
};

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setRole':
      return { ...s, role: a.role };
    case 'setInterests':
      return { ...s, interests: a.interests };
    case 'setAiPrefs':
      return { ...s, aiPrefs: { ...s.aiPrefs, ...a.prefs } };
    case 'setVendor':
      return { ...s, vendorId: a.vendorId };
    case 'toggleRsvp': {
      const going = s.rsvps.includes(a.eventId);
      return {
        ...s,
        rsvps: going ? s.rsvps.filter((id) => id !== a.eventId) : [...s.rsvps, a.eventId],
        events: s.events.map((e) => (e.id === a.eventId ? { ...e, going: e.going + (going ? -1 : 1) } : e)),
      };
    }

    case 'submitRequest': {
      if (isDateTaken(s.requests, a.majlisId, a.date)) {
        throw new InvalidTransition('That date is already booked at this majlis. Pick another date.');
      }
      const open = s.requests.find((r) => r.residentId === s.me.id && (r.status === 'pending' || r.status === 'alternative'));
      if (open) throw new InvalidTransition('You already have a request waiting for a decision.');
      const req: DateRequest = {
        id: uid('req'),
        residentId: s.me.id,
        residentName: s.me.name,
        majlisId: a.majlisId,
        date: a.date,
        guests: a.guests,
        occasion: a.occasion,
        note: a.note?.trim() || undefined,
        status: 'pending',
        createdAt: a.at,
        history: [{ at: a.at, status: 'pending', by: 'resident' }],
      };
      const m = majlisName(s, a.majlisId);
      return {
        ...s,
        requests: [req, ...s.requests],
        notifications: notify(s, 'staff', { en: `New date request from ${s.me.name} for ${m.en}.`, ar: `طلب موعد جديد من ${s.me.name} في ${m.ar}.` }, a.at),
      };
    }

    case 'decideRequest': {
      const req = find(s.requests, a.id, 'request');
      const action =
        a.decision.kind === 'approve'
          ? ({ type: 'approve', at: a.at } as const)
          : a.decision.kind === 'reject'
            ? ({ type: 'reject', at: a.at, reason: a.decision.reason } as const)
            : ({ type: 'suggest', at: a.at, date: a.decision.date, note: a.decision.note } as const);
      const next = transition(req, action, s.requests);
      const m = majlisName(s, req.majlisId);
      const text: L10n =
        next.status === 'approved'
          ? { en: `${m.en} approved your date. You can now book services.`, ar: `وافق ${m.ar} على موعدك. يمكنك الآن حجز الخدمات.` }
          : next.status === 'rejected'
            ? { en: `${m.en} could not approve your date: ${next.reason}`, ar: `تعذّر على ${m.ar} اعتماد موعدك: ${next.reason}` }
            : { en: `${m.en} suggested another date for your request.`, ar: `اقترح ${m.ar} موعداً آخر لطلبك.` };
      return {
        ...s,
        requests: replace(s.requests, next),
        notifications: req.residentId === s.me.id ? notify(s, 'resident', text, a.at) : s.notifications,
      };
    }

    case 'respondAlternative': {
      const req = find(s.requests, a.id, 'request');
      const next = transition(req, { type: a.accept ? 'acceptAlternative' : 'declineAlternative', at: a.at }, s.requests);
      const text: L10n = a.accept
        ? { en: `${req.residentName} accepted the suggested date.`, ar: `قبل ${req.residentName} الموعد المقترح.` }
        : { en: `${req.residentName} declined the suggested date.`, ar: `رفض ${req.residentName} الموعد المقترح.` };
      return { ...s, requests: replace(s.requests, next), notifications: notify(s, 'staff', text, a.at) };
    }

    case 'cancelRequest': {
      const req = find(s.requests, a.id, 'request');
      return { ...s, requests: replace(s.requests, transition(req, { type: 'cancel', at: a.at })) };
    }

    case 'toggleCart': {
      const svc = find(s.services, a.serviceId, 'service');
      if (s.cart.includes(svc.id)) return { ...s, cart: s.cart.filter((id) => id !== svc.id) };
      // One service per category in a plan: picking a new coffee vendor replaces the old one.
      const others = s.cart.filter((id) => s.services.find((x) => x.id === id)?.category !== svc.category);
      return { ...s, cart: [...others, svc.id] };
    }

    case 'checkout': {
      const req = find(s.requests, a.requestId, 'request');
      if (req.status !== 'approved') throw new InvalidTransition('Services can only be booked after the majlis team approves your date.');
      if (s.cart.length === 0) throw new InvalidTransition('Add at least one service to your plan.');
      const orders: Order[] = s.cart.map((serviceId) => {
        const svc = find(s.services, serviceId, 'service');
        const split = splitCommission(svc.price);
        return {
          id: uid('ord'),
          requestId: req.id,
          serviceId,
          vendorId: svc.vendorId,
          residentName: req.residentName,
          eventDate: req.date,
          majlisId: req.majlisId,
          amount: svc.price,
          fee: split.fee,
          vendorNet: split.vendor,
          status: 'awaiting_vendor',
          createdAt: a.at,
          updatedAt: a.at,
        };
      });
      let notifications = s.notifications;
      for (const o of orders) {
        const svc = find(s.services, o.serviceId, 'service');
        notifications = [
          { id: uid('n'), to: 'vendor' as Role, at: a.at, read: false, text: { en: `New order: ${svc.name.en} for ${o.residentName}.`, ar: `طلب جديد: ${svc.name.ar} لـ ${o.residentName}.` } },
          ...notifications,
        ];
      }
      return { ...s, orders: [...orders, ...s.orders], cart: [], notifications };
    }

    case 'vendorUpdateOrder': {
      const o = find(s.orders, a.id, 'order');
      if (!ORDER_FLOW[o.status].includes(a.status)) throw new InvalidTransition(`Cannot mark a ${o.status.replace('_', ' ')} order as ${a.status}.`);
      const next: Order = { ...o, status: a.status, updatedAt: a.at };
      const svc = s.services.find((x) => x.id === o.serviceId);
      const label = svc?.name ?? same('service');
      const text: L10n =
        a.status === 'confirmed'
          ? { en: `${label.en} confirmed your booking.`, ar: `تم تأكيد حجز ${label.ar}.` }
          : a.status === 'declined'
            ? { en: `${label.en} could not take your booking. Your payment is refunded.`, ar: `تعذّر قبول حجز ${label.ar}. تم رد المبلغ.` }
            : { en: `${label.en} marked your service as completed. Leave a review?`, ar: `اكتملت خدمة ${label.ar}. هل تود كتابة تقييم؟` };
      const isMine = s.requests.some((r) => r.id === o.requestId && r.residentId === s.me.id);
      return { ...s, orders: replace(s.orders, next), notifications: isMine ? notify(s, 'resident', text, a.at) : s.notifications };
    }

    case 'postAnnouncement': {
      const ann: Announcement = { id: uid('ann'), majlisId: a.majlisId, title: same(a.title), body: same(a.body), createdAt: a.at };
      const m = majlisName(s, a.majlisId);
      return {
        ...s,
        announcements: [ann, ...s.announcements],
        notifications: notify(s, 'resident', { en: `${m.en} posted: ${a.title}`, ar: `${m.ar} نشر: ${a.title}` }, a.at),
      };
    }

    case 'postEvent': {
      const ev: CommunityEvent = { ...a.event, id: uid('evt'), going: 0 };
      const m = majlisName(s, ev.majlisId);
      return {
        ...s,
        events: [...s.events, ev],
        notifications: notify(s, 'resident', { en: `New event at ${m.en}: ${ev.title.en}`, ar: `فعالية جديدة في ${m.ar}: ${ev.title.ar}` }, a.at),
      };
    }

    case 'reportIssue': {
      const issue: Issue = { id: uid('iss'), majlisId: a.majlisId, category: a.category, text: a.text.trim(), createdAt: a.at, status: 'received' };
      if (!issue.text) throw new InvalidTransition('Describe the issue before sending.');
      return {
        ...s,
        issues: [issue, ...s.issues],
        notifications: notify(s, 'staff', { en: `New community report: ${issue.text.slice(0, 60)}`, ar: `بلاغ مجتمعي جديد: ${issue.text.slice(0, 60)}` }, a.at),
      };
    }

    case 'updateIssue':
      return { ...s, issues: s.issues.map((i) => (i.id === a.id ? { ...i, status: a.status } : i)) };

    case 'addReview': {
      const review: Review = { id: uid('rv'), vendorId: a.vendorId, author: s.me.name.split(' ')[0] + ' ' + (s.me.name.split(' ').at(-1)?.[0] ?? '') + '.', rating: a.rating, text: a.text.trim(), at: a.at };
      return { ...s, reviews: [review, ...s.reviews] };
    }

    case 'markRead':
      return { ...s, notifications: s.notifications.map((n) => (n.to === a.role ? { ...n, read: true } : n)) };

    case 'reset':
      return createInitialState(a.today, a.at);

    case 'replace':
      return a.state;
  }
}

function find<T extends { id: string }>(list: T[], id: string, what: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new InvalidTransition(`Unknown ${what}.`);
  return item;
}

function replace<T extends { id: string }>(list: T[], next: T): T[] {
  return list.map((x) => (x.id === next.id ? next : x));
}

/* ---------- selectors ---------- */

export function myActiveRequest(s: State): DateRequest | undefined {
  return s.requests
    .filter((r) => r.residentId === s.me.id && r.status !== 'cancelled')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}

export function unread(s: State, role: Role): number {
  return s.notifications.filter((n) => n.to === role && !n.read).length;
}
