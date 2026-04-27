import type { Customer, CustomerProfile, Order } from './types';

export const customers: Customer[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Carol White', email: 'carol@example.com' },
  { id: 4, name: 'David Lee', email: 'david@example.com' },
  { id: 5, name: 'Emma Davis', email: 'emma@example.com' },
];

export const customerProfiles: CustomerProfile[] = [
  { customer_id: 1, phone: '555-0101', loyalty_tier: 'Gold' },
  { customer_id: 2, phone: '555-0102', loyalty_tier: 'Silver' },
  { customer_id: 3, phone: '555-0103', loyalty_tier: 'Bronze' },
  { customer_id: 4, phone: '555-0104', loyalty_tier: 'Gold' },
  { customer_id: 5, phone: '555-0105', loyalty_tier: 'Silver' },
];

export const orders: Order[] = [
  { id: 1,  customer_id: 1, product: 'Laptop Stand',   amount: 49.99 },
  { id: 2,  customer_id: 1, product: 'Wireless Mouse',  amount: 29.99 },
  { id: 3,  customer_id: 1, product: 'USB Hub',         amount: 34.99 },
  { id: 4,  customer_id: 1, product: 'Monitor Cable',   amount: 14.99 },
  { id: 5,  customer_id: 2, product: 'Keyboard',        amount: 89.99 },
  { id: 6,  customer_id: 3, product: 'Webcam',          amount: 69.99 },
  { id: 7,  customer_id: 3, product: 'Desk Lamp',       amount: 39.99 },
  { id: 8,  customer_id: 3, product: 'Headset',         amount: 79.99 },
  { id: 9,  customer_id: 4, product: 'Notepad',         amount:  9.99 },
  { id: 10, customer_id: 4, product: 'Pen Set',         amount: 12.99 },
  { id: 11, customer_id: 5, product: 'Backpack',        amount: 59.99 },
  { id: 12, customer_id: 5, product: 'Phone Stand',     amount: 19.99 },
];
