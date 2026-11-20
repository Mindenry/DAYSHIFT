export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta & Record<string, unknown>;
}

export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  requestId?: string;
  details?: unknown;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  productCount?: number;
  children?: CategorySummary[];
}

export interface ProductImageDto {
  id: string;
  url: string;
  alt: string;
  color?: string | null;
  position: number;
}

export interface VariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: string;
  compareAtPrice: string | null;
  availableStock: number;
  inStock: boolean;
  imageUrl: string | null;
  isActive: boolean;
}

export interface ProductCardDto {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  currency: string;
  primaryImage: string | null;
  secondaryImage?: string | null;
  brand: { id: string; name: string; slug: string } | null;
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  inStock: boolean;
  isNew?: boolean;
  rating?: { average: number; count: number };
}

export interface ProductDetailDto extends ProductCardDto {
  sku: string;
  shortDescription: string | null;
  description: string;
  material: string | null;
  careInstructions: string | null;
  fitNotes: string | null;
  features: string[];
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImageDto[];
  variants: VariantDto[];
  categories: CategorySummary[];
  collections: { id: string; name: string; slug: string }[];
  sizeGuide: { id: string; name: string; chart: unknown; notes: string | null } | null;
  rating: { average: number; count: number; distribution: Record<string, number> };
  related: ProductCardDto[];
  reviews?: ReviewDto[];
}

export interface ReviewDto {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface CartLineDto {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  availableStock: number;
  inStock: boolean;
}

export interface CartDto {
  id: string;
  currency: string;
  lines: CartLineDto[];
  itemCount: number;
  subtotal: string;
  couponCode: string | null;
  discountTotal: string;
  shippingEstimate: string;
  taxEstimate: string;
  totalEstimate: string;
  coupon?: { code: string; description: string | null; amount: string } | null;
}

export interface AccountUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  kind: "customer" | "staff";
  staffRole?: string;
  permissions?: string[];
}

export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  currency: string;
  itemCount: number;
  createdAt: string;
  thumbnail: string | null;
}

export interface OrderDetailDto extends OrderSummaryDto {
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  couponCode: string | null;
  shippingAddress: Record<string, unknown>;
  items: Array<{
    id: string;
    variantId: string | null;
    productId: string | null;
    productName: string;
    productSlug: string;
    variantSku: string;
    size: string | null;
    color: string | null;
    imageUrl: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    refundedQuantity: number;
    returnedQuantity: number;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
    reason: string | null;
    actorType: string;
  }>;
  shipments: Array<{
    id: string;
    carrier: string;
    trackingNumber: string | null;
    status: string;
    events: Array<{ status: string; description: string; occurredAt: string }>;
  }>;
  payments: Array<{
    id: string;
    status: string;
    method: string;
    amount: string;
    providerRef: string;
  }>;
  canReturn: boolean;
  returnWindowEndsAt: string | null;
}
