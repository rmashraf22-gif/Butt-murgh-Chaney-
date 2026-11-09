export type MenuCategory = 'chanay_specials' | 'tandoor' | 'sides' | 'beverages' | 'fish';

export interface MenuItem {
  id: string;
  name: string;
  nameUrdu?: string;
  category: MenuCategory;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  serving: string;
  isAvailable: boolean;
  isSpecial?: boolean;
}

export interface ReviewItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  favoriteDish: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'dispatched' | 'completed' | 'cancelled';

export interface OrderItemSummary {
  dishId: string;
  name: string;
  nameUrdu?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions: string;
  orderType: 'delivery' | 'takeaway' | 'dinein';
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  formattedTime: string;
  viewedByAdmin?: boolean;
  customerGpsMapUrl?: string;
  customerCoordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'dispatcher' | 'kitchen_staff';
  receiveNotification: boolean;
  addedAt: number | string;
  pin?: string;
}

// 100% Fresh menu - starts completely empty until Admin uploads dishes
export const INITIAL_MENU: MenuItem[] = [];

export const REVIEWS_DATA: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Haji Tanveer Butt',
    location: 'Badami Bagh Resident',
    rating: 5,
    date: '2 days ago',
    comment: 'Been having breakfast here for over 15 years. The consistency of their desi ghee tarka and the tenderness of the chicken with soft channay is unmatched anywhere in Lahore. True pride of Badami Bagh.',
    favoriteDish: 'Murgh Channay',
  },
  {
    id: 'rev-2',
    name: 'Dr. Usman Tariq',
    location: 'Gulberg III, Lahore',
    rating: 5,
    date: 'Last weekend',
    comment: 'Drove all the way from Gulberg on Sunday morning just for their Rahu fish and Roghni naan. The fish crust was shattering crisp and the meat was juicy, not greasy at all. The plum imli chutney is pure perfection!',
    favoriteDish: 'Crispy Lahori Fish',
  },
  {
    id: 'rev-3',
    name: 'Malik Zubair Awan',
    location: 'Sadiq Pura, Lahore',
    rating: 4,
    date: '1 week ago',
    comment: 'Super fast service and honest prices. You get genuine desi ghee fragrance without artificial colors. WhatsApp ordering made taking hot breakfast home for my family effortless.',
    favoriteDish: 'Special Bong Paye',
  },
  {
    id: 'rev-4',
    name: 'Farhan & Ayesha Qureshi',
    location: 'DHA Phase 5, Lahore',
    rating: 5,
    date: '3 weeks ago',
    comment: 'We hosted a weekend family brunch and ordered Channay, Roghni Naans, and Lassi. Everyone was raving about how authentic it tasted. Highly recommended!',
    favoriteDish: 'Desi Channay & Malai Lassi',
  },
];

export const BUSINESS_INFO = {
  name: 'Butt Murgh Channay & Fish Corner',
  shortName: 'Butt Murgh Channay',
  tagline: 'The Royal Taste of Lahore, Delivered Fresh',
  phone: '0321 1115672',
  phoneIntl: '+923211115672',
  whatsappRaw: '923211115672',
  address: 'Abu Bakar Rd, Sadiq Pura, Badami Bagh, Lahore',
  city: 'Lahore, Punjab, Pakistan',
  googleMapsUrl: 'https://maps.app.goo.gl/VfQMKDwHrkbs5PPq6',
  rating: 4.1,
  totalReviews: 640,
  timingBreakfast: '6:00 AM – 1:30 PM (Daily)',
  timingDinner: '4:00 PM – 12:00 AM Midnight (Daily)',
  deliveryMinOrder: 500,
  freeDeliveryThreshold: 1500,
  standardDeliveryFee: 120,
};
