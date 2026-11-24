import { addDays, weekday } from './dates';
import type {
  Announcement,
  AppNotification,
  CommunityEvent,
  DateRequest,
  ISODate,
  Issue,
  Majlis,
  Order,
  Review,
  Service,
  Vendor,
} from './types';
import { splitCommission } from './money';

/**
 * Sample data for the prototype. Every majlis, vendor and person here is fictional.
 * Dates are generated relative to "today" so the demo always looks current.
 */

export const MAJLISES: Majlis[] = [
  {
    id: 'ghaf',
    name: { en: 'Majlis Al Ghaf', ar: 'مجلس الغاف' },
    area: { en: 'Khalifa City', ar: 'مدينة خليفة' },
    description: {
      en: 'A large community majlis with a shaded courtyard and a separate family hall. Popular for weddings of up to 400 guests.',
      ar: 'مجلس مجتمعي واسع بفناء مظلل وقاعة عائلية مستقلة، مناسب للأعراس حتى ٤٠٠ ضيف.',
    },
    capacity: 400,
    distanceKm: 1.2,
    amenities: ['parking', 'kitchen', 'women', 'accessible'],
    hours: { en: 'Daily 4 pm – 11 pm', ar: 'يومياً ٤ م – ١١ م' },
    motif: 0,
  },
  {
    id: 'sidr',
    name: { en: 'Majlis Al Sidr', ar: 'مجلس السدر' },
    area: { en: 'Al Shamkha', ar: 'الشامخة' },
    description: {
      en: 'A newer majlis with a garden terrace and screens for lectures. Hosts the weekly youth majlis.',
      ar: 'مجلس حديث بشرفة حديقة وشاشات للمحاضرات، يستضيف مجلس الشباب الأسبوعي.',
    },
    capacity: 300,
    distanceKm: 3.8,
    amenities: ['parking', 'garden', 'screens', 'accessible'],
    hours: { en: 'Daily 5 pm – 11 pm', ar: 'يومياً ٥ م – ١١ م' },
    motif: 1,
  },
  {
    id: 'nakheel',
    name: { en: 'Majlis Al Nakheel', ar: 'مجلس النخيل' },
    area: { en: 'Mohammed Bin Zayed City', ar: 'مدينة محمد بن زايد' },
    description: {
      en: 'A traditional majlis with palm-frond detailing and a full kitchen for catered events.',
      ar: 'مجلس تقليدي بتفاصيل من سعف النخيل ومطبخ متكامل للمناسبات.',
    },
    capacity: 250,
    distanceKm: 5.1,
    amenities: ['kitchen', 'women', 'parking'],
    hours: { en: 'Daily 4 pm – 12 am', ar: 'يومياً ٤ م – ١٢ ص' },
    motif: 2,
  },
  {
    id: 'yasmeen',
    name: { en: 'Majlis Al Yasmeen', ar: 'مجلس الياسمين' },
    area: { en: 'Al Bahia', ar: 'الباهية' },
    description: {
      en: 'An intimate majlis by the corniche, suited to engagements and smaller family celebrations.',
      ar: 'مجلس هادئ قرب الكورنيش، مناسب للخطوبة والمناسبات العائلية الصغيرة.',
    },
    capacity: 150,
    distanceKm: 8.4,
    amenities: ['garden', 'women', 'accessible'],
    hours: { en: 'Thu – Sat 5 pm – 12 am', ar: 'الخميس – السبت ٥ م – ١٢ ص' },
    motif: 3,
  },
];

