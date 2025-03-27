export interface Crop {
  id: string;
  name: string;
  displayName?: string;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  image: string;
  location: string;
  zone: string;
  crops: Crop[]; // Array of Crop objects
  totalDue: number;
  totalPaid: number;
  lastVisitDate: string;
  createdBy: string;
  createdAt: string;
  // Display fields for original case formatting
  displayName?: string;
  displayLocation?: string;
  displayZone?: string;
}

export interface Visit {
  id: string;
  farmerId: string;
  crop: Crop;
  employeeId: string;
  employeeName?: string;
  date: string;
  cropHealth: 'good' | 'average' | 'poor';
  notes: string;
  recommendations: string;
  images: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  farmerId: string;
  crop: Crop;
  date: string;
  items: string;
  quantity: number;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  employeeId: string;
  // New fields
  isWorkingCombo?: boolean;
  images?: string[];
}
export interface CropActivity {
  id: string;
  type: 'visit' | 'purchase';
  date: string;
  details: Visit | Purchase;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  phone: string;
  createdAt: string;
}
