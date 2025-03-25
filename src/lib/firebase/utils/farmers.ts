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
  startAt,
  endAt,
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
export const searchFarmers = async (
  searchTerm: string,
  searchField: string = 'name'
): Promise<Farmer[]> => {
  const farmersRef = collection(db, 'farmers');
  const normalizedSearchTerm = searchTerm.toLowerCase();
  const farmers: Farmer[] = [];

  // Different query strategy based on search field
  let q;

  // For Firebase, we can use where() with specific indexes
  // Note: You'll need to create composite indexes in Firebase for these queries
  switch (searchField) {
    case 'name':
      // Using orderBy and startAt/endAt for prefix search
      q = query(
        farmersRef,
        orderBy('name'),
        startAt(normalizedSearchTerm),
        endAt(normalizedSearchTerm + '\uf8ff'),
        limit(20)
      );
      break;
    case 'phone':
      q = query(
        farmersRef,
        orderBy('phone'),
        startAt(normalizedSearchTerm),
        endAt(normalizedSearchTerm + '\uf8ff'),
        limit(20)
      );
      break;
    case 'location':
      q = query(
        farmersRef,
        orderBy('location'),
        startAt(normalizedSearchTerm),
        endAt(normalizedSearchTerm + '\uf8ff'),
        limit(20)
      );
      break;
    case 'zone':
      q = query(
        farmersRef,
        orderBy('zone'),
        startAt(normalizedSearchTerm),
        endAt(normalizedSearchTerm + '\uf8ff'),
        limit(20)
      );
      break;
    case 'all':
      // For 'all' field search, we need multiple queries
      // Query by name first
      const nameQuerySnapshot = await getDocs(
        query(
          farmersRef,
          orderBy('name'),
          startAt(normalizedSearchTerm),
          endAt(normalizedSearchTerm + '\uf8ff'),
          limit(20)
        )
      );

      nameQuerySnapshot.forEach((doc) => {
        farmers.push(convertDoc<Farmer>(doc));
      });

      // Add results from phone query if we haven't reached 20 yet
      if (farmers.length < 20) {
        const phoneQuerySnapshot = await getDocs(
          query(
            farmersRef,
            orderBy('phone'),
            startAt(normalizedSearchTerm),
            endAt(normalizedSearchTerm + '\uf8ff'),
            limit(20 - farmers.length)
          )
        );

        phoneQuerySnapshot.forEach((doc) => {
          // Check for duplicates before adding
          if (!farmers.some((f) => f.id === doc.id)) {
            farmers.push(convertDoc<Farmer>(doc));
          }
        });
      }

      // Add results from location query if we haven't reached 20 yet
      if (farmers.length < 20) {
        const locationQuerySnapshot = await getDocs(
          query(
            farmersRef,
            orderBy('location'),
            startAt(normalizedSearchTerm),
            endAt(normalizedSearchTerm + '\uf8ff'),
            limit(20 - farmers.length)
          )
        );

        locationQuerySnapshot.forEach((doc) => {
          if (!farmers.some((f) => f.id === doc.id)) {
            farmers.push(convertDoc<Farmer>(doc));
          }
        });
      }

      // Add results from zone query if we haven't reached 20 yet
      if (farmers.length < 20) {
        const zoneQuerySnapshot = await getDocs(
          query(
            farmersRef,
            orderBy('zone'),
            startAt(normalizedSearchTerm),
            endAt(normalizedSearchTerm + '\uf8ff'),
            limit(20 - farmers.length)
          )
        );

        zoneQuerySnapshot.forEach((doc) => {
          if (!farmers.some((f) => f.id === doc.id)) {
            farmers.push(convertDoc<Farmer>(doc));
          }
        });
      }

      // Return early for 'all' search since we've already gathered the results
      return farmers;

    case 'crops':
      // For crops, we need a different approach as it's an array field
      // This is tricky in Firestore - we'll get a limited set and filter
      q = query(farmersRef, limit(50));
      const cropQuerySnapshot = await getDocs(q);

      cropQuerySnapshot.forEach((doc) => {
        const farmer = convertDoc<Farmer>(doc);
        if (
          farmer.crops &&
          farmer.crops.some((crop) =>
            crop.name.toLowerCase().includes(normalizedSearchTerm)
          )
        ) {
          farmers.push(farmer);
        }
      });

      // Return only the first 20 matching farmers for crops
      return farmers.slice(0, 20);

    default:
      // Default to name search
      q = query(
        farmersRef,
        orderBy('name'),
        startAt(normalizedSearchTerm),
        endAt(normalizedSearchTerm + '\uf8ff'),
        limit(20)
      );
  }

  // Execute the query for all cases except 'all' and 'crops' which are handled above
  if (searchField !== 'all' && searchField !== 'crops') {
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      farmers.push(convertDoc<Farmer>(doc));
    });
  }

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
// Create farmer
export const createFarmer = async (
  farmer: Omit<Farmer, 'id' | 'createdAt' | 'createdBy'>,
  userId: string
): Promise<string> => {
  // Process fields for search - convert to lowercase
  const processedFarmer = {
    ...farmer,
    name: farmer.name.toLowerCase(),
    phone: farmer.phone.toLowerCase(),
    location: farmer.location.toLowerCase(),
    zone: farmer.zone.toLowerCase(),
    // Process crop names if crops exist
    crops: farmer.crops
      ? farmer.crops.map((crop) => ({
          ...crop,
          name: crop.name.toLowerCase(),
        }))
      : [],
    // Keep original values for display
    displayName: farmer.name,
    displayLocation: farmer.location,
    displayZone: farmer.zone,
  };

  const farmerData = {
    ...processedFarmer,
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

  // Process the fields that are being updated
  const processedData = { ...data };

  // Convert text fields to lowercase if they exist in the update data
  if (data.name) {
    processedData.name = data.name.toLowerCase();
    processedData.displayName = data.name; // Keep original for display
  }

  if (data.phone) {
    processedData.phone = data.phone.toLowerCase();
  }

  if (data.location) {
    processedData.location = data.location.toLowerCase();
    processedData.displayLocation = data.location; // Keep original for display
  }

  if (data.zone) {
    processedData.zone = data.zone.toLowerCase();
    processedData.displayZone = data.zone; // Keep original for display
  }

  // Process crops if they're being updated
  if (data.crops) {
    processedData.crops = data.crops.map((crop) => ({
      ...crop,
      name: crop.name.toLowerCase(),
    }));
  }

  await updateDoc(docRef, {
    ...processedData,
    updatedAt: serverTimestamp(),
  });
};

// Delete farmer
export const deleteFarmer = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'farmers', id));
};
