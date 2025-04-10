// lib/firebase/visits.ts
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  Timestamp, // <-- Import Timestamp
} from 'firebase/firestore';
import { db } from '../config'; // <-- Ensure correct path to db config
import { Visit } from '@/types'; // <-- Ensure correct path to types
import { convertDoc } from '../../utils'; // <-- Ensure correct path to utils

// --- Helper Function for Conditional Update ---
/**
 * Fetches a farmer and updates their lastVisitDate field only if the
 * provided visit date is later than the existing lastVisitDate.
 * @param farmerId The ID of the farmer document to update.
 * @param visitDateString The date of the visit in "YYYY-MM-DD" string format.
 */
const conditionallyUpdateLastVisitDate = async (
  farmerId: string,
  visitDateString: string
): Promise<void> => {
  if (!farmerId || !visitDateString) {
    console.warn(
      'Missing farmerId or visitDateString for lastVisitDate update.'
    );
    return;
  }

  const farmerRef = doc(db, 'farmers', farmerId);

  try {
    // Create Timestamp from the new visit date string (start of day UTC)
    const newVisitDateJS = new Date(visitDateString + 'T00:00:00Z');
    if (isNaN(newVisitDateJS.getTime())) {
      throw new Error(`Invalid date string provided: ${visitDateString}`);
    }
    const newVisitTimestamp = Timestamp.fromDate(newVisitDateJS);

    // Get current farmer data
    const farmerSnap = await getDoc(farmerRef);

    if (farmerSnap.exists()) {
      const farmerData = farmerSnap.data();
      const existingLastVisitTimestamp = farmerData.lastVisitDate; // Firestore Timestamp or undefined

      let shouldUpdate = true;

      // Compare if existing date exists and is a Timestamp
      if (existingLastVisitTimestamp instanceof Timestamp) {
        // Update only if newVisitTimestamp represents a strictly later time
        if (newVisitTimestamp.seconds < existingLastVisitTimestamp.seconds) {
          shouldUpdate = false;
        } else if (
          newVisitTimestamp.seconds === existingLastVisitTimestamp.seconds &&
          newVisitTimestamp.nanoseconds <=
            existingLastVisitTimestamp.nanoseconds
        ) {
          shouldUpdate = false;
        }
      }

      // Perform conditional update
      if (shouldUpdate) {
        console.log(
          `Updating lastVisitDate for farmer ${farmerId} to ${visitDateString}`
        );
        await updateDoc(farmerRef, {
          lastVisitDate: newVisitTimestamp, // Update with the new Timestamp
        });
      } else {
        console.log(
          `No update needed for lastVisitDate for farmer ${farmerId}. Existing: ${existingLastVisitTimestamp
            ?.toDate()
            ?.toISOString()}, New: ${visitDateString}`
        );
      }
    } else {
      console.warn(
        `Farmer document ${farmerId} not found while trying to update lastVisitDate.`
      );
    }
  } catch (error) {
    console.error(
      `Error conditionally updating lastVisitDate for farmer ${farmerId}:`,
      error
    );
    // Optional: Re-throw or handle more gracefully (e.g., log to monitoring service)
    // throw error; // Or don't throw to allow main operation (create/update visit) to potentially succeed
  }
};

// --- Existing Functions (getVisitsByFarmerId, etc.) ---

export const getVisitsByFarmerId = async (
  farmerId: string
): Promise<Visit[]> => {
  // ... existing code ...
  const visitsRef = collection(db, 'visits');
  const q = query(
    visitsRef,
    where('farmerId', '==', farmerId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  const visits: Visit[] = [];
  querySnapshot.forEach((doc) => {
    visits.push(convertDoc<Visit>(doc));
  });
  return visits;
};

export const getVisitById = async (id: string): Promise<Visit | null> => {
  // ... existing code ...
  try {
    const docRef = doc(db, 'visits', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertDoc<Visit>(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching visit by ID:', error);
    throw error;
  }
};

export const getVisitsByFarmerAndCrop = async (
  farmerId: string,
  cropId: string
): Promise<Visit[]> => {
  // ... existing code ...
  const visitsRef = collection(db, 'visits');
  const q = query(
    visitsRef,
    where('farmerId', '==', farmerId),
    where('crop.id', '==', cropId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  const visits: Visit[] = [];
  querySnapshot.forEach((doc) => {
    visits.push(convertDoc<Visit>(doc));
  });
  return visits;
};

// --- MODIFIED Create new visit ---
export const createVisit = async (
  visit: Omit<Visit, 'id' | 'createdAt'>,
  employeeId: string
): Promise<string> => {
  const visitData = {
    ...visit,
    employeeId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'visits'), visitData);

  // --- Conditionally update the farmer's lastVisitDate ---
  // Use await to ensure this completes before function returns (optional, depending on desired behavior)
  await conditionallyUpdateLastVisitDate(visit.farmerId, visit.date);

  return docRef.id;
};

// --- MODIFIED Update visit ---
export const updateVisit = async (
  id: string, // Visit ID
  data: Partial<Visit> // Only fields to update
): Promise<void> => {
  const visitDocRef = doc(db, 'visits', id);

  // Perform the main visit update
  await updateDoc(visitDocRef, {
    ...data,
    updatedAt: serverTimestamp(), // Add/update 'updatedAt' timestamp
  });

  // --- Conditionally update farmer's lastVisitDate IF date was part of the update ---
  // We need the farmerId. Best way is often to fetch the original visit doc
  // if farmerId isn't reliably included in 'data' or passed separately.
  if (data.date) {
    try {
      const originalVisitSnap = await getDoc(visitDocRef);
      if (originalVisitSnap.exists()) {
        const originalVisitData = originalVisitSnap.data() as Visit; // Assume type
        const farmerId = data.farmerId || originalVisitData.farmerId; // Use farmerId from update data if provided, else original
        if (farmerId) {
          await conditionallyUpdateLastVisitDate(farmerId, data.date);
        } else {
          console.warn(
            `Could not determine farmerId for visit ${id} during update.`
          );
        }
      } else {
        console.warn(
          `Original visit document ${id} not found when trying to update farmer's lastVisitDate.`
        );
      }
    } catch (error) {
      console.error(
        `Error fetching original visit ${id} to update farmer's lastVisitDate:`,
        error
      );
      // Decide if this error should prevent the update call from succeeding
    }
  }
  // Note: If the farmerId itself is changed during an update, the logic might need
  // to potentially check/update the lastVisitDate for BOTH the old and new farmer.
  // The current logic assumes farmerId doesn't change or uses the one from `data` if provided.
};

// --- Existing Delete visit ---
export const deleteVisit = async (id: string): Promise<void> => {
  // Note: Deleting a visit might require recalculating the farmer's lastVisitDate
  // by finding the *next latest* visit. This is more complex and depends on requirements.
  // For now, we just delete the visit document.
  await deleteDoc(doc(db, 'visits', id));
};
