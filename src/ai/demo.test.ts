import { describe, expect, it } from 'vitest';
import { presetIdeas, reviewInsight, scriptedAnswer, type AssistantContext } from './demo';
import { MAJLISES, SERVICES, VENDORS, seedEvents, seedReviews } from '../domain/seed';

const today = '2026-11-24';
const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  lang: 'en',
  today,
  majlises: MAJLISES,
  events: seedEvents(today),
  vendors: VENDORS,
  services: SERVICES,
  ...over,
});

describe('scriptedAnswer', () => {
  it('lists majlises that fit a guest count', () => {
    const a = scriptedAnswer('Which majlis fits 350 guests?', ctx());
    expect(a).toContain('Majlis Al Ghaf');
    expect(a).not.toContain('Majlis Al Sidr');
  });

  it('understands Arabic-Indic digits and replies in Arabic', () => {
    const a = scriptedAnswer('أي مجلس يتسع لـ٣٥٠ ضيفاً؟', ctx());
    expect(a).toContain('مجلس الغاف');
  });

  it('answers a category price question with the registered vendors', () => {
    const a = scriptedAnswer('How much is Al Ayyala?', ctx());
    expect(a).toContain('Al Nakhwa Ayyala Group');
    expect(a).toContain('AED 1,000');
  });

  it('describes a named majlis', () => {
    expect(scriptedAnswer('Tell me about Majlis Al Sidr', ctx())).toContain('Al Shamkha');
  });

  it('explains refunds when a vendor cancels', () => {
    expect(scriptedAnswer('What if a vendor cancels?', ctx())).toMatch(/refunded in full/);
  });

  it('finds events by topic', () => {
    expect(scriptedAnswer('Any poetry events?', ctx())).toContain('Nabati poetry night');
  });

  it('reports the resident request status', () => {
    const a = scriptedAnswer('What is my request status?', ctx({
      myRequest: { id: 'r', residentId: 'me', residentName: 'H', majlisId: 'ghaf', date: '2026-12-17', guests: 200, occasion: 'wedding', status: 'pending', createdAt: 0, history: [] },
    }));
    expect(a).toContain('Waiting for the majlis team');
  });

  it('offers example questions when it does not understand', () => {
    expect(scriptedAnswer('qwerty', ctx())).toContain('Try:');
  });
});

describe('reviewInsight', () => {
  it('pulls praise and concerns from the review text', () => {
    const reviews = seedReviews(0).filter((r) => r.vendorId === 'dallah');
    const out = reviewInsight(reviews, 'en');
    expect(out.praise).toContain('Excellent coffee');
    expect(out.concerns).toContain('Ran short on supplies');
    expect(out.score).toBeGreaterThan(80);
  });
});

describe('presetIdeas', () => {
  it('picks the garden concept for a garden mood', () => {
    expect(presetIdeas('Garden evening', 'en').title).toBe('Evening Under the Sidr');
  });
  it('always returns four valid colours', () => {
    for (const mood of ['Heritage & Sadu', 'Modern minimal', 'Garden evening']) {
      const p = presetIdeas(mood, 'ar').palette;
      expect(p).toHaveLength(4);
      p.forEach((c) => expect(c.hex).toMatch(/^#[0-9A-F]{6}$/i));
    }
  });
});
