
export enum TransactionType {
  SPENT = 'SPENT',
  RECEIVED = 'RECEIVED',
  LENT = 'LENT',
  BORROWED = 'BORROWED'
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO String
  type: TransactionType;
  personId?: string; // If lent/borrowed
  tags: string[];
}

export interface Person {
  id: string;
  name: string;
  netBalance: number; // Positive = they owe you, Negative = you owe them
  lastInteraction: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // IDs of people
}

export interface GroupExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // 'user' or personId
  date: string;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'good' | 'warning' | 'neutral';
}

export interface SearchFilters {
  description_contains?: string;
  date_range_start?: string;
  category_is?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  passwordHash: string; // Storing plain text for demo, hash in real app
  name: string;
}
