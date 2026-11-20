import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(3, "Enter your email address")
  .max(254)
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: emailSchema,
  password: passwordSchema,
  marketingOptIn: z.boolean().optional().default(false),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  line1: z.string().trim().min(3, "Street address is required").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2, "Postal code is required").max(20),
  country: z.string().length(2, "Choose a country").transform((v) => v.toUpperCase()),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  isDefaultShipping: z.boolean().optional().default(false),
  isDefaultBilling: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const cartAddSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
});
export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  email: emailSchema,
  shippingAddress: addressSchema.omit({
    label: true,
    isDefaultShipping: true,
    isDefaultBilling: true,
  }),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  paymentMethod: z.enum(["SANDBOX_CARD", "CASH_ON_DELIVERY"]).default("SANDBOX_CARD"),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  customerNote: z.string().trim().max(500).optional().or(z.literal("")),
  idempotencyKey: z.string().min(8).max(100),
  saveAddress: z.boolean().optional().default(false),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Share at least a sentence").max(2000),
});

export const returnRequestSchema = z.object({
  orderId: z.string().min(1),
  resolution: z.enum(["REFUND", "EXCHANGE", "STORE_CREDIT"]),
  reason: z.enum([
    "DOES_NOT_FIT",
    "WRONG_SIZE",
    "WRONG_COLOR",
    "NOT_AS_DESCRIBED",
    "DAMAGED",
    "DEFECTIVE",
    "CHANGED_MIND",
    "OTHER",
  ]),
  customerNote: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
        conditionNotes: z.string().trim().max(300).optional().or(z.literal("")),
        exchangeVariantId: z.string().optional(),
      }),
    )
    .min(1, "Select at least one item"),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

export const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Add a subject").max(160),
  description: z.string().trim().min(10, "Describe the issue").max(4000),
  orderId: z.string().optional().or(z.literal("")),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.string().max(40).optional(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  collection: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "popular", "rating"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export const productAdminSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug"),
  sku: z.string().trim().min(3).max(60),
  description: z.string().trim().min(20),
  shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
  brandId: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DISCONTINUED"]),
  visibility: z.enum(["PUBLIC", "HIDDEN"]),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  material: z.string().max(300).optional().or(z.literal("")),
  careInstructions: z.string().max(500).optional().or(z.literal("")),
  fitNotes: z.string().max(500).optional().or(z.literal("")),
  categoryIds: z.array(z.string()).min(1, "Choose at least one category"),
  collectionIds: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  metaTitle: z.string().max(160).optional().or(z.literal("")),
  metaDescription: z.string().max(320).optional().or(z.literal("")),
  images: z
    .array(z.object({ url: z.string().min(1), alt: z.string().min(1), color: z.string().optional() }))
    .optional()
    .default([]),
});
