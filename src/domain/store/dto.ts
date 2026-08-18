export interface CreateProductInput {
  readonly name: string;
  readonly description?: string;
  readonly priceCents: number;
  readonly imageUrl?: string;
  readonly createdBy: string;
}

export interface UpdateProductInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly priceCents?: number;
  readonly imageUrl?: string | null;
}

export interface CreateCouponInput {
  readonly code: string;
  readonly discountPercent: number;
  readonly description?: string;
  readonly createdBy: string;
}
