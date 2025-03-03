// contexts/FirebaseContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, Farmer, Visit, Purchase, Crop, CropActivity } from '@/types';

// Import Firebase utilities
import {
  initPhoneAuth,
  verifyOtpAndSignIn,
  signOutUser,
} from '@/lib/firebase/utils/auth';
import {
  fetchFarmers,
  searchFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
} from '@/lib/firebase/utils/farmers';
import {
  getVisitsByFarmerId,
  getVisitsByFarmerAndCrop,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitById,
} from '@/lib/firebase/utils/visit';
import {
  getPurchasesByFarmerId,
  getPurchasesByFarmerAndCrop,
  createPurchase,
  updatePurchase,
  deletePurchase,
} from '@/lib/firebase/utils/purchase';
import {
  uploadImage,
  deleteImage,
  uploadFarmerImage,
  uploadVisitImages,
} from '@/lib/firebase/utils/storage';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getEmployees,
  getAdmins,
} from '@/lib/firebase/utils/user';
import {
  getCropActivity,
  getAllCropActivities,
  getRecentCropActivities,
} from '@/lib/firebase/utils/crop-activities';
import { getPendingOfflineOperationsCount } from '@/lib/utils';
import { addCrop, getCrops } from './utils/crops';

interface FirebaseContextType {
  // Authentication
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOnline: boolean;
  pendingOperationsCount: number;
  signInWithPhone: (phoneNumber: string) => Promise<string>;
  verifyOtp: (verificationId: string, otp: string) => Promise<User>;
  signOut: () => Promise<void>;

  // Farmers
  getFarmers: (lastDoc?: QueryDocumentSnapshot<DocumentData>) => Promise<{
    data: Farmer[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }>;
  searchFarmers: (searchTerm: string) => Promise<Farmer[]>;
  getFarmerById: (id: string) => Promise<Farmer | null>;
  createFarmer: (
    farmer: Omit<Farmer, 'id' | 'createdAt' | 'createdBy'>
  ) => Promise<string>;
  updateFarmer: (id: string, data: Partial<Farmer>) => Promise<void>;
  deleteFarmer: (id: string) => Promise<void>;

  // Visits
  getVisitsByFarmerId: (farmerId: string) => Promise<Visit[]>;

  getVisitById: (id: string) => Promise<Visit | null>;
  getVisitsByFarmerAndCrop: (
    farmerId: string,
    cropId: string
  ) => Promise<Visit[]>;
  createVisit: (visit: Omit<Visit, 'id' | 'createdAt'>) => Promise<string>;
  updateVisit: (id: string, data: Partial<Visit>) => Promise<void>;
  deleteVisit: (id: string) => Promise<void>;

  // Purchases
  getPurchasesByFarmerId: (farmerId: string) => Promise<Purchase[]>;
  createPurchase: (
    purchase: Omit<Purchase, 'id' | 'createdAt'>
  ) => Promise<string>;
  getPurchasesByFarmerAndCrop: (
    farmerId: string,
    cropId: string
  ) => Promise<Purchase[]>;
  updatePurchase: (id: string, data: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;

  //crops
  getCrops: () => Promise<Crop[]>;
  addCrop: (name: string) => Promise<Crop>;
  // Crop Activities
  getCropActivity: (
    farmerId: string,
    cropId: string
  ) => Promise<CropActivity[]>;
  getAllCropActivities: (
    farmerId: string,
    crops: Crop[]
  ) => Promise<{ [cropId: string]: CropActivity[] }>;
  getRecentCropActivities: (
    farmerId: string,
    crops: Crop[]
  ) => Promise<CropActivity[]>;

  // Image handling
  uploadImage: (file: File, path: string) => Promise<string>;
  deleteImage: (url: string) => Promise<void>;
  uploadFarmerImage: (file: File, farmerId: string) => Promise<string>;
  uploadVisitImages: (files: File[], visitId: string) => Promise<string[]>;

  // Users
  getUsers: () => Promise<User[]>;
  getUserById: (id: string) => Promise<User | null>;
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<string>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getEmployees: () => Promise<User[]>;
  getAdmins: () => Promise<User[]>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOperationsCount, setPendingOperationsCount] =
    useState<number>(0);

  // Listen for online/offline status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial online status
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Check for pending offline operations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkPendingOperations = () => {
        const count = getPendingOfflineOperationsCount();
        setPendingOperationsCount(count);
      };

      // Check initially
      checkPendingOperations();

      // Check whenever we come back online
      const handleOnline = () => {
        checkPendingOperations();
        // Here you could also add logic to process pending operations
      };

      window.addEventListener('online', handleOnline);

      return () => {
        window.removeEventListener('online', handleOnline);
      };
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user data from our users collection
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              id: userDoc.id,
              name: userData.name,
              phone: userData.phone,
              role: userData.role,
              createdAt: userData.createdAt,
            });
          } else {
            // User authenticated but not in our database
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Authentication error. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Wrap authentication methods to handle errors
  const signInWithPhone = async (phoneNumber: string): Promise<string> => {
    setError(null);
    try {
      return await initPhoneAuth(phoneNumber);
    } catch (err) {
      console.error('Error in phone authentication:', err);
      setError('Failed to send verification code.');
      throw err;
    }
  };

  const verifyOtp = async (
    verificationId: string,
    otp: string
  ): Promise<User> => {
    setError(null);
    try {
      const user = await verifyOtpAndSignIn(verificationId, otp);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify code.');
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await signOutUser();
      setCurrentUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out.');
      throw err;
    }
  };

  // Context value with all the Firebase operations
  const value: FirebaseContextType = {
    // Authentication
    currentUser,
    loading,
    error,
    isAdmin,
    isOnline,
    pendingOperationsCount,
    signInWithPhone,
    verifyOtp,
    signOut,

    // Farmers
    getFarmers: (lastDoc) => fetchFarmers(lastDoc),
    searchFarmers,
    getFarmerById,
    createFarmer: (farmer) => {
      if (!currentUser)
        throw new Error('You must be logged in to create a farmer');
      return createFarmer(farmer, currentUser.id);
    },
    updateFarmer,
    deleteFarmer,

    // Visits
    getVisitsByFarmerId,
    getVisitById,
    getVisitsByFarmerAndCrop,
    createVisit: (visit) => {
      if (!currentUser)
        throw new Error('You must be logged in to create a visit');
      return createVisit(visit, currentUser.id);
    },
    updateVisit,
    deleteVisit,

    // Purchases
    getPurchasesByFarmerId,
    getPurchasesByFarmerAndCrop,
    createPurchase: (purchase) => {
      if (!currentUser)
        throw new Error('You must be logged in to create a purchase');
      return createPurchase(purchase, currentUser.id);
    },
    updatePurchase,
    deletePurchase,
    //crops
    getCrops,
    addCrop,
    // Crop Activities
    getCropActivity,
    getAllCropActivities,
    getRecentCropActivities,

    // Image handling
    uploadImage,
    deleteImage,
    uploadFarmerImage,
    uploadVisitImages,

    // Users
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getEmployees,
    getAdmins,
  };

  return (
    <FirebaseContext.Provider value={value}>
      <div id="recaptcha-container"></div>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
};
