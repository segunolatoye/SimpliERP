import { z } from 'zod';

export const onboardingSchema = z.object({
  orgName: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  country: z.string().trim().min(1, 'Country is required'),
  businessType: z.string().trim().min(1, 'Business type is required'),
  baseCurrency: z.string().trim().length(3, 'Base currency must be a 3-letter ISO code'),
  language: z.string().trim().default('English'),
  companySize: z.string().trim().default('1-10'),
  slug: z.string().trim().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
