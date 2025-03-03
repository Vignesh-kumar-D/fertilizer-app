// lib/firebase/utils/storage.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
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
    // This assumes your URL is in the Firebase Storage format
    // For example: https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/path%2Fto%2Fimage.jpg?alt=...
    const pathStartIndex = url.indexOf('/o/') + 3;
    const pathEndIndex = url.indexOf('?', pathStartIndex);

    if (pathStartIndex > 2 && pathEndIndex > pathStartIndex) {
      let path = url.substring(pathStartIndex, pathEndIndex);
      // Decode URL-encoded path
      path = decodeURIComponent(path);

      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } else {
      throw new Error('Invalid storage URL format');
    }
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
  try {
    const extension = file.name.split('.').pop() || 'jpeg';
    const path = `farmers/${farmerId}/profile.${extension}`;
    return uploadImage(file, path);
  } catch (error) {
    console.error('Error uploading farmer image:', error);
    throw error;
  }
};

// Upload a single visit image
export const uploadVisitImage = async (
  file: File,
  visitId: string,
  index: number
): Promise<string> => {
  try {
    const extension = file.name.split('.').pop() || 'jpeg';
    const path = `visits/${visitId}/image_${index}.${extension}`;
    return uploadImage(file, path);
  } catch (error) {
    console.error('Error uploading visit image:', error);
    throw error;
  }
};

// Upload multiple visit images
export const uploadVisitImages = async (
  files: File[],
  visitId: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadVisitImage(file, visitId, index)
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading visit images:', error);
    throw error;
  }
};

// Delete all images associated with a visit
export const deleteVisitImages = async (visitId: string): Promise<void> => {
  try {
    const visitFolderRef = ref(storage, `visits/${visitId}`);

    // List all items in the folder
    const listResult = await listAll(visitFolderRef);

    // Delete each item
    const deletePromises = listResult.items.map((itemRef) =>
      deleteObject(itemRef)
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting visit images:', error);
    throw error;
  }
};

// Delete all images associated with a farmer
export const deleteFarmerImages = async (farmerId: string): Promise<void> => {
  try {
    const farmerFolderRef = ref(storage, `farmers/${farmerId}`);

    // List all items in the folder
    const listResult = await listAll(farmerFolderRef);

    // Delete each item
    const deletePromises = listResult.items.map((itemRef) =>
      deleteObject(itemRef)
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting farmer images:', error);
    throw error;
  }
};
