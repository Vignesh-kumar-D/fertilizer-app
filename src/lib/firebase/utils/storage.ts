// lib/firebase/storage.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config';

// Upload an image to Firebase Storage
export const uploadImage = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (err) {
    console.error('Error uploading image:', err);
    throw err;
  }
};

// Delete an image from Firebase Storage
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.error('Error deleting image:', err);
    throw err;
  }
};

// Upload a farmer profile image
export const uploadFarmerImage = async (
  file: File,
  farmerId: string
): Promise<string> => {
  const path = `farmers/${farmerId}/profile.${file.name.split('.').pop()}`;
  return uploadImage(file, path);
};

// Upload a visit image
export const uploadVisitImage = async (
  file: File,
  visitId: string,
  index: number
): Promise<string> => {
  const path = `visits/${visitId}/image_${index}.${file.name.split('.').pop()}`;
  return uploadImage(file, path);
};

// Upload multiple visit images
export const uploadVisitImages = async (
  files: File[],
  visitId: string
): Promise<string[]> => {
  const uploadPromises = files.map((file, index) =>
    uploadVisitImage(file, visitId, index)
  );

  return Promise.all(uploadPromises);
};
