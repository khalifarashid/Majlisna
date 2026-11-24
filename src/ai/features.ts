import { hasAiKey } from './key';
import { scoreEvents } from '../domain/recommend';
import type { CommunityEvent, Interest, ISODate, Lang, Majlis, Review, Vendor } from '../domain/types';
import { INTEREST } from '../i18n/labels';
import { presetIdeas, reviewInsight, scriptedAnswer, type AssistantContext, type Ideas, type ReviewInsight } from './demo';

export type { AssistantContext, Ideas, ReviewInsight };

/**
 * Public AI features. Each runs on Claude when the viewer has added a key and AI is on;
 * otherwise (or on any error) it uses the built-in demo AI from demo.ts.
 */

export interface AiResult<T> {
  data: T;
  source: 'claude' | 'fallback';
  error?: string;
}

const claude = () => import('./claude');
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function errorCode(e: unknown): string {
  return e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : 'unknown';
}

async function withFallback<T>(useAi: boolean, ai: () => Promise<T>, fallback: () => T, demoMs = 650): Promise<AiResult<T>> {
  if (!useAi || !hasAiKey()) {
    // A short pause so the demo shows its "thinking" state the way the real AI would.
    await pause(demoMs);
    return { data: fallback(), source: 'fallback' };
  }
  try {
    return { data: await ai(), source: 'claude' };
  } catch (e) {
    return { data: fallback(), source: 'fallback', error: errorCode(e) };
  }
}

/* ---------- 1. Personalised event picks (SLR themes 1-2) ---------- */

export interface Pick {
  eventId: string;
  reason: string;
}

export async function recommendEvents(opts: {
  events: CommunityEvent[];
  majlises: Majlis[];
  interests: Interest[];
  rsvps: string[];
  today: ISODate;
  lang: Lang;
  useAi: boolean;
  personalise: boolean;
}): Promise<AiResult<Pick[]>> {
  const upcoming = opts.events.filter((e) => e.date >= opts.today);
  // With personalisation off, interests are never used and never sent anywhere.
  const interests = opts.personalise ? opts.interests : [];
  const fallback = (): Pick[] =>
    scoreEvents(upcoming, interests, opts.today, 3).map((s) => {
      const label = s.matched ? INTEREST[s.matched][opts.lang] : null;
      return {
        eventId: s.eventId,
        reason: label
          ? opts.lang === 'ar'
            ? `لأنك تهتم بـ${label}`
            : `Because you follow ${label.toLowerCase()}`
          : opts.lang === 'ar'
            ? 'قريب وفيه مقاعد متاحة'
            : 'Coming up soon with seats left',
      };
    });
  if (upcoming.length === 0) return { data: [], source: 'fallback' };
  return withFallback(
    opts.useAi,
    async () => (await claude()).picksWithClaude({ upcoming, majlises: opts.majlises, interests, rsvps: opts.rsvps, today: opts.today, lang: opts.lang }),
    fallback,
    450,
  );
}

/* ---------- 2. Ask Majlisna assistant (SLR theme 1, NLP) ---------- */

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Reveal a prepared answer word by word, like a streamed reply. */
async function typeOut(text: string, onText: (t: string) => void, signal?: AbortSignal) {
  await pause(420);
  const parts = text.split(/(\s+)/);
  let shown = '';
  for (const p of parts) {
    if (signal?.aborted) break;
    shown += p;
    onText(shown);
    if (p.trim()) await pause(22);
  }
  if (!signal?.aborted) onText(text);
}

export async function askAssistant(ctx: AssistantContext, history: ChatTurn[], onText: (t: string) => void, useAi: boolean, signal?: AbortSignal): Promise<AiResult<string>> {
  const fallback = () => scriptedAnswer(history.at(-1)?.text ?? '', ctx);
  if (!useAi || !hasAiKey()) {
    const text = fallback();
    await typeOut(text, onText, signal);
    return { data: text, source: 'fallback' };
  }
  try {
    const text = await (await claude()).chatWithClaude(ctx, history, onText, signal);
    return { data: text, source: 'claude' };
  } catch (e) {
    const text = fallback();
    onText(text);
    return { data: text, source: 'fallback', error: errorCode(e) };
  }
}

/* ---------- 3. Event & decor ideas (SLR themes 1-2, generative AI) ---------- */

export async function generateIdeas(opts: { occasion: string; guests: number; majlis?: Majlis; vibe: string; lang: Lang; useAi: boolean }): Promise<AiResult<Ideas>> {
  return withFallback(opts.useAi, async () => (await claude()).ideasWithClaude(opts), () => presetIdeas(opts.vibe, opts.lang), 900);
}

/* ---------- 4. Review sentiment for vendors (SLR theme 1, feedback analysis) ---------- */

export async function summarizeReviews(opts: { vendor: Vendor; reviews: Review[]; lang: Lang; useAi: boolean }): Promise<AiResult<ReviewInsight>> {
  if (opts.reviews.length === 0) return { data: reviewInsight([], opts.lang), source: 'fallback' };
  return withFallback(opts.useAi, async () => (await claude()).reviewsWithClaude(opts), () => reviewInsight(opts.reviews, opts.lang), 800);
}
