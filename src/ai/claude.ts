import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { askJson, streamChat } from './client';
import type { CommunityEvent, Interest, ISODate, Lang, Majlis, Review, Vendor } from '../domain/types';
import { CATEGORY, REQUEST_STATUS } from '../i18n/labels';
import type { AssistantContext, ChatTurn, Ideas, Pick, ReviewInsight } from './features';

/** Claude-backed implementations. Loaded on demand so visitors without a key never download the SDK. */

const langName = (lang: Lang) => (lang === 'ar' ? 'Arabic (Gulf-friendly Modern Standard Arabic)' : 'English');

export async function picksWithClaude(opts: {
  upcoming: CommunityEvent[];
  majlises: Majlis[];
  interests: Interest[];
  rsvps: string[];
  today: ISODate;
  lang: Lang;
}): Promise<Pick[]> {
  const ids = opts.upcoming.map((e) => e.id) as [string, ...string[]];
  const schema = z.object({
    picks: z.array(z.object({ eventId: z.enum(ids), reason: z.string() })).describe('Exactly three different events, best first.'),
  });
  const catalogue = opts.upcoming.map((e) => ({
    id: e.id,
    title: e.title.en,
    majlis: opts.majlises.find((m) => m.id === e.majlisId)?.name.en,
    date: e.date,
    tags: e.tags,
    seatsLeft: Math.max(0, e.capacity - e.going),
    alreadyGoing: opts.rsvps.includes(e.id),
  }));
  const out = await askJson(
    schema,
    `You recommend community events at UAE neighbourhood majlises for the Majlisna app.
Pick the three events this resident is most likely to enjoy. Prefer events that match their interests, are soon, and still have seats. Skip events they are already going to unless nothing else fits.
Write each reason in ${langName(opts.lang)}: one short, warm sentence (max 12 words) that names the specific link to the resident. Never invent facts that are not in the catalogue.`,
    JSON.stringify({ today: opts.today, residentInterests: opts.interests, catalogue }),
    'low',
  );
  const seen = new Set<string>();
  return out.picks.filter((p) => !seen.has(p.eventId) && seen.add(p.eventId)).slice(0, 3);
}

function assistantSystem(ctx: AssistantContext): string {
  const data = {
    today: ctx.today,
    majlises: ctx.majlises.map((m) => ({ name: m.name.en, nameAr: m.name.ar, area: m.area.en, capacity: m.capacity, hours: m.hours.en })),
    upcomingEvents: ctx.events
      .filter((e) => e.date >= ctx.today)
      .map((e) => ({ title: e.title.en, titleAr: e.title.ar, date: e.date, time: e.time, majlis: ctx.majlises.find((m) => m.id === e.majlisId)?.name.en, seatsLeft: e.capacity - e.going })),
    services: ctx.services.map((s) => ({
      service: s.name.en,
      vendor: ctx.vendors.find((v) => v.id === s.vendorId)?.name.en,
      category: CATEGORY[s.category].en,
      priceAED: s.price,
      unit: s.unit.en,
      verified: ctx.vendors.find((v) => v.id === s.vendorId)?.verified,
    })),
    residentRequest: ctx.myRequest
      ? {
          majlis: ctx.majlises.find((m) => m.id === ctx.myRequest!.majlisId)?.name.en,
          date: ctx.myRequest.date,
          status: REQUEST_STATUS[ctx.myRequest.status].en,
          suggestedDate: ctx.myRequest.alternativeDate,
        }
      : null,
  };
  return `You are "Ask Majlisna", the assistant inside Majlisna, a prototype app for UAE government majlises.
How the app works:
- Residents request a majlis date for free. The government majlis team reviews it and approves, rejects, or suggests another date. Only the majlis team decides; you cannot approve, hold or promise dates.
- After approval, residents book registered vendors (coffee and hospitality, Al Ayyala, photo and film, catering) and pay in the app. Majlisna keeps 8% of each completed paid service; the vendor receives 92%.
- This is a student prototype with sample data. It is not an official government service.

Answer in ${langName(ctx.lang)} unless the resident writes in the other language, then match them.
Be brief: 2-4 short sentences or a short list, plain text without markdown headings. Use only the data below; if something is not there, say you do not have it and point to the right screen (Majlises, My plan, Profile). Prices are in AED.

DATA:
${JSON.stringify(data)}`;
}

export async function chatWithClaude(ctx: AssistantContext, history: ChatTurn[], onText: (t: string) => void, signal?: AbortSignal): Promise<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((h) => ({ role: h.role, content: h.text }));
  return streamChat(assistantSystem(ctx), messages, onText, signal);
}

const IdeasSchema = z.object({
  title: z.string().describe('Evocative name for the concept, max 5 words.'),
  summary: z.string().describe('Two sentences describing the atmosphere.'),
  palette: z.array(z.object({ name: z.string(), hex: z.string().describe('#RRGGBB') })).describe('Exactly 4 colours.'),
  setup: z.array(z.string()).describe('4-5 concrete setup ideas for the majlis space.'),
  timeline: z.array(z.object({ time: z.string().describe('HH:MM, 24h'), item: z.string() })).describe('4-6 evening run-of-show steps.'),
  services: z.array(z.enum(['coffee', 'ayyala', 'media', 'catering'])).describe('Which Majlisna service categories this concept needs.'),
});

export async function ideasWithClaude(opts: { occasion: string; guests: number; majlis?: Majlis; vibe: string; lang: Lang }): Promise<Ideas> {
  const out = await askJson(
    IdeasSchema,
    `You are an Emirati event designer helping a family plan a celebration at a community majlis. Respect local customs: separate family hall when relevant, Arabic coffee service, modest and elegant styling, no alcohol. Ground ideas in UAE heritage (Al Sadu weaving, palm fronds, brass dallah, oud, lanterns) blended with the requested mood. Write all text in ${langName(opts.lang)}. Hex colours must be valid #RRGGBB.`,
    JSON.stringify({
      occasion: opts.occasion,
      guests: opts.guests,
      majlis: opts.majlis ? { name: opts.majlis.name.en, capacity: opts.majlis.capacity, amenities: opts.majlis.amenities } : null,
      mood: opts.vibe,
    }),
    'medium',
  );
  return { ...out, palette: out.palette.filter((p) => /^#[0-9a-f]{6}$/i.test(p.hex)).slice(0, 4) };
}

const InsightSchema = z.object({
  sentiment: z.enum(['positive', 'mixed', 'negative']),
  score: z.number().describe('0-100 overall satisfaction'),
  praise: z.array(z.string()).describe('Up to 3 short themes customers praise.'),
  concerns: z.array(z.string()).describe('Up to 3 short themes customers complain about. Empty if none.'),
  suggestion: z.string().describe('One practical improvement for the vendor.'),
});

export async function reviewsWithClaude(opts: { vendor: Vendor; reviews: Review[]; lang: Lang }): Promise<ReviewInsight> {
  const out = await askJson(
    InsightSchema,
    `You analyse customer reviews (English and Arabic) for a wedding-services vendor on Majlisna. Summarise faithfully, never invent complaints or praise. Write every text field in ${langName(opts.lang)}. Keep each theme under 8 words.`,
    JSON.stringify({ vendor: opts.vendor.name.en, reviews: opts.reviews.map((r) => ({ rating: r.rating, text: r.text })) }),
    'low',
  );
  return { ...out, score: Math.max(0, Math.min(100, Math.round(out.score))) };
}
