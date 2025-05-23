import { Crop, Farmer, Purchase, Visit } from '@/types';

export const initialCrops: Crop[] = [
  { id: 'crop1', name: 'Wheat' },
  { id: 'crop2', name: 'Rice' },
  { id: 'crop3', name: 'Cotton' },
  { id: 'crop4', name: 'Soybean' },
];

// Updated initial farmers data
export const initialFarmers: Farmer[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    location: 'Greenville',
    image: '',
    crops: [
      { id: 'crop1', name: 'Wheat' },
      { id: 'crop2', name: 'Rice' },
    ],
    totalDue: 5000,
    totalPaid: 15000,
    lastVisitDate: '2024-02-20',
    lastPurchaseDate: '2024-02-20',
    createdBy: 'emp1',
    createdAt: '2024-01-15',
    zone: 'zone1',
  },
  {
    id: '2',
    name: 'Suresh Patel',
    phone: '9876543211',
    image: '',
    location: 'Bluetown',
    crops: [
      { id: 'crop3', name: 'Cotton' },
      { id: 'crop4', name: 'Soybean' },
    ],
    totalDue: 3000,
    totalPaid: 12000,
    lastVisitDate: '2024-02-18',
    lastPurchaseDate: '2024-02-20',
    createdBy: 'emp1',
    createdAt: '2024-01-20',
    zone: 'zone1',
  },
];

// Updated initial visits data
export const initialVisits: Visit[] = [
  {
    id: '1',
    farmerId: '1',
    crop: { id: 'crop1', name: 'Wheat' },
    date: '2024-02-20',
    notes: 'Crops showing good growth',
    images: [],
    cropHealth: 'good',
    recommendations: 'Continue current fertilizer schedule',
    employeeId: 'emp1',
    createdAt: '2024-02-20',
  },
];

// Updated initial purchases data
export const initialPurchases: Purchase[] = [
  {
    id: '1',
    farmerId: '1',
    crop: { id: 'crop1', name: 'Wheat' },
    date: '2024-02-24',
    items: 'NPK Fertilizer, Pesticide',
    quantity: 2,
    totalAmount: 2400,
    amountPaid: 2000,
    remainingAmount: 400,
    notes: 'First installment paid',
    employeeId: 'emp1',
    images: [],
    isWorkingCombo: false,
    createdAt: '2024-02-24',
  },
];

export const user = {
  name: 'John Doe',
  phone: '9876543210',
  email: 'john@example.com',
  role: 'Store Manager',
};
