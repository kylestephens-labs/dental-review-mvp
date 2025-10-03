import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\+\(\)]+$/, { message: "Please enter a valid phone number" })
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional()
    .or(z.literal("")),
  
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .optional()
    .or(z.literal("")),
  
  service: z.string()
    .trim()
    .min(1, { message: "Please select a service" }),
  
  preferredDate: z.string()
    .trim()
    .min(1, { message: "Please select a preferred date" }),
  
  preferredTime: z.string()
    .trim()
    .min(1, { message: "Please select a preferred time" }),
  
  notes: z.string()
    .trim()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .optional()
    .or(z.literal("")),
  
  smsOptIn: z.boolean().optional(),
}).refine(
  (data) => data.phone || data.email,
  {
    message: "Please provide either a phone number or email address",
    path: ["phone"],
  }
);

export type LeadFormData = z.infer<typeof leadFormSchema>;
