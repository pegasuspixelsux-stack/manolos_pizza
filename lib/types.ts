export type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  /** Cloudinary public_id of the uploaded photo (empty for pasted URLs). */
  imageFileId: string;
  description: string;
  published: boolean;
  createdAt?: number;
};

export type ListingInput = Omit<Listing, 'id' | 'createdAt'>;

export type LeadStatus = 'new' | 'contacted' | 'closed';

export type Lead = {
  id: string;
  name: string;
  email: string;
  property: string;
  message: string;
  status: LeadStatus;
  createdAt?: number;
};

// Staff accounts are the `Agent` model from src/types/firestore.ts.
export type { Agent as StaffUser, AgentRole as UserRole } from '../src/types/firestore';

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
