import type { EntityId } from '../shared';

export interface Product {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly priceCents: number;
  readonly imageUrl?: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface Coupon {
  readonly id: EntityId;
  readonly code: string;
  readonly discountPercent: number;
  readonly description?: string;
  readonly createdBy: string;
  readonly createdAt: string;
}
