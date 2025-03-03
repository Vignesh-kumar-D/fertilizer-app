// src/context/mock-data-context.tsx
'use client';

import { MockDataContextType } from '@/types/store-mock.type';
import { Crop, Farmer, Purchase, Visit } from '@/types';
import { createContext, useContext, useState, ReactNode } from 'react';
import {
  initialCrops,
  initialFarmers,
  initialPurchases,
  initialVisits,
} from './mockData';

const MockDataContext = createContext<MockDataContextType | undefined>(
  undefined
);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);

  // Crop functions
  const addCrop = (cropData: Omit<Crop, 'id'>) => {
    const newCrop: Crop = {
      ...cropData,
      id: `crop${Math.random().toString(36).substring(2, 7)}`,
    };
    setCrops((prev) => [...prev, newCrop]);
    return newCrop;
  };

  const getCropById = (id: string) => crops.find((crop) => crop.id === id);

  // Farmer functions
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
      id: `farmer${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      createdBy: 'emp1', // Mock employee ID
      totalDue: 0,
      totalPaid: 0,
      lastVisitDate: new Date().toISOString(),
    };
    setFarmers((prev) => [...prev, newFarmer]);
  };

  const updateFarmer = (id: string, updates: Partial<Farmer>) => {
    setFarmers((prev) =>
      prev.map((farmer) =>
        farmer.id === id ? { ...farmer, ...updates } : farmer
      )
    );
  };

  const getFarmerById = (id: string) =>
    farmers.find((farmer) => farmer.id === id);

  // Visit functions
  const addVisit = (
    visitData: Omit<Visit, 'id' | 'createdAt' | 'employeeId'>
  ) => {
    const newVisit: Visit = {
      ...visitData,
      id: `visit${Math.random().toString(36).substring(2, 7)}`,
      employeeId: 'emp1',
      createdAt: new Date().toISOString(),
    };
    setVisits((prev) => [...prev, newVisit]);

    // Update farmer's last visit date
    updateFarmer(visitData.farmerId, {
      lastVisitDate: visitData.date,
    });
  };

  const getFarmerVisits = (farmerId: string) => {
    return visits
      .filter((visit) => visit.farmerId === farmerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCropVisits = (cropId: string) => {
    return visits
      .filter((visit) => visit.crop.id === cropId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getVisitById = (id: string) => visits.find((visit) => visit.id === id);

  // Purchase functions
  const addPurchase = (
    purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'createdBy'>
  ) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `purchase${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      employeeId: 'emp1',
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

  const getCropPurchases = (cropId: string) => {
    return purchases
      .filter((purchase) => purchase.crop.id === cropId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    setPurchases((prev) =>
      prev.map((purchase) =>
        purchase.id === id ? { ...purchase, ...updates } : purchase
      )
    );
  };

  const getPurchaseById = (id: string) => purchases.find((p) => p.id === id);
  // Helper function to get crop-specific activities for a specific farmer
  const getFarmerCropActivities = (farmerId: string, cropId: string) => {
    // Get visits for this farmer and crop
    const cropVisits = visits
      .filter(
        (visit) => visit.farmerId === farmerId && visit.crop.id === cropId
      )
      .map((visit) => ({
        id: visit.id,
        type: 'visit' as const,
        date: visit.date,
        details: visit,
      }));

    // Get purchases for this farmer and crop
    const cropPurchases = purchases
      .filter(
        (purchase) =>
          purchase.farmerId === farmerId && purchase.crop.id === cropId
      )
      .map((purchase) => ({
        id: purchase.id,
        type: 'purchase' as const,
        date: purchase.date,
        details: purchase,
      }));

    // Combine and sort by date descending (newest first)
    return [...cropVisits, ...cropPurchases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };
  // Combined crop activity function
  const getCropActivities = (cropId: string) => {
    const cropVisits = getCropVisits(cropId).map((visit) => ({
      id: visit.id,
      type: 'visit' as const,
      date: visit.date,
      details: visit,
    }));

    const cropPurchases = getCropPurchases(cropId).map((purchase) => ({
      id: purchase.id,
      type: 'purchase' as const,
      date: purchase.date,
      details: purchase,
    }));

    // Combine and sort by date descending
    return [...cropVisits, ...cropPurchases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  return (
    <MockDataContext.Provider
      value={{
        farmers,
        visits,
        purchases,
        crops,
        addCrop,
        getCropById,
        addFarmer,
        updateFarmer,
        getFarmerById,
        addVisit,
        getFarmerVisits,
        getCropVisits,
        getVisitById,
        addPurchase,
        getFarmerPurchases,
        getCropPurchases,
        updatePurchase,
        getPurchaseById,
        getCropActivities,
        getFarmerCropActivities,
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
