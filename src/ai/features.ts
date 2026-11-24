import { hasAiKey } from './key';
import { scoreEvents } from '../domain/recommend';
import type { CommunityEvent, DateRequest, Interest, ISODate, Lang, Majlis, Review, Service, ServiceCategory, Vendor } from '../domain/types';
import { CATEGORY, INTEREST, REQUEST_STATUS } from '../i18n/labels';
import { formatAED } from '../domain/money';

/**
 * Public AI features. Each one runs on Claude when the viewer has added a key and AI is on,
 * and otherwise (or on any error) falls back to a deterministic answer, labelled as such.
 */

export interface AiResult<T> {
  data: T;
  source: 'claude' | 'fallback';
  error?: string;
}

const claude = () => import('./claude');

function errorCode(e: unknown): string {
  return e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : 'unknown';
}

async function withFallback<T>(useAi: boolean, ai: () => Promise<T>, fallback: () => T): Promise<AiResult<T>> {
  if (!useAi || !hasAiKey()) return { data: fallback(), source: 'fallback' };
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
  );
}

/* ---------- 2. Ask Majlisna assistant (SLR theme 1, NLP) ---------- */

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantContext {
  lang: Lang;
  today: ISODate;
  majlises: Majlis[];
  events: CommunityEvent[];
  vendors: Vendor[];
  services: Service[];
  myRequest?: DateRequest;
}

export async function askAssistant(ctx: AssistantContext, history: ChatTurn[], onText: (t: string) => void, useAi: boolean, signal?: AbortSignal): Promise<AiResult<string>> {
  const fallback = () => scriptedAnswer(history.at(-1)?.text ?? '', ctx);
  if (!useAi || !hasAiKey()) {
    const text = fallback();
    onText(text);
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

/** Keyword answers used when AI is off. Covers the questions people ask in a demo. */
export function scriptedAnswer(q: string, ctx: AssistantContext): string {
  const s = q.toLowerCase();
  const ar = ctx.lang === 'ar';
  const has = (...words: string[]) => words.some((w) => s.includes(w));
  const upcoming = ctx.events.filter((e) => e.date >= ctx.today).sort((a, b) => a.date.localeCompare(b.date));
  const guestsAsked = Number(s.match(/\d{2,4}/)?.[0] ?? s.match(/[٠-٩]{2,4}/)?.[0]?.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))) ?? NaN);

  if (has('price', 'cost', 'how much', 'aed', 'سعر', 'أسعار', 'كم', 'تكلفة')) {
    const lines = (['coffee', 'ayyala', 'media', 'catering'] as ServiceCategory[]).map((c) => {
      const cheapest = ctx.services.filter((x) => x.category === c).sort((a, b) => a.price - b.price)[0];
      return `• ${CATEGORY[c][ctx.lang]}: ${ar ? 'من' : 'from'} ${formatAED(cheapest.price, ctx.lang)}`;
    });
    return (ar ? 'أسعار الخدمات المسجلة:\n' : 'Registered service prices:\n') + lines.join('\n') + (ar ? '\nطلب موعد المجلس مجاني.' : '\nRequesting a majlis date is free.');
  }
  if (!Number.isNaN(guestsAsked) && has('guest', 'fit', 'ضيف', 'يتسع')) {
    const fits = ctx.majlises.filter((m) => m.capacity >= guestsAsked).sort((a, b) => a.capacity - b.capacity);
    if (fits.length === 0) return ar ? `لا يوجد مجلس يتسع لـ${guestsAsked} ضيف في البيانات الحالية. أكبرها يتسع لـ${Math.max(...ctx.majlises.map((m) => m.capacity))}.` : `No majlis in the current data fits ${guestsAsked} guests. The largest holds ${Math.max(...ctx.majlises.map((m) => m.capacity))}.`;
    return (ar ? `المجالس التي تتسع لـ${guestsAsked} ضيف:\n` : `Majlises that fit ${guestsAsked} guests:\n`) + fits.map((m) => `• ${m.name[ctx.lang]} (${m.area[ctx.lang]}) · ${m.capacity}`).join('\n');
  }
  if (has('book', 'request', 'date', 'wedding', 'حجز', 'موعد', 'عرس', 'زواج')) {
    if (ctx.myRequest) {
      const m = ctx.majlises.find((x) => x.id === ctx.myRequest!.majlisId)!;
      return ar
        ? `طلبك في ${m.name.ar} بتاريخ ${ctx.myRequest.date}: ${REQUEST_STATUS[ctx.myRequest.status].ar}. يقرر فريق المجلس فقط، وستصلك رسالة عند الرد.`
        : `Your request at ${m.name.en} for ${ctx.myRequest.date} is: ${REQUEST_STATUS[ctx.myRequest.status].en}. Only the majlis team decides, and you'll get a notification when they reply.`;
    }
    return ar
      ? 'افتح تبويب "خطتي"، واختر المجلس والتاريخ وعدد الضيوف ثم أرسل الطلب. الطلب مجاني، ويراجعه فريق المجلس الحكومي فيعتمده أو يرفضه أو يقترح موعداً آخر.'
      : 'Open the My plan tab, choose a majlis, a date and your guest count, then send the request. It is free. The government majlis team will approve it, reject it, or suggest another date.';
  }
  if (has('event', 'week', 'tonight', 'on this', 'فعالي', 'أسبوع', 'نشاط')) {
    const top = upcoming.slice(0, 3).map((e) => `• ${e.title[ctx.lang]} · ${e.date} ${e.time}`);
    return (ar ? 'أقرب الفعاليات:\n' : 'Coming up next:\n') + top.join('\n');
  }
  if (has('coffee', 'gahwa', 'قهوة', 'ضيافة')) return ar ? 'لدينا موردان للقهوة والضيافة. ضيافة الدلة والفنجان بـ2,100 د.إ للمناسبة وتشمل ٤ من طاقم الضيافة.' : 'Two coffee vendors are registered. Dallah & Finjan Hospitality costs AED 2,100 per event and includes 4 hospitality staff.';
  if (has('ayyala', 'dance', 'عيالة', 'رقص')) return ar ? 'فرقة النخوة للعيالة تقدم عرضاً لمدة ٤٥ دقيقة بـ1,000 د.إ، وهي فرقة موثقة.' : 'Al Nakhwa Ayyala Group performs a 45-minute set for AED 1,000 and is a verified vendor.';
  if (has('fee', 'commission', '8%', 'عمولة', 'رسوم')) return ar ? 'يحتفظ مجلسنا بـ8% من كل خدمة مدفوعة مكتملة، ويحصل المورد على 92%. طلب موعد المجلس مجاني.' : 'Majlisna keeps 8% of each completed paid service and the vendor receives 92%. Requesting a majlis date is free.';
  if (has('majlis', 'biggest', 'capacity', 'مجلس', 'سعة', 'أكبر')) {
    const big = [...ctx.majlises].sort((a, b) => b.capacity - a.capacity)[0];
    return ar ? `أكبر مجلس هو ${big.name.ar} في ${big.area.ar} ويتسع لـ${big.capacity} ضيف.` : `The largest is ${big.name.en} in ${big.area.en}, with room for ${big.capacity} guests.`;
  }
  return ar
    ? 'يمكنني المساعدة في طلب موعد المجلس، وأسعار الخدمات، والفعاليات القادمة. (هذه ردود مبرمجة مسبقاً؛ أضف مفتاح Claude في الإعدادات لردود الذكاء الاصطناعي.)'
    : 'I can help with majlis date requests, service prices and upcoming events. (These are scripted replies; add a Claude key in Settings for real AI answers.)';
}