export const VENDORS: Vendor[] = [
  {
    id: 'dallah',
    category: 'coffee',
    name: { en: 'Dallah & Finjan Hospitality', ar: 'ضيافة الدلة والفنجان' },
    blurb: { en: 'Arabic coffee, dates and hospitality staff in traditional dress.', ar: 'قهوة عربية وتمر وطاقم ضيافة بالزي التقليدي.' },
    rating: 4.8,
    verified: true,
    licenceNo: 'CN-SAMPLE-2041',
    since: 2016,
  },
  {
    id: 'gahwa',
    category: 'coffee',
    name: { en: 'Bait Al Gahwa', ar: 'بيت القهوة' },
    blurb: { en: 'Coffee and luqaimat station for smaller gatherings.', ar: 'ركن قهوة ولقيمات للمناسبات الصغيرة.' },
    rating: 4.5,
    verified: true,
    licenceNo: 'CN-SAMPLE-3317',
    since: 2020,
  },
  {
    id: 'nakhwa',
    category: 'ayyala',
    name: { en: 'Al Nakhwa Ayyala Group', ar: 'فرقة النخوة للعيالة' },
    blurb: { en: 'Al Ayyala performers with drums and canes, 45-minute set.', ar: 'فرقة عيالة بالطبول والعصي، عرض لمدة ٤٥ دقيقة.' },
    rating: 4.9,
    verified: true,
    licenceNo: 'CN-SAMPLE-1188',
    since: 2009,
  },
  {
    id: 'liwa',
    category: 'ayyala',
    name: { en: 'Liwa Heritage Band', ar: 'فرقة ليوا التراثية' },
    blurb: { en: 'Ayyala and Razfa with a larger troupe for big weddings.', ar: 'عيالة ورزفة بفرقة أكبر للأعراس الكبيرة.' },
    rating: 4.6,
    verified: false,
    licenceNo: 'Pending check',
    since: 2018,
  },
  {
    id: 'noor',
    category: 'media',
    name: { en: 'Noor Lens Studio', ar: 'استوديو نور' },
    blurb: { en: 'Photography and filming with a same-week highlight reel.', ar: 'تصوير فوتوغرافي وفيديو مع ملخص خلال أسبوع.' },
    rating: 4.7,
    verified: true,
    licenceNo: 'CN-SAMPLE-4502',
    since: 2017,
  },
  {
    id: 'sahra',
    category: 'media',
    name: { en: 'Sahra Films', ar: 'صحراء للأفلام' },
    blurb: { en: 'Cinematic wedding films, drone shots where permitted.', ar: 'أفلام أعراس سينمائية وتصوير جوي حيث يُسمح.' },
    rating: 4.4,
    verified: true,
    licenceNo: 'CN-SAMPLE-5120',
    since: 2021,
  },
  {
    id: 'walima',
    category: 'catering',
    name: { en: 'Walima Kitchen', ar: 'مطبخ الوليمة' },
    blurb: { en: 'Emirati catering: machboos, harees and luqaimat.', ar: 'ضيافة إماراتية: مجبوس وهريس ولقيمات.' },
    rating: 4.8,
    verified: true,
    licenceNo: 'CN-SAMPLE-2290',
    since: 2012,
  },
  {
    id: 'mandi',
    category: 'catering',
    name: { en: 'Al Mandi House', ar: 'بيت المندي' },
    blurb: { en: 'Large-tray mandi and grills for big guest lists.', ar: 'مندي ومشويات بصواني كبيرة للأعداد الكبيرة.' },
    rating: 4.3,
    verified: true,
    licenceNo: 'CN-SAMPLE-6075',
    since: 2015,
  },
];

