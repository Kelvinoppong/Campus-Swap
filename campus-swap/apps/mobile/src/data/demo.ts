import type { ImageSourcePropType } from 'react-native';
import type {
  DeliveryMethod,
  ListingAudience,
  ListingCategory,
  ListingCondition,
} from '@campus-swap/shared';

/**
 * Placeholder feed content for Weeks 1–2, while the API is still being built.
 * The shapes deliberately mirror `Listing` from @campus-swap/shared so that
 * wiring TanStack Query to /v1/listings in Weeks 3–4 is a swap, not a rewrite.
 */
export interface DemoSeller {
  initials: string;
  name: string;
  rating: number;
  sales: number;
}

export interface DemoEvent {
  name: string;
  startsAt: string;
  venue: string;
  city: string;
  scope: 'campus' | 'city' | 'global';
}

export interface DemoListing {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  category: ListingCategory;
  condition: ListingCondition;
  audience?: ListingAudience;
  size?: string;
  brand?: string;
  deliveryMethod: DeliveryMethod;
  meetupSpot: string | null;
  photo: ImageSourcePropType;
  savedCount: number;
  seller: DemoSeller;
  event?: DemoEvent;
}

const jordan: DemoSeller = { initials: 'JM', name: 'Jordan M.', rating: 4.9, sales: 12 };
const amara: DemoSeller = { initials: 'AO', name: 'Amara O.', rating: 5.0, sales: 7 };
const devin: DemoSeller = { initials: 'DR', name: 'Devin R.', rating: 4.7, sales: 21 };
const priya: DemoSeller = { initials: 'PS', name: 'Priya S.', rating: 4.8, sales: 9 };

