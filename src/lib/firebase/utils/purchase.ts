// lib/firebase/purchases.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { Purchase } from '@/types';
import { convertDoc } from '../../utils';

// Get purchases by farmer ID
export const getPurchasesByFarmerId = async (
  farmerId: string
): Promise<Purchase[]> => {
  const purchasesRef = collection(db, 'purchases');
  const q = query(
    purchasesRef,
    where('farmerId', '==', farmerId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const purchases: Purchase[] = [];

  querySnapshot.forEach((doc) => {
    purchases.push(convertDoc<Purchase>(doc));
  });

  return purchases;
};

// Get purchases by farmer ID and crop ID
export const getPurchasesByFarmerAndCrop = async (
  farmerId: string,
  cropId: string
): Promise<Purchase[]> => {
  const purchasesRef = collection(db, 'purchases');
  const q = query(
    purchasesRef,
    where('farmerId', '==', farmerId),
    where('crop.id', '==', cropId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const purchases: Purchase[] = [];

  querySnapshot.forEach((doc) => {
    purchases.push(convertDoc<Purchase>(doc));
  });

  return purchases;
};

// Create new purchase
export const createPurchase = async (
  purchase: Omit<Purchase, 'id' | 'createdAt'>,
  userId: string
): Promise<string> => {
  const purchaseData = {
    ...purchase,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'purchases'), purchaseData);

  // Update the farmer's total due and total paid
  const farmerRef = doc(db, 'farmers', purchase.farmerId);
  const farmerDoc = await getDoc(farmerRef);

  if (farmerDoc.exists()) {
    const farmerData = farmerDoc.data();
    await updateDoc(farmerRef, {
      totalDue: (farmerData.totalDue || 0) + purchase.remainingAmount,
      totalPaid: (farmerData.totalPaid || 0) + purchase.amountPaid,
    });
  }

  return docRef.id;
};

// Update purchase
export const updatePurchase = async (
  id: string,
  data: Partial<Purchase>
): Promise<void> => {
  // Get the original purchase to calculate payment differences
  const purchaseRef = doc(db, 'purchases', id);
  const purchaseDoc = await getDoc(purchaseRef);

  if (!purchaseDoc.exists()) {
    throw new Error('Purchase not found');
  }

  const originalPurchase = purchaseDoc.data() as Purchase;

  // Update the purchase
  await updateDoc(purchaseRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // If payment amounts changed, update farmer totals
  if (data.amountPaid !== undefined || data.remainingAmount !== undefined) {
    const farmerRef = doc(db, 'farmers', originalPurchase.farmerId);
    const farmerDoc = await getDoc(farmerRef);

    if (farmerDoc.exists()) {
      const farmerData = farmerDoc.data();
      const updates = {
        totalPaid: farmerData.totalPaid,
        totalDue: farmerData.totalDue,
      };

      if (data.amountPaid !== undefined) {
        const paidDifference = data.amountPaid - originalPurchase.amountPaid;
        updates.totalPaid = (farmerData.totalPaid || 0) + paidDifference;
      }

      if (data.remainingAmount !== undefined) {
        const dueDifference =
          data.remainingAmount - originalPurchase.remainingAmount;
        updates.totalDue = (farmerData.totalDue || 0) + dueDifference;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(farmerRef, updates);
      }
    }
  }
};

// Delete purchase
export const deletePurchase = async (id: string): Promise<void> => {
  // Get the purchase to update farmer totals
  const purchaseRef = doc(db, 'purchases', id);
  const purchaseDoc = await getDoc(purchaseRef);

  if (purchaseDoc.exists()) {
    const purchaseData = purchaseDoc.data() as Purchase;

    // Update the farmer's totals
    const farmerRef = doc(db, 'farmers', purchaseData.farmerId);
    const farmerDoc = await getDoc(farmerRef);

    if (farmerDoc.exists()) {
      const farmerData = farmerDoc.data();
      await updateDoc(farmerRef, {
        totalDue: (farmerData.totalDue || 0) - purchaseData.remainingAmount,
        totalPaid: (farmerData.totalPaid || 0) - purchaseData.amountPaid,
      });
    }
  }

  // Delete the purchase
  await deleteDoc(purchaseRef);
};