/** The first service of each category uses the price examples from the business plan. */
export const SERVICES: Service[] = [
  {
    id: 'svc-dallah',
    vendorId: 'dallah',
    category: 'coffee',
    name: { en: 'Arabic coffee & hospitality', ar: 'قهوة عربية وضيافة' },
    price: 2100,
    unit: { en: 'per event', ar: 'للمناسبة' },
    includes: [
      { en: '4 hospitality staff', ar: '٤ من طاقم الضيافة' },
      { en: 'Coffee, tea and dates', ar: 'قهوة وشاي وتمر' },
      { en: 'Brass dallah set', ar: 'طقم دلال نحاسية' },
    ],
  },
  {
    id: 'svc-gahwa',
    vendorId: 'gahwa',
    category: 'coffee',
    name: { en: 'Coffee & luqaimat station', ar: 'ركن القهوة واللقيمات' },
    price: 1800,
    unit: { en: 'per event', ar: 'للمناسبة' },
    includes: [
      { en: '2 hosts', ar: 'مضيفان' },
      { en: 'Live luqaimat', ar: 'لقيمات طازجة' },
    ],
  },
  {
    id: 'svc-nakhwa',
    vendorId: 'nakhwa',
    category: 'ayyala',
    name: { en: 'Al Ayyala performance', ar: 'عرض العيالة' },
    price: 1000,
    unit: { en: '45-minute set', ar: 'عرض ٤٥ دقيقة' },
    includes: [
      { en: '12 performers', ar: '١٢ مؤدياً' },
      { en: 'Drums and canes', ar: 'طبول وعصي' },
    ],
  },
  {
    id: 'svc-liwa',
    vendorId: 'liwa',
    category: 'ayyala',
    name: { en: 'Ayyala & Razfa, full troupe', ar: 'عيالة ورزفة، فرقة كاملة' },
    price: 1600,
    unit: { en: '60-minute set', ar: 'عرض ٦٠ دقيقة' },
    includes: [
      { en: '20 performers', ar: '٢٠ مؤدياً' },
      { en: 'Sound system', ar: 'نظام صوت' },
    ],
  },
  {
    id: 'svc-noor',
    vendorId: 'noor',
    category: 'media',
    name: { en: 'Photography & filming', ar: 'تصوير فوتوغرافي وفيديو' },
    price: 1750,
    unit: { en: 'up to 5 hours', ar: 'حتى ٥ ساعات' },
    includes: [
      { en: '300 edited photos', ar: '٣٠٠ صورة معدّلة' },
      { en: '3-minute highlight film', ar: 'فيلم ملخص ٣ دقائق' },
    ],
  },
  {
    id: 'svc-sahra',
    vendorId: 'sahra',
    category: 'media',
    name: { en: 'Cinematic wedding film', ar: 'فيلم زفاف سينمائي' },
    price: 2400,
    unit: { en: 'full evening', ar: 'أمسية كاملة' },
    includes: [
      { en: '2 camera operators', ar: 'مصوران' },
      { en: '10-minute film', ar: 'فيلم ١٠ دقائق' },
    ],
  },
  {
    id: 'svc-walima',
    vendorId: 'walima',
    category: 'catering',
    name: { en: 'Emirati catering', ar: 'ضيافة إماراتية' },
    price: 4200,
    unit: { en: '30 guests', ar: '٣٠ ضيفاً' },
    includes: [
      { en: 'Machboos and harees', ar: 'مجبوس وهريس' },
      { en: 'Serving staff', ar: 'طاقم تقديم' },
    ],
  },
  {
    id: 'svc-mandi',
    vendorId: 'mandi',
    category: 'catering',
    name: { en: 'Mandi trays & grills', ar: 'صواني مندي ومشويات' },
    price: 5600,
    unit: { en: '40 guests', ar: '٤٠ ضيفاً' },
    includes: [
      { en: 'Lamb and chicken mandi', ar: 'مندي لحم ودجاج' },
      { en: 'Salads and desserts', ar: 'سلطات وحلويات' },
    ],
  },
];

export const ME = { id: 'me', name: 'Hamad Al Suwaidi' };

const H = 3_600_000;
const D = 24 * H;

/** Next date on or after `from` with the given weekday. */
function nextWeekday(from: ISODate, wd: number, skipWeeks = 0): ISODate {
  let d = from;
  while (weekday(d) !== wd) d = addDays(d, 1);
  return addDays(d, skipWeeks * 7);
}

/** Next 2 December (Eid Al Etihad) on or after today. */
function nextEidAlEtihad(today: ISODate): ISODate {
  const y = Number(today.slice(0, 4));
  const thisYear = `${y}-12-02`;
  return thisYear >= today ? thisYear : `${y + 1}-12-02`;
}

