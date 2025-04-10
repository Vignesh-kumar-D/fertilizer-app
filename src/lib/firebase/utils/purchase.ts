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
  Timestamp, // <-- Ensure Timestamp is imported
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config'; // <-- Adjust path if needed
import { Purchase } from '@/types'; // <-- Adjust path if needed
import { convertDoc } from '../../utils'; // <-- Adjust path if needed

// --- Helper Function for Conditional Purchase Date Update ---
/**
 * Fetches a farmer and updates their lastPurchaseDate field only if the
 * provided purchase date is later than the existing lastPurchaseDate.
 * @param farmerId The ID of the farmer document to update.
 * @param purchaseDateString The date of the purchase in "YYYY-MM-DD" string format.
 */
const conditionallyUpdateLastPurchaseDate = async (
  farmerId: string,
  purchaseDateString: string
): Promise<void> => {
  // Basic validation
  if (!farmerId || !purchaseDateString) {
    console.warn(
      '[conditionallyUpdateLastPurchaseDate] Missing farmerId or purchaseDateString.'
    );
    return;
  }

  const farmerRef = doc(db, 'farmers', farmerId);

  try {
    // Create Timestamp from the new purchase date string (start of day UTC)
    const newPurchaseDateJS = new Date(purchaseDateString + 'T00:00:00Z');
    // Validate the parsed date
    if (isNaN(newPurchaseDateJS.getTime())) {
      throw new Error(`Invalid date string provided: ${purchaseDateString}`);
    }
    const newPurchaseTimestamp = Timestamp.fromDate(newPurchaseDateJS);

    // Get current farmer data
    const farmerSnap = await getDoc(farmerRef);

    if (farmerSnap.exists()) {
      const farmerData = farmerSnap.data();
      // Get existing date (will be Firestore Timestamp or null/undefined)
      const existingLastPurchaseTimestamp = farmerData.lastPurchaseDate;

      let shouldUpdate = true; // Assume update needed unless proven otherwise

      // Compare if existing date exists and is a valid Timestamp
      if (existingLastPurchaseTimestamp instanceof Timestamp) {
        // Firestore Timestamps can be compared directly
        // Update only if newPurchaseTimestamp represents a strictly later time
        if (
          newPurchaseTimestamp.seconds < existingLastPurchaseTimestamp.seconds
        ) {
          shouldUpdate = false;
        } else if (
          newPurchaseTimestamp.seconds ===
            existingLastPurchaseTimestamp.seconds &&
          newPurchaseTimestamp.nanoseconds <=
            existingLastPurchaseTimestamp.nanoseconds
        ) {
          // If dates (seconds) are the same, don't update unless new time part is strictly later (unlikely needed here)
          shouldUpdate = false;
        }
      }
      // If existingLastPurchaseTimestamp is not a Timestamp, shouldUpdate remains true

      // Perform conditional update
      if (shouldUpdate) {
        console.log(
          `Updating lastPurchaseDate for farmer ${farmerId} to ${purchaseDateString}`
        );
        await updateDoc(farmerRef, {
          lastPurchaseDate: newPurchaseTimestamp, // Update with the new Firestore Timestamp
        });
      } else {
        console.log(
          `No update needed for lastPurchaseDate for farmer ${farmerId}. Existing: ${existingLastPurchaseTimestamp
            ?.toDate()
            ?.toISOString()}, New: ${purchaseDateString}`
        );
      }
    } else {
      console.warn(
        `[conditionallyUpdateLastPurchaseDate] Farmer document ${farmerId} not found.`
      );
    }
  } catch (error) {
    console.error(
      `[conditionallyUpdateLastPurchaseDate] Error updating lastPurchaseDate for farmer ${farmerId}:`,
      error
    );
    // Decide if you want to re-throw or just log
    // throw error;
  }
};

// --- Firestore Functions ---

/** Get purchases by farmer ID, ordered by date descending */
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

/** Get purchases by farmer ID and crop ID, ordered by date descending */
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

/** Get a single purchase by its document ID */
export const getPurchaseById = async (id: string): Promise<Purchase | null> => {
  try {
    const docRef = doc(db, 'purchases', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertDoc<Purchase>(docSnap);
    }
    console.warn(`Purchase with ID ${id} not found.`);
    return null;
  } catch (error) {
    console.error('Error fetching purchase by ID:', error);
    throw error; // Re-throw error for caller to handle
  }
};

