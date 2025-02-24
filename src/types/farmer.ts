// src/types/farmer.ts
export interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  crops: string[];
  totalDue: number;
  totalPaid: number;
  lastVisitDate: string;
  createdBy: string;
  createdAt: string;
}

export interface FarmerFormData {
  name: string;
  phone: string;
  village: string;
  crops: string[];
}

export interface Visit {
  id: string;
  farmerId: string;
  employeeId: string;
  date: string;
  notes: string;
  cropHealth: string;
  recommendations: string;
  nextVisitDate: string;
  images?: string[];
}

export interface Purchase {
  id: string;
  farmerId: string;
  employeeId: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  paymentMode: 'cash' | 'upi' | 'cheque';
  notes?: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}