export function seedEvents(today: ISODate): CommunityEvent[] {
  const ev = (
    id: string,
    majlisId: string,
    kind: CommunityEvent['kind'],
    date: ISODate,
    time: string,
    tags: CommunityEvent['tags'],
    title: [string, string],
    summary: [string, string],
    capacity: number,
    going: number,
  ): CommunityEvent => ({ id, majlisId, kind, date, time, tags, title: { en: title[0], ar: title[1] }, summary: { en: summary[0], ar: summary[1] }, capacity, going });

  return [
    ev('e-etihad', 'ghaf', 'celebration', nextEidAlEtihad(today), '19:00', ['heritage', 'family'],
      ['Eid Al Etihad evening', 'أمسية عيد الاتحاد'],
      ['Flag ceremony, Al Ayyala and a heritage market for families.', 'مراسم العلم وعرض العيالة وسوق تراثي للعائلات.'], 400, 268),
    ev('e-nabati', 'sidr', 'gathering', nextWeekday(today, 3), '20:00', ['poetry', 'heritage'],
      ['Nabati poetry night', 'أمسية الشعر النبطي'],
      ['Local poets read new work. Open mic for young poets in the second hour.', 'شعراء محليون يلقون قصائد جديدة، مع فقرة مفتوحة للشعراء الشباب.'], 120, 74),
    ev('e-ai-youth', 'sidr', 'talk', nextWeekday(today, 1), '18:30', ['youth', 'business'],
      ['Youth majlis: careers in AI', 'مجلس الشباب: وظائف الذكاء الاصطناعي'],
      ['Graduates working in Abu Dhabi tech share how they got their first role.', 'خريجون يعملون في قطاع التقنية بأبوظبي يشاركون تجاربهم في أول وظيفة.'], 80, 51),
    ev('e-sadu', 'nakheel', 'workshop', nextWeekday(today, 6), '17:00', ['heritage', 'family'],
      ['Al Sadu weaving workshop', 'ورشة نسيج السدو'],
      ['Learn the basic Sadu patterns on a small loom. Materials provided.', 'تعلّم أنماط السدو الأساسية على نول صغير، المواد متوفرة.'], 30, 22),
    ev('e-health', 'ghaf', 'gathering', nextWeekday(today, 6, 1), '07:30', ['health', 'family'],
      ['Family walk & health checks', 'مشي عائلي وفحوصات صحية'],
      ['A 3 km walk followed by free blood pressure and sugar checks.', 'مشي ٣ كم يتبعه فحص مجاني للضغط والسكر.'], 200, 96),
    ev('e-parking', 'ghaf', 'meeting', nextWeekday(today, 2, 1), '19:30', ['family'],
      ['Neighbourhood meeting: parking plan', 'اجتماع الحي: خطة المواقف'],
      ['Residents and the municipality discuss new parking for wedding nights.', 'نقاش بين السكان والبلدية حول مواقف ليالي الأعراس.'], 150, 41),
    ev('e-falcon', 'nakheel', 'talk', nextWeekday(today, 4, 1), '20:00', ['heritage'],
      ['Falconry: past and present', 'الصقارة بين الماضي والحاضر'],
      ['A falconer talks about training, conservation and the hunting season.', 'صقّار يتحدث عن التدريب والحفاظ على الصقور وموسم القنص.'], 100, 63),
    ev('e-business', 'yasmeen', 'workshop', nextWeekday(today, 0, 1), '18:00', ['business'],
      ['Home business clinic', 'عيادة المشاريع المنزلية'],
      ['Licensing and pricing advice for home-based food and craft projects.', 'نصائح الترخيص والتسعير للمشاريع المنزلية في الطعام والحرف.'], 40, 18),
    ev('e-clean', 'yasmeen', 'gathering', nextWeekday(today, 6, 2), '07:00', ['volunteering', 'family'],
      ['Corniche clean-up', 'تنظيف الكورنيش'],
      ['Volunteer morning on the corniche. Gloves and breakfast provided.', 'صباح تطوعي على الكورنيش، القفازات والإفطار متوفران.'], 60, 33),
    ev('e-football', 'sidr', 'gathering', nextWeekday(today, 5, 1), '16:30', ['sports', 'youth'],
      ['Under-12 football league', 'دوري كرة القدم تحت ١٢ سنة'],
      ['Weekly league for neighbourhood children. Register as a team or individually.', 'دوري أسبوعي لأطفال الحي، التسجيل كفريق أو بشكل فردي.'], 64, 48),
    ev('e-harees', 'nakheel', 'workshop', nextWeekday(today, 4, 2), '16:00', ['food', 'family'],
      ['Cooking harees & luqaimat', 'طبخ الهريس واللقيمات'],
      ['Two grandmothers teach the family recipes, then everyone eats together.', 'جدتان تعلّمان وصفات العائلة، ثم يجتمع الجميع على المائدة.'], 25, 25),
    ev('e-quran', 'ghaf', 'talk', nextWeekday(today, 1, 1), '20:30', ['faith', 'family'],
      ['Evening reflection circle', 'حلقة تأمل مسائية'],
      ['A short talk on family values followed by Arabic coffee.', 'حديث قصير عن القيم الأسرية تليه القهوة العربية.'], 90, 37),
  ];
}

