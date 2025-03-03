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
} from 'firebase/firestore';
import { db } from '../config';
import { Visit } from '@/types';
import { convertDoc } from '../../utils';

// Get visits by farmer ID
export const getVisitsByFarmerId = async (
  farmerId: string
): Promise<Visit[]> => {
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
// Get visits by farmer ID and crop ID
export const getVisitsByFarmerAndCrop = async (
  farmerId: string,
  cropId: string
): Promise<Visit[]> => {
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

// Create new visit
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

  // Update the farmer's lastVisitDate
  await updateDoc(doc(db, 'farmers', visit.farmerId), {
    lastVisitDate: serverTimestamp(),
  });

  return docRef.id;
};

// Update visit
export const updateVisit = async (
  id: string,
  data: Partial<Visit>
): Promise<void> => {
  const docRef = doc(db, 'visits', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete visit
export const deleteVisit = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'visits', id));
};
