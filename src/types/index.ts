export interface Crop {
  id: string;
  name: string;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  image: string;
  location: string;
  crops: Crop[]; // Now an array of Crop objects
  totalDue: number;
  totalPaid: number;
  lastVisitDate: string;
  createdBy: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  farmerId: string;
  crop: Crop; // Single crop object
  images: string[];
  date: string;
  notes: string;
  cropHealth: 'good' | 'average' | 'poor';
  recommendations: string;
  nextVisitDate: string;
  employeeId: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  farmerId: string;
  crop: Crop; // Single crop object
  date: string;
  items: string[];
  quantity: number; // Added quantity field
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}
export interface CropActivity {
  id: string;
  type: 'visit' | 'purchase';
  date: string;
  details: Visit | Purchase;
}