export function seedRequests(today: ISODate, now: number): DateRequest[] {
  const approved = (id: string, majlisId: string, date: ISODate, name: string, guests: number, ageDays: number): DateRequest => ({
    id,
    residentId: `u-${id}`,
    residentName: name,
    majlisId,
    date,
    guests,
    occasion: 'wedding',
    status: 'approved',
    createdAt: now - ageDays * D,
    decidedAt: now - ageDays * D + 20 * H,
    history: [
      { at: now - ageDays * D, status: 'pending', by: 'resident' },
      { at: now - ageDays * D + 20 * H, status: 'approved', by: 'staff' },
    ],
  });
  const pending = (id: string, majlisId: string, date: ISODate, name: string, guests: number, ageHours: number, occasion: DateRequest['occasion'] = 'wedding', note?: string): DateRequest => ({
    id,
    residentId: `u-${id}`,
    residentName: name,
    majlisId,
    date,
    guests,
    occasion,
    note,
    status: 'pending',
    createdAt: now - ageHours * H,
    history: [{ at: now - ageHours * H, status: 'pending', by: 'resident' }],
  });

  const thu1 = nextWeekday(addDays(today, 3), 4);
  const fri1 = nextWeekday(addDays(today, 3), 5);
  const thu2 = addDays(thu1, 7);
  const sat2 = nextWeekday(addDays(today, 9), 6);
  const fri3 = addDays(fri1, 14);
  const thu4 = addDays(thu1, 21);

  return [
    approved('b1', 'ghaf', thu1, 'Saif Al Hammadi', 350, 30),
    approved('b2', 'ghaf', fri1, 'Obaid Al Kaabi', 280, 26),
    approved('b3', 'ghaf', thu2, 'Khalid Al Nuaimi', 300, 21),
    approved('b4', 'sidr', thu1, 'Majid Al Shamsi', 220, 18),
    approved('b5', 'nakheel', fri1, 'Ali Al Mazrouei', 200, 15),
    approved('b6', 'ghaf', fri3, 'Sultan Al Dhaheri', 390, 10),
    approved('b7', 'yasmeen', sat2, 'Abdulla Al Hosani', 120, 9),
    pending('p1', 'ghaf', sat2, 'Mohammed Al Ameri', 320, 30, 'wedding', 'Women’s hall needed from 8 pm.'),
    pending('p2', 'ghaf', sat2, 'Rashed Al Blooshi', 260, 6, 'wedding'),
    pending('p3', 'sidr', thu4, 'Faisal Al Marri', 180, 52, 'engagement', 'Garden terrace if possible.'),
    pending('p4', 'nakheel', addDays(thu2, 1), 'Humaid Al Falasi', 240, 3, 'wedding'),
  ];
}

