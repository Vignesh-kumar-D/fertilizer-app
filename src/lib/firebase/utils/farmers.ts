// lib/firebase/farmers.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config';
import { Farmer } from '@/types';
import { convertDoc } from '../../utils';

// Get paginated farmers
export const fetchFarmers = async (
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) => {
  const farmersRef = collection(db, 'farmers');
  let q = query(farmersRef, orderBy('name'), limit(20));

  if (lastDoc) {
    q = query(farmersRef, orderBy('name'), startAfter(lastDoc), limit(20));
  }

  const querySnapshot = await getDocs(q);
  const farmers: Farmer[] = [];
  let lastVisible = null;

  if (!querySnapshot.empty) {
    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    querySnapshot.forEach((doc) => {
      farmers.push(convertDoc<Farmer>(doc));
    });
  }

  return { data: farmers, lastDoc: lastVisible };
};

// Search farmers by name
export const searchFarmers = async (searchTerm: string): Promise<Farmer[]> => {
  const farmersRef = collection(db, 'farmers');
  // Search by name starting with searchTerm

  // const q = query(
  //   farmersRef,
  //   orderBy('name'),
  //   startAt(searchTerm),
  //   endAt(searchTerm + '\uf8ff'),
  //   limit(20)
  // );
  //  querySnapshot.forEach((doc) => {
  //   farmers.push(convertDoc<Farmer>(doc));
  // });
  // // this query search for name in DB but it is case sensitive, so added a different method for now. should be updated later.

  const q = query(farmersRef, limit(200));
  const querySnapshot = await getDocs(q);
  const farmers: Farmer[] = [];

  // Perform case-insensitive filtering in memory
  const normalizedSearchTerm = searchTerm.toLowerCase();

  querySnapshot.forEach((doc) => {
    const farmer = convertDoc<Farmer>(doc);
    if (farmer.name.toLowerCase().includes(normalizedSearchTerm)) {
      farmers.push(farmer);
    }
  });
  return farmers;
};

// Get farmer by ID
export const getFarmerById = async (id: string): Promise<Farmer | null> => {
  const docRef = doc(db, 'farmers', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return convertDoc<Farmer>(docSnap);
  }

  return null;
};

// Create new farmer
export const createFarmer = async (
  farmer: Omit<Farmer, 'id' | 'createdAt' | 'createdBy'>,
  userId: string
): Promise<string> => {
  const farmerData = {
    ...farmer,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'farmers'), farmerData);
  return docRef.id;
};

// Update farmer
export const updateFarmer = async (
  id: string,
  data: Partial<Farmer>
): Promise<void> => {
  const docRef = doc(db, 'farmers', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete farmer
export const deleteFarmer = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'farmers', id));
};
