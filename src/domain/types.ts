export type Lang = 'en' | 'ar';
export type Role = 'resident' | 'staff' | 'vendor' | 'business';

/** A string in both app languages. */
export interface L10n {
  en: string;
  ar: string;
}

/** ISO calendar date, `YYYY-MM-DD`. */
export type ISODate = string;

export type Interest =
  | 'heritage'
  | 'poetry'
  | 'family'
  | 'youth'
  | 'sports'
  | 'health'
  | 'business'
  | 'volunteering'
  | 'food'
  | 'faith';

export type Amenity = 'parking' | 'kitchen' | 'women' | 'garden' | 'accessible' | 'screens';

export interface Majlis {
  id: string;
  name: L10n;
  area: L10n;
  description: L10n;
  capacity: number;
  distanceKm: number;
  amenities: Amenity[];
  hours: L10n;
  /** Which arch silhouette to draw for this majlis (0-3). */
  motif: number;
}

export type EventKind = 'talk' | 'gathering' | 'workshop' | 'celebration' | 'meeting';

export interface CommunityEvent {
  id: string;
  majlisId: string;
  kind: EventKind;
  title: L10n;
  summary: L10n;
  date: ISODate;
  time: string;
  tags: Interest[];
  capacity: number;
  going: number;
}

export type ServiceCategory = 'coffee' | 'ayyala' | 'media' | 'catering';

export interface Vendor {
  id: string;
  category: ServiceCategory;
  name: L10n;
  blurb: L10n;
  rating: number;
  verified: boolean;
  licenceNo: string;
  since: number;
}

export interface Service {
  id: string;
  vendorId: string;
  category: ServiceCategory;
  name: L10n;
  price: number;
  unit: L10n;
  includes: L10n[];
}

export type Occasion = 'wedding' | 'engagement' | 'celebration';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'alternative' | 'cancelled';

export interface RequestHistoryEntry {
  at: number;
  status: RequestStatus;
  by: 'resident' | 'staff';
  note?: string;
  date?: ISODate;
}

export interface DateRequest {
  id: string;
  residentId: string;
  residentName: string;
  majlisId: string;
  date: ISODate;
  guests: number;
  occasion: Occasion;
  note?: string;
  status: RequestStatus;
  createdAt: number;
  decidedAt?: number;
  reason?: string;
  alternativeDate?: ISODate;
  history: RequestHistoryEntry[];
}

export type OrderStatus = 'awaiting_vendor' | 'confirmed' | 'declined' | 'completed';

export interface Order {
  id: string;
  requestId: string;
  serviceId: string;
  vendorId: string;
  residentName: string;
  eventDate: ISODate;
  majlisId: string;
  amount: number;
  fee: number;
  vendorNet: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Announcement {
  id: string;
  majlisId: string;
  title: L10n;
  body: L10n;
  createdAt: number;
  pinned?: boolean;
}

export interface Review {
  id: string;
  vendorId: string;
  author: string;
  rating: number;
  text: string;
  at: number;
}

export type IssueCategory = 'facility' | 'parking' | 'noise' | 'cleanliness' | 'suggestion';

export interface Issue {
  id: string;
  majlisId: string;
  category: IssueCategory;
  text: string;
  createdAt: number;
  status: 'received' | 'in_review' | 'resolved';
}

export interface AppNotification {
  id: string;
  to: Role;
  at: number;
  text: L10n;
  read: boolean;
  link?: string;
}

export interface AiPrefs {
  /** Use the resident's interests to personalise picks. */
  personalise: boolean;
  /** Master switch for every AI feature. */
  enabled: boolean;
}
