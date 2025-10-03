export type BusinessType = "dentist" | "home_service" | "cleaning";

export interface SiteConfig {
  businessType: BusinessType;
  name: string;
  city: string;
  phone: string;
  email: string;
  address: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  hours: {
    days: string[];
    opens: string;
    closes: string;
  }[];
  services: {
    title: string;
    blurb: string;
  }[];
  valueProps: string[];
  insurers?: string[];
  mapEmbedUrl: string;
  colors: {
    primary: string;
    accent: string;
    bg: string;
  };
  rating?: {
    stars: number;
    count: number;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export const siteConfig: SiteConfig = {
  businessType: "dentist",
  name: "Acme Dental",
  city: "Walnut Creek",
  phone: "+1-925-555-1234",
  email: "frontdesk@acmedental.com",
  address: {
    line1: "1111 Civic Dr STE 145",
    city: "Walnut Creek",
    region: "CA",
    postalCode: "94596",
    country: "US"
  },
  hours: [
    { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], opens: "08:00", closes: "17:00" },
  ],
  services: [
    { title: "Family Dentistry", blurb: "Cleanings, exams, and preventive care for the whole family." },
    { title: "Cosmetic Dentistry", blurb: "Whitening, veneers, and smile makeovers." },
    { title: "Orthodontics", blurb: "Invisalign and traditional braces for beautiful smiles." },
    { title: "Emergency Care", blurb: "Same-day appointments for urgent dental needs." }
  ],
  valueProps: [
    "Pain-free numbing technology",
    "Same-day crowns with CEREC",
    "Modern 3D X-ray imaging"
  ],
  insurers: ["Delta Dental", "Aetna", "MetLife", "Cigna", "Blue Shield"],
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3149.8882881838246!2d-122.06572892342625!3d37.90662527183447!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808ff3f3f3f3f3f3%3A0x0!2zMzfCsDU0JzIzLjkiTiAxMjLCsDAzJzQ4LjYiVw!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus",
  colors: {
    primary: "#0B3B5A",
    accent: "#12A39A",
    bg: "#FFFFFF"
  },
  rating: {
    stars: 4.8,
    count: 212
  },
  social: {
    facebook: "https://facebook.com/acmedental",
    instagram: "https://instagram.com/acmedental",
  }
};