/** Create a new purchase document and update farmer totals/last purchase date */
export const createPurchase = async (
  purchase: Omit<Purchase, 'id' | 'createdAt' | 'employeeId'>,
  userId: string // Assuming employeeId comes from logged-in user ID
): Promise<string> => {
  const purchaseData = {
    ...purchase,
    employeeId: userId,
    createdAt: serverTimestamp(),
    isWorkingCombo: purchase.isWorkingCombo ?? false, // Ensure default value
    images: purchase.images ?? [], // Ensure default value
  };

  // 1. Create the Purchase document
  const docRef = await addDoc(collection(db, 'purchases'), purchaseData);

  // 2. Update the farmer's total due and total paid
  const farmerRef = doc(db, 'farmers', purchase.farmerId);
  try {
    const farmerDoc = await getDoc(farmerRef);
    if (farmerDoc.exists()) {
      const farmerData = farmerDoc.data();
      await updateDoc(farmerRef, {
        totalDue: (farmerData.totalDue || 0) + (purchase.remainingAmount || 0),
        totalPaid: (farmerData.totalPaid || 0) + (purchase.amountPaid || 0),
      });
    }
  } catch (error) {
    console.error(
      `[createPurchase] Failed to update farmer totals for new purchase ${docRef.id}:`,
      error
    );
    // Non-fatal error for farmer update, purchase was still created
  }

  // 3. Conditionally update the farmer's lastPurchaseDate
  await conditionallyUpdateLastPurchaseDate(purchase.farmerId, purchase.date);

  return docRef.id;
};

