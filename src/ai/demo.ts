import type { CommunityEvent, DateRequest, Interest, ISODate, Lang, Majlis, Review, Service, ServiceCategory, Vendor } from '../domain/types';
import { AMENITY, CATEGORY, REQUEST_STATUS } from '../i18n/labels';
import { formatAED } from '../domain/money';
import { weekday } from '../domain/dates';

/**
 * Built-in demo AI: rules and prepared answers that need no API key.
 * Every answer is computed from the live app data, so it stays correct as the demo changes.
 */

export interface AssistantContext {
  lang: Lang;
  today: ISODate;
  majlises: Majlis[];
  events: CommunityEvent[];
  vendors: Vendor[];
  services: Service[];
  myRequest?: DateRequest;
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const normalise = (s: string) => s.toLowerCase().replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[أإآ]/g, 'ا');

const MAJLIS_KEYS: Record<string, string[]> = {
  ghaf: ['ghaf', 'غاف'],
  sidr: ['sidr', 'سدر'],
  nakheel: ['nakheel', 'nakhil', 'نخيل'],
  yasmeen: ['yasmeen', 'yasmin', 'jasmine', 'ياسمين'],
};

const CATEGORY_KEYS: Record<ServiceCategory, string[]> = {
  coffee: ['coffee', 'gahwa', 'qahwa', 'dallah', 'hospitality', 'قهوة', 'قهوه', 'ضيافة', 'دلة'],
  ayyala: ['ayyala', 'ayala', 'dance', 'drum', 'razfa', 'band', 'عيالة', 'عياله', 'رزفة', 'فرقة', 'رقص'],
  media: ['photo', 'camera', 'film', 'video', 'cinema', 'تصوير', 'مصور', 'فيديو', 'صور'],
  catering: ['cater', 'food', 'dinner', 'mandi', 'machboos', 'harees', 'buffet', 'اكل', 'عشاء', 'ولائم', 'وليمة', 'مندي', 'مجبوس', 'طعام'],
};

const TOPIC_KEYS: { tag: Interest; keys: string[] }[] = [
  { tag: 'poetry', keys: ['poetry', 'poem', 'nabati', 'شعر', 'قصيد'] },
  { tag: 'heritage', keys: ['heritage', 'culture', 'sadu', 'falcon', 'تراث', 'سدو', 'صقار'] },
  { tag: 'family', keys: ['family', 'kids', 'children', 'عائل', 'اطفال', 'اسرة'] },
  { tag: 'sports', keys: ['sport', 'football', 'soccer', 'رياض', 'كرة'] },
  { tag: 'health', keys: ['health', 'walk', 'صحة', 'مشي'] },
  { tag: 'business', keys: ['business', 'career', 'job', 'مشروع', 'مشاريع', 'وظائف'] },
  { tag: 'volunteering', keys: ['volunteer', 'clean', 'تطوع', 'تنظيف'] },
  { tag: 'youth', keys: ['youth', 'young', 'شباب'] },
  { tag: 'food', keys: ['cook', 'recipe', 'طبخ'] },
];

