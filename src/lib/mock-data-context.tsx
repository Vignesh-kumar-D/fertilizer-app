// src/context/mock-data-context.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Farmer {
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
interface Visit {
  id: string;
  farmerId: string;
  images: string[];
  date: string;
  notes: string;
  cropHealth: 'good' | 'average' | 'poor';
  recommendations: string;
  nextVisitDate: string;
  employeeId: string;
  createdAt: string;
}
interface Purchase {
  id: string;
  farmerId: string;
  date: string;
  items: string[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;

  paymentMode: 'cash' | 'upi';
  notes?: string;
  createdBy: string;
  createdAt: string;
}
interface Purchase {
  id: string;
  farmerId: string;
  date: string;
  items: string[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  paymentMode: 'cash' | 'upi';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

interface MockDataContextType {
  farmers: Farmer[];
  visits: Visit[];
  purchases: Purchase[];
  addPurchase: (
    purchase: Omit<Purchase, 'id' | 'createdAt' | 'createdBy'>
  ) => void;
  getFarmerPurchases: (farmerId: string) => Purchase[];
  updatePurchase: (id: string, updates: Partial<Purchase>) => void;
  getPurchaseById: (id: string) => Purchase | undefined;
  addFarmer: (
    farmer: Omit<
      Farmer,
      | 'id'
      | 'createdAt'
      | 'createdBy'
      | 'totalDue'
      | 'totalPaid'
      | 'lastVisitDate'
    >
  ) => void;
  updateFarmer: (id: string, updates: Partial<Farmer>) => void;
  getFarmerById: (id: string) => Farmer | undefined;
  addVisit: (visit: Omit<Visit, 'id' | 'createdAt' | 'employeeId'>) => void;
  getFarmerVisits: (farmerId: string) => Visit[];
  getVisitById: (id: string) => Visit | undefined;
}
const initialPurchases: Purchase[] = [
  {
    id: '1',
    farmerId: '1',
    date: '2024-02-24',
    items: ['rice', 'wheat'],
    totalAmount: 2400,
    amountPaid: 2000,
    remainingAmount: 400,
    paymentMode: 'cash',
    notes: 'First installment paid',
    createdBy: 'emp1',
    createdAt: '2024-02-24',
  },
];
const initialFarmers: Farmer[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    village: 'Greenville',
    crops: ['Wheat', 'Rice'],
    totalDue: 5000,
    totalPaid: 15000,
    lastVisitDate: '2024-02-20',
    createdBy: 'emp1',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Suresh Patel',
    phone: '9876543211',
    village: 'Bluetown',
    crops: ['Cotton', 'Soybean'],
    totalDue: 3000,
    totalPaid: 12000,
    lastVisitDate: '2024-02-18',
    createdBy: 'emp1',
    createdAt: '2024-01-20',
  },
];
const initialVisits: Visit[] = [
  {
    id: '1',
    farmerId: '1',
    date: '2024-02-20',
    notes: 'Crops showing good growth',
    images: [],
    cropHealth: 'good',
    recommendations: 'Continue current fertilizer schedule',
    nextVisitDate: '2024-03-20',
    employeeId: 'emp1',
    createdAt: '2024-02-20',
  },
];
const MockDataContext = createContext<MockDataContextType | undefined>(
  undefined
);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);

  const addPurchase = (
    purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'createdBy'>
  ) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      createdBy: 'emp1',
    };
    setPurchases((prev) => [...prev, newPurchase]);

    // Update farmer's total due
    const farmer = getFarmerById(purchaseData.farmerId);
    if (farmer) {
      updateFarmer(farmer.id, {
        totalDue: farmer.totalDue + purchaseData.remainingAmount,
        totalPaid: farmer.totalPaid + purchaseData.amountPaid,
      });
    }
  };

  const getFarmerPurchases = (farmerId: string) => {
    return purchases
      .filter((purchase) => purchase.farmerId === farmerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    setPurchases((prev) =>
      prev.map((purchase) =>
        purchase.id === id ? { ...purchase, ...updates } : purchase
      )
    );
  };

  const addVisit = (
    visitData: Omit<Visit, 'id' | 'createdAt' | 'employeeId'>
  ) => {
    const newVisit: Visit = {
      ...visitData,
      id: Math.random().toString(36).substring(7),
      employeeId: 'emp1',
      createdAt: new Date().toISOString(),
    };
    setVisits((prev) => [...prev, newVisit]);

    // Update farmer's last visit date
    updateFarmer(visitData.farmerId, {
      lastVisitDate: visitData.date,
    });
  };

  const addFarmer = (
    farmerData: Omit<
      Farmer,
      | 'id'
      | 'createdAt'
      | 'createdBy'
      | 'totalDue'
      | 'totalPaid'
      | 'lastVisitDate'
    >
  ) => {
    const newFarmer: Farmer = {
      ...farmerData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      createdBy: 'emp1', // Mock employee ID
      totalDue: 0,
      totalPaid: 0,
      lastVisitDate: new Date().toISOString(),
    };
    setFarmers((prev) => [...prev, newFarmer]);
  };
  const getPurchaseById = (id: string) => purchases.find((p) => p.id === id);
  const updateFarmer = (id: string, updates: Partial<Farmer>) => {
    setFarmers((prev) =>
      prev.map((farmer) =>
        farmer.id === id ? { ...farmer, ...updates } : farmer
      )
    );
  };

  const getFarmerById = (id: string) =>
    farmers.find((farmer) => farmer.id === id);

  const getFarmerVisits = (farmerId: string) => {
    return visits
      .filter((visit) => visit.farmerId === farmerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  const getVisitById = (id: string) => visits.find((visit) => visit.id === id);
  return (
    <MockDataContext.Provider
      value={{
        farmers,
        visits,
        purchases,
        addFarmer,
        updateFarmer,
        getFarmerById,
        addVisit,
        getFarmerVisits,
        addPurchase,
        getFarmerPurchases,
        updatePurchase,
        getPurchaseById,
        getVisitById,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}
export { MockDataContext };