export function seedOrders(today: ISODate, now: number): Order[] {
  // Past completed services from earlier weddings, so vendor and business views have history.
  const done = (id: string, serviceId: string, vendorId: string, amount: number, ageDays: number, name: string, majlisId: string): Order => {
    const s = splitCommission(amount);
    return {
      id,
      requestId: `past-${id}`,
      serviceId,
      vendorId,
      residentName: name,
      eventDate: addDays(today, -ageDays),
      majlisId,
      amount,
      fee: s.fee,
      vendorNet: s.vendor,
      status: 'completed',
      createdAt: now - (ageDays + 14) * D,
      updatedAt: now - ageDays * D,
    };
  };
  const live = (id: string, serviceId: string, vendorId: string, amount: number, requestId: string, eventDate: ISODate, name: string, majlisId: string, status: Order['status']): Order => {
    const s = splitCommission(amount);
    return { id, requestId, serviceId, vendorId, residentName: name, eventDate, majlisId, amount, fee: s.fee, vendorNet: s.vendor, status, createdAt: now - 3 * D, updatedAt: now - 2 * D };
  };
  const thu1 = nextWeekday(addDays(today, 3), 4);
  const fri1 = nextWeekday(addDays(today, 3), 5);
  return [
    done('o1', 'svc-dallah', 'dallah', 2100, 40, 'Hazza Al Mansouri', 'ghaf'),
    done('o2', 'svc-nakhwa', 'nakhwa', 1000, 40, 'Hazza Al Mansouri', 'ghaf'),
    done('o3', 'svc-noor', 'noor', 1750, 40, 'Hazza Al Mansouri', 'ghaf'),
    done('o4', 'svc-walima', 'walima', 4200, 33, 'Theyab Al Rumaithi', 'sidr'),
    done('o5', 'svc-dallah', 'dallah', 2100, 33, 'Theyab Al Rumaithi', 'sidr'),
    done('o6', 'svc-sahra', 'sahra', 2400, 25, 'Juma Al Qubaisi', 'nakheel'),
    done('o7', 'svc-nakhwa', 'nakhwa', 1000, 25, 'Juma Al Qubaisi', 'nakheel'),
    done('o8', 'svc-mandi', 'mandi', 5600, 18, 'Salem Al Junaibi', 'ghaf'),
    done('o9', 'svc-gahwa', 'gahwa', 1800, 18, 'Salem Al Junaibi', 'ghaf'),
    done('o10', 'svc-noor', 'noor', 1750, 11, 'Butti Al Muhairi', 'yasmeen'),
    done('o11', 'svc-dallah', 'dallah', 2100, 11, 'Butti Al Muhairi', 'yasmeen'),
    done('o12', 'svc-walima', 'walima', 4200, 4, 'Ahmed Al Shehhi', 'ghaf'),
    live('o13', 'svc-dallah', 'dallah', 2100, 'b1', thu1, 'Saif Al Hammadi', 'ghaf', 'confirmed'),
    live('o14', 'svc-nakhwa', 'nakhwa', 1000, 'b1', thu1, 'Saif Al Hammadi', 'ghaf', 'awaiting_vendor'),
    live('o15', 'svc-noor', 'noor', 1750, 'b2', fri1, 'Obaid Al Kaabi', 'ghaf', 'awaiting_vendor'),
    live('o16', 'svc-walima', 'walima', 4200, 'b5', fri1, 'Ali Al Mazrouei', 'nakheel', 'confirmed'),
  ];
}

