import { describe, expect, it } from 'vitest';
import { createInitialState, reducer } from './reducer';

const NOW = Date.UTC(2026, 10, 24, 12);
const s0 = () => createInitialState('2026-11-24', NOW);

describe('reducer', () => {
  it('runs the whole loop: request -> approve -> book -> vendor completes', () => {
    let s = s0();
    s = reducer(s, { type: 'submitRequest', majlisId: 'yasmeen', date: '2026-12-31', guests: 120, occasion: 'wedding', at: NOW });
    const mine = s.requests.find((r) => r.residentId === s.me.id)!;
    expect(mine.status).toBe('pending');
    expect(s.notifications.some((n) => n.to === 'staff' && !n.read)).toBe(true);

    s = reducer(s, { type: 'decideRequest', id: mine.id, decision: { kind: 'approve' }, at: NOW + 1 });
    expect(s.requests.find((r) => r.id === mine.id)!.status).toBe('approved');

    s = reducer(s, { type: 'toggleCart', serviceId: 'svc-dallah' });
    s = reducer(s, { type: 'toggleCart', serviceId: 'svc-nakhwa' });
    s = reducer(s, { type: 'checkout', requestId: mine.id, at: NOW + 2 });
    const myOrders = s.orders.filter((o) => o.requestId === mine.id);
    expect(myOrders).toHaveLength(2);
    expect(s.cart).toEqual([]);
    expect(myOrders.find((o) => o.serviceId === 'svc-dallah')).toMatchObject({ amount: 2100, fee: 168, vendorNet: 1932, status: 'awaiting_vendor' });

    const order = myOrders[0];
    s = reducer(s, { type: 'vendorUpdateOrder', id: order.id, status: 'confirmed', at: NOW + 3 });
    s = reducer(s, { type: 'vendorUpdateOrder', id: order.id, status: 'completed', at: NOW + 4 });
    expect(s.orders.find((o) => o.id === order.id)!.status).toBe('completed');
  });

  it('refuses to check out before the majlis team approves the date', () => {
    let s = s0();
    s = reducer(s, { type: 'submitRequest', majlisId: 'yasmeen', date: '2026-12-31', guests: 120, occasion: 'wedding', at: NOW });
    const id = s.requests.find((r) => r.residentId === s.me.id)!.id;
    s = reducer(s, { type: 'toggleCart', serviceId: 'svc-dallah' });
    expect(() => reducer(s, { type: 'checkout', requestId: id, at: NOW })).toThrow();
  });

  it('refuses a second request for a date that is already approved', () => {
    const s = s0();
    const taken = s.requests.find((r) => r.status === 'approved')!;
    expect(() =>
      reducer(s, { type: 'submitRequest', majlisId: taken.majlisId, date: taken.date, guests: 100, occasion: 'wedding', at: NOW }),
    ).toThrow();
  });

  it('only lets a vendor move orders forward', () => {
    let s = s0();
    const done = s.orders.find((o) => o.status === 'completed')!;
    expect(() => reducer(s, { type: 'vendorUpdateOrder', id: done.id, status: 'confirmed', at: NOW })).toThrow();
    const waiting = s.orders.find((o) => o.status === 'awaiting_vendor')!;
    s = reducer(s, { type: 'vendorUpdateOrder', id: waiting.id, status: 'declined', at: NOW });
    expect(s.orders.find((o) => o.id === waiting.id)!.status).toBe('declined');
  });

  it('resets to fresh sample data', () => {
    let s = s0();
    s = reducer(s, { type: 'setRole', role: 'staff' });
    s = reducer(s, { type: 'reset', today: '2026-11-24', at: NOW });
    expect(s.role).toBe('resident');
  });
});
