import type { Amenity, EventKind, Interest, IssueCategory, L10n, Occasion, OrderStatus, RequestStatus, Role, ServiceCategory } from '../domain/types';

export const INTEREST: Record<Interest, L10n> = {
  heritage: { en: 'Heritage', ar: 'التراث' },
  poetry: { en: 'Poetry', ar: 'الشعر' },
  family: { en: 'Family', ar: 'العائلة' },
  youth: { en: 'Youth', ar: 'الشباب' },
  sports: { en: 'Sports', ar: 'الرياضة' },
  health: { en: 'Health', ar: 'الصحة' },
  business: { en: 'Business', ar: 'الأعمال' },
  volunteering: { en: 'Volunteering', ar: 'التطوع' },
  food: { en: 'Food', ar: 'الطبخ' },
  faith: { en: 'Faith', ar: 'الإيمان' },
};

export const CATEGORY: Record<ServiceCategory, L10n> = {
  coffee: { en: 'Coffee & hospitality', ar: 'القهوة والضيافة' },
  ayyala: { en: 'Al Ayyala', ar: 'العيالة' },
  media: { en: 'Photo & film', ar: 'التصوير' },
  catering: { en: 'Catering', ar: 'الولائم' },
};

export const AMENITY: Record<Amenity, L10n> = {
  parking: { en: 'Parking', ar: 'مواقف' },
  kitchen: { en: 'Kitchen', ar: 'مطبخ' },
  women: { en: 'Family hall', ar: 'قاعة عائلية' },
  garden: { en: 'Garden', ar: 'حديقة' },
  accessible: { en: 'Step-free', ar: 'سهل الوصول' },
  screens: { en: 'Screens', ar: 'شاشات' },
};

export const EVENT_KIND: Record<EventKind, L10n> = {
  talk: { en: 'Talk', ar: 'محاضرة' },
  gathering: { en: 'Gathering', ar: 'لقاء' },
  workshop: { en: 'Workshop', ar: 'ورشة' },
  celebration: { en: 'Celebration', ar: 'احتفال' },
  meeting: { en: 'Community meeting', ar: 'اجتماع' },
};

export const OCCASION: Record<Occasion, L10n> = {
  wedding: { en: 'Wedding', ar: 'عرس' },
  engagement: { en: 'Engagement', ar: 'خطوبة' },
  celebration: { en: 'Family celebration', ar: 'مناسبة عائلية' },
};

export const REQUEST_STATUS: Record<RequestStatus, L10n> = {
  pending: { en: 'Waiting for the majlis team', ar: 'بانتظار فريق المجلس' },
  approved: { en: 'Approved', ar: 'معتمد' },
  rejected: { en: 'Not approved', ar: 'غير معتمد' },
  alternative: { en: 'New date suggested', ar: 'موعد بديل مقترح' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },
};

export const ORDER_STATUS: Record<OrderStatus, L10n> = {
  awaiting_vendor: { en: 'Awaiting vendor', ar: 'بانتظار المورد' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  declined: { en: 'Declined · refunded', ar: 'مرفوض · مسترد' },
  completed: { en: 'Completed', ar: 'مكتمل' },
};

export const ISSUE_CATEGORY: Record<IssueCategory, L10n> = {
  facility: { en: 'Facility', ar: 'المرافق' },
  parking: { en: 'Parking', ar: 'المواقف' },
  noise: { en: 'Noise', ar: 'الإزعاج' },
  cleanliness: { en: 'Cleanliness', ar: 'النظافة' },
  suggestion: { en: 'Suggestion', ar: 'اقتراح' },
};

export const ROLE: Record<Role, L10n> = {
  resident: { en: 'Resident', ar: 'المواطن' },
  staff: { en: 'Majlis team', ar: 'فريق المجلس' },
  vendor: { en: 'Vendor', ar: 'المورد' },
  business: { en: 'Business', ar: 'الأعمال' },
};

/** Which SLR theme each AI feature is grounded in. */
export const SLR_THEME = {
  picks: { en: 'SLR theme 1–2 · ML personalisation', ar: 'المراجعة: المحور ١–٢ · التخصيص' },
  assistant: { en: 'SLR theme 1 · NLP assistant', ar: 'المراجعة: المحور ١ · معالجة اللغة' },
  ideas: { en: 'SLR theme 1–2 · Generative AI', ar: 'المراجعة: المحور ١–٢ · الذكاء التوليدي' },
  reviews: { en: 'SLR theme 1 · Feedback analysis', ar: 'المراجعة: المحور ١ · تحليل الآراء' },
  scheduling: { en: 'SLR theme 1, 3 · Scheduling + human review', ar: 'المراجعة: المحور ١، ٣ · الجدولة والمراجعة البشرية' },
} satisfies Record<string, L10n>;