export function scriptedAnswer(question: string, ctx: AssistantContext): string {
  const q = normalise(question);
  // Answer in the language the question was asked in.
  const ar = /[؀-ۿ]/.test(question) || (ctx.lang === 'ar' && !/[a-z]/i.test(question));
  const L = (v: { en: string; ar: string }) => (ar ? v.ar : v.en);
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const money = (n: number) => formatAED(n, ar ? 'ar' : 'en');
  const upcoming = ctx.events.filter((e) => e.date >= ctx.today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const majlisName = (id: string) => L(ctx.majlises.find((m) => m.id === id)!.name);
  const eventLine = (e: CommunityEvent) => `• ${L(e.title)} · ${majlisName(e.majlisId)} · ${e.date} ${e.time}`;
  const number = Number(q.match(/\d{2,4}/)?.[0] ?? NaN);

  // Greetings and thanks
  if (q.trim().length < 30 && (/^(hi|hello|hey|salam|assalam|marhaba|good (morning|evening))\b/.test(q.trim()) || has('السلام', 'مرحبا', 'هلا', 'اهلا', 'مساء الخير', 'صباح الخير'))) {
    return ar
      ? 'أهلاً بك في مجلسنا! أستطيع مساعدتك في طلب موعد المجلس، ومعرفة أسعار الخدمات، والفعاليات القادمة، وحالة طلبك. بماذا أبدأ؟'
      : 'Welcome to Majlisna! I can help you request a majlis date, compare service prices, find upcoming events, or check your request. Where shall we start?';
  }
  if (has('thank', 'thx', 'شكر', 'مشكور', 'يعطيك')) return ar ? 'العفو! إذا احتجت أي شيء آخر عن المجالس أو الخدمات فأنا هنا.' : 'You’re welcome! Ask me anything else about the majlises or services.';

  // A specific majlis
  const named = Object.entries(MAJLIS_KEYS).find(([, keys]) => keys.some((k) => q.includes(k)))?.[0];
  if (named) {
    const m = ctx.majlises.find((x) => x.id === named)!;
    const next = upcoming.find((e) => e.majlisId === m.id);
    const amenities = m.amenities.map((a) => L(AMENITY[a])).join(ar ? '، ' : ', ');
    return ar
      ? `${m.name.ar} في ${m.area.ar}: يتسع لـ${m.capacity} ضيف، ${m.hours.ar}. المرافق: ${amenities}.${next ? `\nالفعالية القادمة: ${next.title.ar} يوم ${next.date} الساعة ${next.time}.` : ''}\nيمكنك رؤية الأيام المتاحة من تبويب "المجالس".`
      : `${m.name.en} in ${m.area.en}: up to ${m.capacity} guests. Hours: ${m.hours.en}. Facilities: ${amenities}.${next ? `\nNext event: ${next.title.en} on ${next.date} at ${next.time}.` : ''}\nSee free dates in the Majlises tab.`;
  }

  // Guest count
  if (!Number.isNaN(number) && has('guest', 'people', 'fit', 'capacity', 'hold', 'ضيف', 'شخص', 'يتسع', 'سعة', 'نفر')) {
    const fits = ctx.majlises.filter((m) => m.capacity >= number).sort((a, b) => a.capacity - b.capacity);
    if (fits.length === 0) {
      const max = Math.max(...ctx.majlises.map((m) => m.capacity));
      return ar ? `لا يوجد مجلس يتسع لـ${number} ضيف حالياً. أكبر مجلس يتسع لـ${max}.` : `No majlis fits ${number} guests yet. The largest holds ${max}.`;
    }
    return (ar ? `المجالس التي تتسع لـ${number} ضيف:\n` : `Majlises that fit ${number} guests:\n`) + fits.map((m) => `• ${L(m.name)} (${L(m.area)}) · ${m.capacity}`).join('\n');
  }

  // A service category
  const cat = (Object.keys(CATEGORY_KEYS) as ServiceCategory[]).find((c) => CATEGORY_KEYS[c].some((k) => q.includes(k)));
  if (cat) {
    const lines = ctx.services
      .filter((s) => s.category === cat)
      .sort((a, b) => a.price - b.price)
      .map((s) => {
        const v = ctx.vendors.find((x) => x.id === s.vendorId)!;
        return `• ${L(v.name)}: ${money(s.price)} (${L(s.unit)})${v.verified ? (ar ? ' ✓ موثق' : ' ✓ verified') : ''}`;
      });
    return (ar ? `خيارات ${CATEGORY[cat].ar}:\n` : `${CATEGORY[cat].en} options:\n`) + lines.join('\n') + (ar ? '\nتُحجز بعد اعتماد موعدك من تبويب "خطتي".' : '\nBook them from My plan once your date is approved.');
  }

  // Prices and budget
  if (has('price', 'cost', 'how much', 'budget', 'expensive', 'cheap', 'aed', 'سعر', 'اسعار', 'كم', 'تكلفة', 'ميزانية', 'غالي')) {
    const cheapest = (Object.keys(CATEGORY) as ServiceCategory[]).map((c) => ctx.services.filter((x) => x.category === c).sort((a, b) => a.price - b.price)[0]);
    const total = cheapest.reduce((s, x) => s + x.price, 0);
    return (
      (ar ? 'أسعار الخدمات المسجلة:\n' : 'Registered service prices:\n') +
      cheapest.map((s) => `• ${L(CATEGORY[s.category])}: ${ar ? 'من' : 'from'} ${money(s.price)}`).join('\n') +
      (ar ? `\nالخدمات الأربع معاً تبدأ من ${money(total)}. طلب موعد المجلس مجاني.` : `\nAll four together start from ${money(total)}. Requesting the majlis date is free.`)
    );
  }

  // Payment, refunds, cancelling
  if (has('pay', 'card', 'refund', 'cancel', 'money back', 'دفع', 'ادفع', 'بطاقة', 'استرداد', 'استرجاع', 'الغاء', 'إلغاء')) {
    return ar
      ? 'تدفع عبر التطبيق بعد اعتماد موعدك وعند حجز الخدمات. إذا رفض المورد الطلب يُسترد مبلغ تلك الخدمة كاملاً. ويمكنك إلغاء طلب الموعد قبل أن يقرر فريق المجلس. (الدفع في هذا النموذج تجريبي.)'
      : 'You pay in the app when you book services, after your date is approved. If a vendor declines, that service is refunded in full. You can cancel a date request before the majlis team decides. (Payments in this prototype are a demo.)';
  }

  // How long approval takes
  if (has('how long', 'when will', 'wait', 'approval', 'approve', 'متى', 'كم يوم', 'مدة', 'انتظار', 'اعتماد', 'موافقة')) {
    return ar
      ? 'يراجع فريق المجلس الحكومي كل طلب ويرد عادة خلال يومين. ستصلك رسالة عندما يعتمد الموعد أو يقترح موعداً بديلاً أو يعتذر مع ذكر السبب.'
      : 'The government majlis team reviews every request and usually replies within two days. You’ll get a notification when they approve, suggest another date, or decline with a reason.';
  }

  // Booking a date / request status
  if (has('my request', 'status', 'book', 'request', 'reserve', 'date', 'wedding', 'طلبي', 'حالة', 'حجز', 'احجز', 'موعد', 'عرس', 'زواج', 'زفاف')) {
    if (ctx.myRequest) {
      const r = ctx.myRequest;
      return ar
        ? `طلبك في ${majlisName(r.majlisId)} بتاريخ ${r.date}: ${REQUEST_STATUS[r.status].ar}.${r.alternativeDate ? ` الموعد المقترح: ${r.alternativeDate}.` : ''} القرار لفريق المجلس فقط.`
        : `Your request at ${majlisName(r.majlisId)} for ${r.date}: ${REQUEST_STATUS[r.status].en}.${r.alternativeDate ? ` Suggested date: ${r.alternativeDate}.` : ''} Only the majlis team decides.`;
    }
    return ar
      ? 'افتح تبويب "خطتي"، واختر المجلس والتاريخ وعدد الضيوف، ثم أرسل الطلب. الطلب مجاني، ويعتمده فريق المجلس الحكومي أو يقترح موعداً آخر.'
      : 'Open My plan, choose a majlis, a date and your guest count, then send the request. It’s free. The government majlis team approves it or suggests another date.';
  }

  if (has('fee', 'commission', '8%', 'عمولة', 'رسوم', 'نسبة')) {
    return ar ? 'يحتفظ مجلسنا بـ٨٪ من كل خدمة مدفوعة مكتملة، ويحصل المورد على ٩٢٪. التسجيل وطلب الموعد مجانيان.' : 'Majlisna keeps 8% of each completed paid service; the vendor receives 92%. Registering and requesting a date are free.';
  }
  if (has('verif', 'trust', 'licen', 'safe', 'موثق', 'توثيق', 'رخصة', 'ثقة', 'امان')) {
    const n = ctx.vendors.filter((v) => v.verified).length;
    return ar
      ? `نتحقق من رخصة كل مورد وخدماته وتقييمات العملاء قبل ظهوره بعلامة "موثق". حالياً ${n} من ${ctx.vendors.length} موردين موثقون.`
      : `We check each vendor’s licence, listed services and customer reviews before they get the verified badge. Right now ${n} of ${ctx.vendors.length} vendors are verified.`;
  }
  if (has('privacy', 'data', 'personal', 'خصوصية', 'بيانات', 'معلومات')) {
    return ar
      ? 'تُستخدم اهتماماتك فقط لاقتراح الفعاليات، ويمكنك إيقاف ذلك من "حسابي". الذكاء الاصطناعي لا يتخذ أي قرار؛ فريق المجلس يقرر كل طلب.'
      : 'Your interests are only used to suggest events, and you can switch that off in Profile. AI never makes decisions; the majlis team decides every request.';
  }

  // Events by topic, weekend, or in general
  const topic = TOPIC_KEYS.find((t) => t.keys.some((k) => q.includes(k)));
  if (topic) {
    const list = upcoming.filter((e) => e.tags.includes(topic.tag)).slice(0, 3);
    if (list.length) return (ar ? 'فعاليات قد تعجبك:\n' : 'Events you might like:\n') + list.map(eventLine).join('\n');
  }
  if (has('weekend', 'نهاية الاسبوع', 'الويكند')) {
    const list = upcoming.filter((e) => [5, 6, 0].includes(weekday(e.date))).slice(0, 3);
    return (ar ? 'فعاليات نهاية الأسبوع:\n' : 'This weekend and after:\n') + list.map(eventLine).join('\n');
  }
  if (has('event', 'week', 'today', 'tonight', 'happening', 'activity', 'on this', 'فعالي', 'اسبوع', 'نشاط', 'اليوم', 'الليلة')) {
    return (ar ? 'أقرب الفعاليات:\n' : 'Coming up next:\n') + upcoming.slice(0, 3).map(eventLine).join('\n');
  }

  if (has('what is majlisna', 'about', 'who are you', 'what can you', 'ما هو مجلسنا', 'ماهو', 'من انت', 'عن التطبيق')) {
    return ar
      ? 'مجلسنا منصة مقترحة للمجالس الحكومية في الإمارات: تعرض المجالس والفعاليات والإعلانات، وتتيح طلب موعد المجلس مجاناً، ثم حجز خدمات موردين موثقين بعد الاعتماد. هذا نموذج أولي لمشروع طلابي.'
      : 'Majlisna is a proposed platform for UAE government majlises: see majlises, events and announcements, request a majlis date for free, then book verified vendors once it’s approved. This is a student prototype.';
  }
  if (has('majlis', 'majlises', 'biggest', 'largest', 'near', 'مجلس', 'مجالس', 'اكبر', 'قريب')) {
    return (ar ? 'المجالس القريبة منك:\n' : 'Majlises near you:\n') + [...ctx.majlises].sort((a, b) => a.distanceKm - b.distanceKm).map((m) => `• ${L(m.name)} · ${L(m.area)} · ${m.capacity} ${ar ? 'ضيف' : 'guests'} · ${m.distanceKm} km`).join('\n');
  }

  return ar
    ? 'لم أفهم السؤال تماماً. جرّب مثلاً:\n• كم سعر العيالة؟\n• أي مجلس يتسع لـ٣٠٠ ضيف؟\n• ما فعاليات نهاية الأسبوع؟\n• كيف أطلب موعداً للعرس؟'
    : 'I didn’t quite catch that. Try:\n• How much is Al Ayyala?\n• Which majlis fits 300 guests?\n• What’s on this weekend?\n• How do I request a wedding date?';
}

/* ---------- Decor ideas presets ---------- */

export interface Ideas {
  title: string;
  summary: string;
  palette: { name: string; hex: string }[];
  setup: string[];
  timeline: { time: string; item: string }[];
  services: ServiceCategory[];
}

export function presetIdeas(vibe: string, lang: Lang): Ideas {
  const ar = lang === 'ar';
  const v = normalise(vibe);
  if (v.includes('garden') || v.includes('حديقة') || v.includes('outdoor')) {
    return {
      title: ar ? 'أمسية تحت السدر' : 'Evening Under the Sidr',
      summary: ar ? 'جلسة خارجية بين الأشجار وإضاءة فوانيس دافئة. نسيم المساء والقهوة على الجمر.' : 'Open-air seating among the trees, warm lantern light, and coffee kept warm over embers.',
      palette: [
        { name: ar ? 'أخضر السدر' : 'Sidr green', hex: '#3E7A5D' },
        { name: ar ? 'رمل الغروب' : 'Dusk sand', hex: '#D9B98A' },
        { name: ar ? 'نحاس' : 'Brass', hex: '#B8893A' },
        { name: ar ? 'ليل' : 'Night', hex: '#16211C' },
      ],
      setup: ar
        ? ['فوانيس معلقة على أغصان الأشجار', 'سجاد سدو ومساند أرضية على العشب', 'ركن قهوة على الجمر', 'ممر مضاء بالشموع الآمنة', 'خيمة صغيرة لتصوير العائلة']
        : ['Lanterns hung from the branches', 'Sadu rugs and floor cushions on the lawn', 'Coffee corner over embers', 'Pathway lit with safe candles', 'Small tent for family photos'],
      timeline: [
        { time: '18:30', item: ar ? 'الاستقبال مع الغروب' : 'Welcome at sunset' },
        { time: '19:30', item: ar ? 'القهوة والتمر في الحديقة' : 'Coffee and dates in the garden' },
        { time: '20:30', item: ar ? 'العيالة على العشب' : 'Al Ayyala on the lawn' },
        { time: '21:30', item: ar ? 'العشاء تحت الفوانيس' : 'Dinner under the lanterns' },
      ],
      services: ['coffee', 'ayyala', 'catering', 'media'],
    };
  }
  if (v.includes('modern') || v.includes('عصري') || v.includes('intimate') || v.includes('عائلي') || v.includes('minimal')) {
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

/* ---------- Review insights from keywords ---------- */

export interface ReviewInsight {
  sentiment: 'positive' | 'mixed' | 'negative';
  score: number;
  praise: string[];
  concerns: string[];
  suggestion: string;
}

const PRAISE = [
  { re: /coffee|قهوة|القهوة/i, en: 'Excellent coffee', ar: 'قهوة ممتازة' },
  { re: /early|on time|punctual|بالوقت|ملتزم/i, en: 'Arrives on time', ar: 'التزام بالوقت' },
  { re: /staff|team|looked after|طاقم|محترم/i, en: 'Respectful, attentive staff', ar: 'طاقم محترم ومتعاون' },
  { re: /photo|film|highlight|ready in/i, en: 'Beautiful photos and film', ar: 'صور وفيديو جميلة' },
  { re: /food|harees|portion|tasted|اكل|الأكل|كمية/i, en: 'Generous, tasty food', ar: 'طعام لذيذ وكميات وافرة' },
  { re: /loved|hit|made the night|talking about|رائع|ممتاز/i, en: 'Guests loved it', ar: 'أعجب الضيوف كثيراً' },
];

const CONCERN = [
  { re: /ran out|قليلة|short/i, en: 'Ran short on supplies', ar: 'نقص في الكميات', fix: { en: 'Bring about 15% extra stock for large guest lists.', ar: 'جهّز كميات إضافية بنحو ١٥٪ للأعداد الكبيرة.' } },
  { re: /missed/i, en: 'Missed key moments', ar: 'فوات لحظات مهمة', fix: { en: 'Agree a shot list with the family before the night.', ar: 'اتفق مع العائلة على قائمة اللقطات قبل الحفل.' } },
  { re: /longer|took|weeks|delivery|late|تأخر/i, en: 'Slow setup or delivery', ar: 'بطء في التجهيز أو التسليم', fix: { en: 'Share a clear setup and delivery timeline in advance.', ar: 'شارك جدولاً واضحاً للتجهيز والتسليم مسبقاً.' } },
];

export function reviewInsight(reviews: Review[], lang: Lang): ReviewInsight {
  const ar = lang === 'ar';
  if (reviews.length === 0) return { sentiment: 'mixed', score: 0, praise: [], concerns: [], suggestion: '' };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const good = reviews.filter((r) => r.rating >= 4).map((r) => r.text);
  const weak = reviews.filter((r) => r.rating <= 4).map((r) => r.text);
  const praise = PRAISE.filter((p) => good.some((t) => p.re.test(t))).slice(0, 3);
  const concerns = CONCERN.filter((c) => weak.some((t) => c.re.test(t))).slice(0, 3);
  return {
    sentiment: avg >= 4.5 && concerns.length <= 1 ? 'positive' : avg >= 3.5 ? 'mixed' : 'negative',
    score: Math.round((avg / 5) * 100),
    praise: praise.map((p) => (ar ? p.ar : p.en)),
    concerns: concerns.map((c) => (ar ? c.ar : c.en)),
    suggestion: concerns[0] ? (ar ? concerns[0].fix.ar : concerns[0].fix.en) : ar ? 'حافظ على هذا المستوى واطلب من العملاء الراضين كتابة تقييم.' : 'Keep it up, and ask happy customers to leave a review.',
  };
}