/* ---------- 3. Event & decor ideas (SLR themes 1-2, generative AI) ---------- */

export interface Ideas {
  title: string;
  summary: string;
  palette: { name: string; hex: string }[];
  setup: string[];
  timeline: { time: string; item: string }[];
  services: ServiceCategory[];
}

export async function generateIdeas(opts: { occasion: string; guests: number; majlis?: Majlis; vibe: string; lang: Lang; useAi: boolean }): Promise<AiResult<Ideas>> {
  return withFallback(opts.useAi, async () => (await claude()).ideasWithClaude(opts), () => presetIdeas(opts.vibe, opts.lang));
}

function presetIdeas(vibe: string, lang: Lang): Ideas {
  const ar = lang === 'ar';
  const v = vibe.toLowerCase();
  if (v.includes('modern') || v.includes('عصري') || v.includes('intimate') || v.includes('عائلي')) {
    return {
      title: ar ? 'ليلة الغاف العصرية' : 'Modern Ghaf Night',
      summary: ar ? 'خطوط نظيفة وإضاءة دافئة منخفضة مع لمسات سدو بسيطة. أجواء هادئة تناسب العائلات.' : 'Clean lines, low warm lighting and a few bold Sadu accents. Calm and family-friendly.',
      palette: [
        { name: ar ? 'أخضر الغاف' : 'Ghaf green', hex: '#2F5D4A' },
        { name: ar ? 'رمل' : 'Sand', hex: '#E7DCC8' },
        { name: ar ? 'نحاس' : 'Brass', hex: '#B8893A' },
        { name: ar ? 'أبيض جص' : 'Gypsum white', hex: '#F7F5EF' },
      ],
      setup: ar
        ? ['ممر دخول بفوانيس نحاسية منخفضة', 'خلفية سدو خلف الجلسة الرئيسية', 'جلسات أرضية بوسائد بلون الرمل', 'ركن قهوة بدلال نحاسية مصقولة']
        : ['Entrance path lined with low brass lanterns', 'Sadu-woven backdrop behind the main seating', 'Floor seating with sand-toned cushions', 'Coffee corner with polished brass dallahs'],
      timeline: [
        { time: '19:30', item: ar ? 'استقبال الضيوف بالقهوة والتمر' : 'Guests arrive, coffee and dates' },
        { time: '20:30', item: ar ? 'عرض العيالة' : 'Al Ayyala performance' },
        { time: '21:30', item: ar ? 'العشاء' : 'Dinner is served' },
        { time: '23:00', item: ar ? 'التصوير العائلي' : 'Family photographs' },
      ],
      services: ['coffee', 'ayyala', 'catering', 'media'],
    };
  }
  return {
    title: ar ? 'أمسية الدلة والسدو' : 'Dallah & Sadu Evening',
    summary: ar ? 'أمسية تراثية دافئة بألوان السدو الحمراء والذهبية، والقهوة والعيالة في قلب الحفل.' : 'A warm heritage evening in Sadu reds and golds, with coffee and Al Ayyala at its heart.',
    palette: [
      { name: ar ? 'أحمر السدو' : 'Sadu red', hex: '#9A2E24' },
      { name: ar ? 'ذهبي الدلة' : 'Dallah gold', hex: '#B8893A' },
      { name: ar ? 'أخضر المجلس' : 'Majlis green', hex: '#1B4232' },
      { name: ar ? 'كريمي' : 'Cream', hex: '#F3EBDD' },
    ],
    setup: ar
      ? ['سجاد سدو على امتداد الجلسات', 'سعف نخيل حول المدخل', 'مباخر عود في الزوايا', 'ركن تصوير بخلفية خيمة تراثية', 'إضاءة فوانيس معلقة']
      : ['Sadu rugs along the seating', 'Palm fronds framing the entrance', 'Oud burners in the corners', 'Photo corner with a heritage tent backdrop', 'Hanging lantern lighting'],
    timeline: [
      { time: '19:00', item: ar ? 'الاستقبال والقهوة العربية' : 'Welcome and Arabic coffee' },
      { time: '20:00', item: ar ? 'دخول المعرس مع العيالة' : 'Groom’s entrance with Al Ayyala' },
      { time: '21:00', item: ar ? 'العشاء: مجبوس وهريس' : 'Dinner: machboos and harees' },
      { time: '22:30', item: ar ? 'التصوير وتوديع الضيوف' : 'Photographs and farewells' },
    ],
    services: ['coffee', 'ayyala', 'catering', 'media'],
  };
}

