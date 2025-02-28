import { Crop, Farmer, Purchase, Visit } from '.';

export interface MockDataContextType {
  farmers: Farmer[];
  visits: Visit[];
  purchases: Purchase[];
  crops: Crop[]; // Added crops array

  // Crop functions
  addCrop: (crop: Omit<Crop, 'id'>) => void;
  getCropById: (id: string) => Crop | undefined;

  // Farmer functions
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

  // Visit functions
  addVisit: (visit: Omit<Visit, 'id' | 'createdAt' | 'employeeId'>) => void;
  getFarmerVisits: (farmerId: string) => Visit[];
  getCropVisits: (cropId: string) => Visit[];
  getVisitById: (id: string) => Visit | undefined;

  // Purchase functions
  addPurchase: (
    purchase: Omit<Purchase, 'id' | 'createdAt' | 'createdBy'>
  ) => void;
  getFarmerPurchases: (farmerId: string) => Purchase[];
  getCropPurchases: (cropId: string) => Purchase[];
  updatePurchase: (id: string, updates: Partial<Purchase>) => void;
  getPurchaseById: (id: string) => Purchase | undefined;

  // Combined crop activity function
  getCropActivities: (cropId: string) => Array<{
    id: string;
    type: 'visit' | 'purchase';
    date: string;
    details: Visit | Purchase;
  }>;
  getFarmerCropActivities: (
    farmerId: string,
    cropId: string
  ) => Array<{
    id: string;
    type: 'visit' | 'purchase';
    date: string;
    details: Visit | Purchase;
  }>;
}