/** Update an existing purchase document and update farmer totals/last purchase date */
export const updatePurchase = async (
  id: string, // Purchase ID
  data: Partial<Purchase> // Fields to update (MUST NOT include id, createdAt)
): Promise<void> => {
  const purchaseRef = doc(db, 'purchases', id);

  // 1. Get the original purchase BEFORE updating
  const purchaseDoc = await getDoc(purchaseRef);
  if (!purchaseDoc.exists()) {
    throw new Error(`Purchase with ID ${id} not found`);
  }
  const originalPurchase = convertDoc<Purchase>(purchaseDoc); // Use convertDoc if needed

  // 2. Update the purchase document
  await updateDoc(purchaseRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // 3. Update farmer totals IF relevant fields changed
  const farmerIdToUpdate = data.farmerId || originalPurchase.farmerId;
  // Check if amounts, remaining amount, total amount or farmerId changed
  const paymentRelatedChange =
    data.amountPaid !== undefined ||
    data.remainingAmount !== undefined ||
    data.totalAmount !== undefined;
  const farmerChanged =
    data.farmerId && data.farmerId !== originalPurchase.farmerId;

  if (paymentRelatedChange || farmerChanged) {
    const farmerRef = doc(db, 'farmers', farmerIdToUpdate);
    try {
      const farmerDoc = await getDoc(farmerRef);
      if (farmerDoc.exists()) {
        const farmerData = farmerDoc.data();
        const paymentUpdates: { totalPaid?: number; totalDue?: number } = {};

        // Calculate differences based on final values after update
        const finalData = { ...originalPurchase, ...data }; // Merge original with updates
        // Recalculate remaining if not explicitly provided in update
        if (
          data.remainingAmount === undefined &&
          (data.totalAmount !== undefined || data.amountPaid !== undefined)
        ) {
          finalData.remainingAmount =
            (finalData.totalAmount || 0) - (finalData.amountPaid || 0);
        }

        const paidDifference =
          (finalData.amountPaid || 0) - (originalPurchase.amountPaid || 0);
        const dueDifference =
          (finalData.remainingAmount || 0) -
          (originalPurchase.remainingAmount || 0);

        // Apply differences to current farmer data
        paymentUpdates.totalPaid = (farmerData.totalPaid || 0) + paidDifference;
        paymentUpdates.totalDue = (farmerData.totalDue || 0) + dueDifference;

        // Ensure calculations are valid numbers before updating

        await updateDoc(farmerRef, paymentUpdates);

        // Handle case where farmerId changed: Adjust old farmer's totals
        if (farmerChanged) {
          const oldFarmerRef = doc(db, 'farmers', originalPurchase.farmerId);
          const oldFarmerDoc = await getDoc(oldFarmerRef);
          if (oldFarmerDoc.exists()) {
            const oldFarmerData = oldFarmerDoc.data();
            const oldFarmerUpdates = {
              totalPaid: Math.max(
                0,
                (oldFarmerData.totalPaid || 0) -
                  (originalPurchase.amountPaid || 0)
              ),
              totalDue: Math.max(
                0,
                (oldFarmerData.totalDue || 0) -
                  (originalPurchase.remainingAmount || 0)
              ),
            };
            await updateDoc(oldFarmerRef, oldFarmerUpdates);
            console.log(
              `Adjusted totals for original farmer ${originalPurchase.farmerId}`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `[updatePurchase] Failed to update farmer totals for purchase ${id}:`,
        error
      );
    }
  }

  // 4. Conditionally update farmer's lastPurchaseDate IF date was updated
  if (data.date) {
    // Use farmerIdToUpdate determined earlier
    await conditionallyUpdateLastPurchaseDate(farmerIdToUpdate, data.date);
  }
};

/** Delete a purchase document and update farmer totals */
export const deletePurchase = async (id: string): Promise<void> => {
  const purchaseRef = doc(db, 'purchases', id);
  let purchaseData: Purchase | null = null;

  // Get purchase data before deleting
  try {
    const purchaseDoc = await getDoc(purchaseRef);
    if (purchaseDoc.exists()) {
      purchaseData = convertDoc<Purchase>(purchaseDoc); // Use convertDoc if needed
    }
  } catch (error) {
    console.error(
      `[deletePurchase] Failed to get purchase ${id} before deleting:`,
      error
    );
  }

  // Delete the purchase
  await deleteDoc(purchaseRef);

  // Update farmer totals if purchase data was retrieved
  if (purchaseData) {
    const farmerRef = doc(db, 'farmers', purchaseData.farmerId);
    try {
      const farmerDoc = await getDoc(farmerRef);
      if (farmerDoc.exists()) {
        const farmerData = farmerDoc.data();
        // Subtract the deleted purchase's contribution, ensuring non-negative totals
        await updateDoc(farmerRef, {
          totalDue: Math.max(
            0,
            (farmerData.totalDue || 0) - (purchaseData.remainingAmount || 0)
          ),
          totalPaid: Math.max(
            0,
            (farmerData.totalPaid || 0) - (purchaseData.amountPaid || 0)
          ),
        });
      }
    } catch (error) {
      console.error(
        `[deletePurchase] Failed to update farmer totals after deleting purchase ${id}:`,
        error
      );
    }
    // Note: Recalculating lastPurchaseDate accurately after delete is complex and not implemented.
    // It would require finding the next most recent purchase for that farmer.
  }
};

// --- Storage Function ---

/** Upload multiple images for a purchase to Firebase Storage */
export const uploadPurchaseImages = async (
  files: File[],
  purchaseId: string
): Promise<string[]> => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map(async (file, index) => {
    const fileExtension = file.name.split('.').pop() || 'jpg'; // Default extension
    const fileName = `image_${index}_${Date.now()}.${fileExtension}`; // More unique name
    const storagePath = `purchases/${purchaseId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log(`Uploading ${file.name} to ${storagePath}`);
    try {
      // Consider adding metadata like contentType: file.type
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`Uploaded ${file.name}, URL: ${downloadUrl}`);
      return downloadUrl;
    } catch (error) {
      console.error(`Error uploading image ${file.name}:`, error);
      // Throw a more specific error to be caught by Promise.all
      throw new Error(`Failed to upload ${file.name}:'Upload error'}`);
    }
  });

  // Wait for all uploads to complete or one to fail
  try {
    const imageUrls = await Promise.all(uploadPromises);
    console.log('All purchase images uploaded successfully.');
    return imageUrls; // Should be string[]
  } catch (error) {
    console.error(
      '[uploadPurchaseImages] One or more image uploads failed:',
      error
    );
    // Re-throw the error so the calling function (e.g., form submit) knows about the failure
    throw error;
  }
};