export const DEMO_LISTINGS: DemoListing[] = [
  {
    id: 'l-calculus',
    title: 'Calculus: Early Transcendentals',
    subtitle: '8th edition · Good condition · Used for MATH 201',
    description:
      'Barely marked up, no missing pages. I kept the solutions insert. Great if you are taking MATH 201 next term.',
    priceCents: 4500,
    compareAtPriceCents: 12000,
    category: 'textbooks',
    condition: 'good',
    deliveryMethod: 'meetup',
    meetupSpot: 'Student Union lobby',
    photo: require('../../assets/mock/books.jpg'),
    savedCount: 8,
    seller: jordan,
  },
  {
    id: 'l-ps5',
    title: 'PlayStation 5 + 2 controllers',
    subtitle: 'Disc edition · Like new · Boxed with cables',
    description:
      'Bought it last winter, barely touched it once the semester started. Comes with both DualSense controllers and the original box.',
    priceCents: 32000,
    compareAtPriceCents: 49999,
    category: 'tech',
    condition: 'like_new',
    brand: 'Sony',
    deliveryMethod: 'meetup',
    meetupSpot: 'Campus police lobby',
    photo: require('../../assets/mock/console.jpg'),
    savedCount: 34,
    seller: devin,
  },
  {
    id: 'l-jacket',
    title: 'Leather biker jacket',
    subtitle: "Women's M · Like new · Worn twice",
    description: 'Faux leather, zips all work, no scuffs. Too small on me now.',
    priceCents: 4000,
    compareAtPriceCents: 8900,
    category: 'fashion',
    condition: 'like_new',
    audience: 'women',
    size: 'M',
    brand: 'Zara',
    deliveryMethod: 'meetup',
    meetupSpot: 'Main library entrance',
    photo: require('../../assets/mock/coat.jpg'),
    savedCount: 19,
    seller: amara,
  },
  {
    id: 'l-conference',
    title: 'DevWorld Berlin — 3-day pass',
    subtitle: 'Transferable · March 12–14 · Berlin, Germany',
    description:
      'I cannot make the trip anymore. Full conference pass, transfers to your name through the organiser portal in about ten minutes.',
    priceCents: 22000,
    compareAtPriceCents: 45000,
    category: 'tickets',
    condition: 'like_new',
    deliveryMethod: 'digital',
    meetupSpot: null,
    photo: require('../../assets/mock/conference.jpg'),
    savedCount: 12,
    seller: priya,
    event: {
      name: 'DevWorld Conference',
      startsAt: 'March 12, 9:00 AM',
      venue: 'Messe Berlin',
      city: 'Berlin, Germany',
      scope: 'global',
    },
  },
  {
    id: 'l-sneakers',
    title: 'Nike Free RN running shoes',
    subtitle: "Men's US 10 · Good condition",
    description: 'Ran a half marathon in these, plenty of life left. Cleaned and deodorised.',
    priceCents: 3500,
    compareAtPriceCents: 10000,
    category: 'sports',
    condition: 'good',
    audience: 'men',
    size: 'US 10',
    brand: 'Nike',
    deliveryMethod: 'meetup',
    meetupSpot: 'Rec center entrance',
    photo: require('../../assets/mock/sneakers.jpg'),
    savedCount: 6,
    seller: devin,
  },
  {
    id: 'l-headphones',
    title: 'Over-ear headphones',
    subtitle: 'Noise cancelling · Good condition',
    description: 'Great for the library. Case and cable included, battery still lasts all day.',
    priceCents: 3500,
    compareAtPriceCents: null,
    category: 'tech',
    condition: 'good',
    deliveryMethod: 'meetup',
    meetupSpot: 'Student Union lobby',
    photo: require('../../assets/mock/headphones.jpg'),
    savedCount: 4,
    seller: jordan,
  },
  {
    id: 'l-makeup',
    title: 'Makeup brush set + compact',
    subtitle: 'Unused · Still sealed',
    description: 'Got it as a gift, wrong shade for me. Never opened.',
    priceCents: 1800,
    compareAtPriceCents: 4200,
    category: 'beauty',
    condition: 'like_new',
    audience: 'women',
    deliveryMethod: 'meetup',
    meetupSpot: 'Main library entrance',
    photo: require('../../assets/mock/beauty.jpg'),
    savedCount: 11,
    seller: amara,
  },
  {
    id: 'l-guitar',
    title: 'Acoustic guitar + soft case',
    subtitle: 'Full size · Fair condition',
    description: 'Learned on this one. Small ding on the lower bout, plays and tunes fine.',
    priceCents: 7500,
    compareAtPriceCents: 16000,
    category: 'music',
    condition: 'fair',
    deliveryMethod: 'meetup',
    meetupSpot: 'Music building lobby',
    photo: require('../../assets/mock/guitar.jpg'),
    savedCount: 5,
    seller: priya,
  },
  {
    id: 'l-bike',
    title: 'City road bike',
    subtitle: '54cm frame · Good condition · New tyres',
    description: 'Commuted on it for two years. New tyres last month, brakes just serviced.',
    priceCents: 11000,
    compareAtPriceCents: 32000,
    category: 'rides',
    condition: 'good',
    deliveryMethod: 'meetup',
    meetupSpot: 'Campus police lobby',
    photo: require('../../assets/mock/bike.jpg'),
    savedCount: 14,
    seller: devin,
  },
  {
    id: 'l-lights',
    title: 'Fairy lights + mirror set',
    subtitle: 'Dorm decor · Good condition',
    description: 'Moving out, everything works. The mirror has command strips already on it.',
    priceCents: 1500,
    compareAtPriceCents: 3500,
    category: 'dorm',
    condition: 'good',
    deliveryMethod: 'meetup',
    meetupSpot: 'Student Union lobby',
    photo: require('../../assets/mock/dorm.jpg'),
    savedCount: 3,
    seller: amara,
  },
];

export const FEATURED_PHOTO = require('../../assets/mock/arch.jpg');
export const SIGN_IN_PHOTO = require('../../assets/mock/hero.jpg');

export function findListing(id: string): DemoListing | undefined {
  return DEMO_LISTINGS.find((listing) => listing.id === id);
}