/* ---------- 4. Review sentiment for vendors (SLR theme 1, feedback analysis) ---------- */

export interface ReviewInsight {
  sentiment: 'positive' | 'mixed' | 'negative';
  score: number;
  praise: string[];
  concerns: string[];
  suggestion: string;
}

export async function summarizeReviews(opts: { vendor: Vendor; reviews: Review[]; lang: Lang; useAi: boolean }): Promise<AiResult<ReviewInsight>> {
  const ar = opts.lang === 'ar';
  const fallback = (): ReviewInsight => {
    const avg = opts.reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, opts.reviews.length);
    const low = opts.reviews.filter((r) => r.rating <= 4);
    return {
      sentiment: avg >= 4.5 ? 'positive' : avg >= 3.5 ? 'mixed' : 'negative',
      score: Math.round((avg / 5) * 100),
      praise: [ar ? 'جودة الخدمة' : 'Service quality', ar ? 'الالتزام بالوقت' : 'Punctuality'],
      concerns: low.map((r) => (r.text.length > 70 ? `${r.text.slice(0, 68)}…` : r.text)).slice(0, 2),
      suggestion: ar ? 'تابع التقييمات الأقل من ٥ نجوم وتواصل مع العميل خلال يومين.' : 'Follow up on any review under 5 stars within two days.',
    };
  };
  if (opts.reviews.length === 0) return { data: { sentiment: 'mixed', score: 0, praise: [], concerns: [], suggestion: '' }, source: 'fallback' };
  return withFallback(opts.useAi, async () => (await claude()).reviewsWithClaude(opts), fallback);
}
