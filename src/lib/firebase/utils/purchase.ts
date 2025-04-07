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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config';
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
  purchase: Omit<Purchase, 'id' | 'createdAt' | 'employeeId'>,
  userId: string
): Promise<string> => {
  const purchaseData = {
    ...purchase,
    employeeId: userId,
    createdAt: serverTimestamp(),
    // Ensure new fields are included
    isWorkingCombo: purchase.isWorkingCombo || false,
    images: purchase.images || [],
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

export const getPurchaseById = async (id: string): Promise<Purchase | null> => {
  try {
    const docRef = doc(db, 'purchases', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertDoc<Purchase>(docSnap);
    }

    return null;
  } catch (error) {
    console.error('Error fetching purchase by ID:', error);
    throw error;
  }
};

// Upload purchase images
export const uploadPurchaseImages = async (
  files: File[],
  purchaseId: string
): Promise<string[]> => {
  // Create an array of upload promises
  const uploadPromises = files.map(async (file, index) => {
    const fileExtension = file.name.split('.').pop();
    // Consider adding a timestamp or UUID for more unique filenames if needed
    const fileName = `image_${index}.${fileExtension}`;
    const storagePath = `purchases/${purchaseId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log(`Attempting to upload ${file.name} to ${storagePath}`); // Added log

    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log(`Uploaded ${file.name}, getting download URL...`); // Added log
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`Got download URL for ${file.name}: ${downloadUrl}`); // Added log
      return downloadUrl; // Return the URL from the async map callback
    } catch {
      // Catch specific errors if needed
      console.error(`Error uploading image ${file.name}`);
      // Decide how to handle individual file upload errors.
      // Option 1: Throw the error, failing the whole batch (Promise.all rejects)
      throw new Error(`Failed to upload ${file.name}`);
      // Option 2: Return null or a specific marker for failed uploads
      // return null;
    }
  });

  // Wait for all upload promises to settle (either resolve with URL or reject with error)
  try {
    const imageUrls = await Promise.all(uploadPromises);
    console.log('All uploads finished. URLs:', imageUrls);
    // If using Option 2 above, you might want to filter out nulls:
    // return imageUrls.filter(url => url !== null) as string[];
    return imageUrls;
  } catch (error) {
    console.error('One or more image uploads failed:', error);
    // Re-throw the error if you want the calling function (onSubmit) to catch it
    throw error;
  }
};
