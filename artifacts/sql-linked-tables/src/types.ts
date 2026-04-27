import type { ReactNode } from 'react';

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface CustomerProfile {
  customer_id: number;
  phone: string;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold';
}

export interface Order {
  id: number;
  customer_id: number;
  product: string;
  amount: number;
}

export interface Column<T> {
  key: keyof T;
  label: string;
  isFK?: boolean;
  align?: 'left' | 'right';
  render?: (value: unknown) => ReactNode;
}

export type TabId = 'one-to-one' | 'one-to-many';

export interface Selection {
  side: 'left' | 'right';
  id: number;
}
