// Minimal types for the structured JSON the C-side consumes (from data/structured/).
export type PassForm = "digital_email" | "physical_coupon" | "physical_circ";

export interface Geo { lat: number; lon: number }

export interface Library {
  id: string;
  name: string;
  town: string;
  network: string;
  geo?: Geo;
  card_page?: string;
  pass_page?: string;
  website?: string;
}

export interface Price {
  audience: string;
  price: number | null;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Attraction {
  slug: string;
  name: string;
  website?: string;
  phone?: string;
  address?: Address | null;
  geo?: Geo;
  description?: string;
  categories?: string[];
  hero_image_local?: string;
  hero_image?: string;
  prices?: Price[];
  hours?: Record<string, string> | null;
  hours_note?: string | null;
  closed_days?: string[] | null;
  reservation?: {
    required?: string; // none | walk_in_ok | recommended | timed_entry
    booking_url?: string | null;
    notes?: string | null;
  } | null;
}

export interface Pass {
  library_id: string;
  attraction_slug: string;
  pass_form: PassForm;
  source_url: string;
  coupon: {
    capacity?: { kind?: string; n?: number | null };
    audience_policies?: Array<{
      audience: string;
      age_range?: { min: number | null; max: number | null } | null;
      count?: number | null;
      form?: string;
      value?: number | null;
      source_phrase?: string | null; // verbatim wording from the library page
    }>;
    summary: string;
  };
  restrictions?: {
    weekdays_only?: boolean;
    seasonal?: unknown;
    advance_booking_required?: boolean;
    blackout?: unknown[];
    booking_frequency_limit?: string | null;
    late_return_penalty?: string | null;
  };
  // per-date inventory snapshot (ISO date → status). Covers ~3 months.
  availability?: Record<string, AvailRaw>;
}

// raw status strings as they appear in passes.json availability maps.
export type AvailRaw = "available" | "limited" | "booked" | "closed" | "unavailable";

export interface DataBundle {
  libraries: Library[];
  attractions: Attraction[];
  passes: Pass[];
  libById: Map<string, Library>;
  attrBySlug: Map<string, Attraction>;
}
