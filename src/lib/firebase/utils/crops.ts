// lib/firebase/utils/crops.ts
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { Crop } from '@/types';
import { convertDoc } from '../../utils';

/**
 * Fetches all crops from Firestore
 * @returns Array of crops
 */
export const getCrops = async (): Promise<Crop[]> => {
  try {
    const cropsRef = collection(db, 'crops');
    const q = query(cropsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);

    const crops: Crop[] = [];
    querySnapshot.forEach((doc) => {
      crops.push(convertDoc<Crop>(doc));
    });

    return crops;
  } catch (error) {
    console.error('Error fetching crops:', error);
    throw error;
  }
};

/**
 * Adds a new crop to Firestore
 * @param name The name of the crop
 * @returns The created crop object
 */
export const addCrop = async (name: string): Promise<Crop> => {
  try {
    const cropData = {
      name,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'crops'), cropData);

    // Return the new crop with its ID
    return {
      id: docRef.id,
      name,
    };
  } catch (error) {
    console.error('Error adding crop:', error);
    throw error;
  }
};

/**
 * Gets a crop by ID
 * @param id The crop ID
 * @returns The crop or null if not found
 */
export const getCropById = async (id: string): Promise<Crop | null> => {
  try {
    const docRef = doc(db, 'crops', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertDoc<Crop>(docSnap);
    }

    return null;
  } catch (error) {
    console.error('Error fetching crop by ID:', error);
    throw error;
  }
};

/**
 * Updates a crop
 * @param id The crop ID
 * @param data The data to update
 */
export const updateCrop = async (
  id: string,
  data: Partial<Crop>
): Promise<void> => {
  try {
    const docRef = doc(db, 'crops', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating crop:', error);
    throw error;
  }
};

/**
 * Deletes a crop
 * @param id The crop ID to delete
 */
export const deleteCrop = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'crops', id));
  } catch (error) {
    console.error('Error deleting crop:', error);
    throw error;
  }
};
