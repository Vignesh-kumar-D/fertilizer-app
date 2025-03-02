import { clsx, type ClassValue } from 'clsx';

import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/image-utils.ts

export const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200; // Max width or height

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        // Check if size is under 2MB
        const base64Size = compressedBase64.length * (3 / 4) - 2; // Approximate size in bytes
        if (base64Size > 2 * 1024 * 1024) {
          reject(new Error('Compressed image still exceeds 2MB'));
          return;
        }

        resolve(compressedBase64);
      };
    };

    reader.onerror = (error) => reject(error);
  });
};

// lib/firebase/utils.ts
import { DocumentData, Timestamp } from 'firebase/firestore';

// Format timestamp to string
export const formatTimestamp = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};

// Convert Firebase document to our model
export const convertDoc = <T extends { id: string }>(doc: DocumentData): T => {
  const data = doc.data();

  // Convert timestamps to strings
  const formattedData = { ...data };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    formattedData.createdAt = formatTimestamp(data.createdAt);
  }

  if (data.date && data.date instanceof Timestamp) {
    formattedData.date = formatTimestamp(data.date);
  }

  if (data.lastVisitDate && data.lastVisitDate instanceof Timestamp) {
    formattedData.lastVisitDate = formatTimestamp(data.lastVisitDate);
  }

  return {
    id: doc.id,
    ...formattedData,
  } as T;
};

// Format phone number to ensure consistency
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Basic formatting - ensure it has a + prefix
  if (!phoneNumber.startsWith('+')) {
    return `+${phoneNumber}`;
  }
  return phoneNumber;
};

// Generate a unique ID
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Handle offline operations
export const storeOfflineOperation = (
  operation: 'create' | 'update' | 'delete',
  collection: string,
  data: unknown,
  id?: string
): void => {
  if (typeof window === 'undefined') return;

  const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');

  offlineQueue.push({
    operation,
    collection,
    data,
    id,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
};

// Check if there are pending offline operations
export const hasPendingOfflineOperations = (): boolean => {
  if (typeof window === 'undefined') return false;

  const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  return offlineQueue.length > 0;
};

// Get count of pending offline operations
export const getPendingOfflineOperationsCount = (): number => {
  if (typeof window === 'undefined') return 0;

  const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  return offlineQueue.length;
};