export function seedReviews(now: number): Review[] {
  const r = (id: string, vendorId: string, author: string, rating: number, text: string, ageDays: number): Review => ({ id, vendorId, author, rating, text, at: now - ageDays * D });
  return [
    r('rv1', 'dallah', 'Hazza M.', 5, 'The coffee team arrived early and looked after every guest. Our elders loved the service.', 39),
    r('rv2', 'dallah', 'Theyab R.', 5, 'خدمة ممتازة والقهوة طيبة، الطاقم محترم جداً.', 32),
    r('rv3', 'dallah', 'Butti M.', 4, 'Great hospitality but they ran out of dates near the end of the night.', 10),
    r('rv4', 'nakhwa', 'Hazza M.', 5, 'The Ayyala made the night. Guests were still talking about it the next day.', 39),
    r('rv5', 'nakhwa', 'Juma Q.', 5, 'فرقة رائعة وملتزمة بالوقت.', 24),
    r('rv6', 'noor', 'Hazza M.', 5, 'Photos were ready in five days and the highlight film was beautiful.', 38),
    r('rv7', 'noor', 'Butti M.', 3, 'Good photos, but the photographer missed the entrance of the groom.', 9),
    r('rv8', 'walima', 'Theyab R.', 5, 'The harees tasted like home. Portions were generous.', 31),
    r('rv9', 'walima', 'Ahmed S.', 4, 'Food was excellent, setup took longer than promised.', 3),
    r('rv10', 'sahra', 'Juma Q.', 4, 'Cinematic film, but delivery took three weeks.', 22),
    r('rv11', 'mandi', 'Salem J.', 4, 'كمية الأكل ممتازة لكن الحلويات كانت قليلة.', 17),
    r('rv12', 'gahwa', 'Salem J.', 5, 'The luqaimat station was a hit with the kids.', 17),
  ];
}

export function seedAnnouncements(today: ISODate, now: number): Announcement[] {
  return [
    {
      id: 'a1',
      majlisId: 'ghaf',
      title: { en: 'Eid Al Etihad: extended hours', ar: 'عيد الاتحاد: تمديد ساعات العمل' },
      body: {
        en: 'Majlis Al Ghaf stays open until 1 am on Eid Al Etihad. Parking marshals will be on site.',
        ar: 'يبقى مجلس الغاف مفتوحاً حتى الواحدة صباحاً في عيد الاتحاد، مع وجود منظمين للمواقف.',
      },
      createdAt: now - 1 * D,
      pinned: true,
    },
    {
      id: 'a2',
      majlisId: 'sidr',
      title: { en: 'New shaded parking', ar: 'مواقف مظللة جديدة' },
      body: {
        en: '60 new shaded spaces are open behind Majlis Al Sidr from this week.',
        ar: 'افتتاح ٦٠ موقفاً مظللاً جديداً خلف مجلس السدر ابتداءً من هذا الأسبوع.',
      },
      createdAt: now - 3 * D,
    },
    {
      id: 'a3',
      majlisId: 'nakheel',
      title: { en: 'Kitchen maintenance', ar: 'صيانة المطبخ' },
      body: {
        en: `The Majlis Al Nakheel kitchen is closed for maintenance on ${addDays(today, 12)}. Catered events that day will use the outdoor station.`,
        ar: `مطبخ مجلس النخيل مغلق للصيانة يوم ${addDays(today, 12)}، وستُستخدم محطة خارجية للمناسبات في ذلك اليوم.`,
      },
      createdAt: now - 5 * D,
    },
  ];
}

export function seedIssues(now: number): Issue[] {
  return [
    { id: 'i1', majlisId: 'ghaf', category: 'parking', text: 'Cars block the side gate on wedding nights.', createdAt: now - 2 * D, status: 'in_review' },
    { id: 'i2', majlisId: 'sidr', category: 'facility', text: 'Air conditioning in the family hall is weak.', createdAt: now - 6 * D, status: 'resolved' },
  ];
}

export function seedNotifications(now: number): AppNotification[] {
  return [
    {
      id: 'n1',
      to: 'resident',
      at: now - 1 * D,
      text: { en: 'Majlis Al Ghaf posted: Eid Al Etihad extended hours.', ar: 'مجلس الغاف نشر: تمديد ساعات العمل في عيد الاتحاد.' },
      read: false,
    },
    {
      id: 'n2',
      to: 'staff',
      at: now - 6 * H,
      text: { en: 'New date request from Rashed Al Blooshi clashes with another request.', ar: 'طلب جديد من راشد البلوشي يتعارض مع طلب آخر.' },
      read: false,
    },
    {
      id: 'n3',
      to: 'vendor',
      at: now - 2 * D,
      text: { en: 'New order: Al Ayyala performance for Saif Al Hammadi.', ar: 'طلب جديد: عرض العيالة لسيف الحمادي.' },
      read: false,
    },
  ];
}
