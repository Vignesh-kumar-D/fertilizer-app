// lib/firebase/cropActivity.ts
import { CropActivity, Crop } from '@/types';
import { getVisitsByFarmerAndCrop } from './visit';
import { getPurchasesByFarmerAndCrop } from './purchase';

// Get all activity (visits and purchases) for a specific crop of a farmer
export const getCropActivity = async (
  farmerId: string,
  cropId: string
): Promise<CropActivity[]> => {
  try {
    // Fetch visits for this farmer and crop
    const visits = await getVisitsByFarmerAndCrop(farmerId, cropId);

    // Fetch purchases for this farmer and crop
    const purchases = await getPurchasesByFarmerAndCrop(farmerId, cropId);

    // Convert visits to crop activities
    const visitActivities: CropActivity[] = visits.map((visit) => ({
      id: visit.id,
      type: 'visit',
      date: visit.date,
      details: visit,
    }));

    // Convert purchases to crop activities
    const purchaseActivities: CropActivity[] = purchases.map((purchase) => ({
      id: purchase.id,
      type: 'purchase',
      date: purchase.date,
      details: purchase,
    }));

    // Combine and sort by date (most recent first)
    const allActivities = [...visitActivities, ...purchaseActivities];
    allActivities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return allActivities;
  } catch (error) {
    console.error('Error fetching crop activities:', error);
    throw error;
  }
};

// Get all activities for all crops of a farmer
export const getAllCropActivities = async (
  farmerId: string,
  crops: Crop[]
): Promise<{ [cropId: string]: CropActivity[] }> => {
  try {
    const result: { [cropId: string]: CropActivity[] } = {};

    // For each crop, get its activities
    for (const crop of crops) {
      const activities = await getCropActivity(farmerId, crop.id);
      result[crop.id] = activities;
    }

    return result;
  } catch (error) {
    console.error('Error fetching all crop activities:', error);
    throw error;
  }
};

// Get recent activities (last 5) for all crops of a farmer
export const getRecentCropActivities = async (
  farmerId: string,
  crops: Crop[]
): Promise<CropActivity[]> => {
  try {
    let allActivities: CropActivity[] = [];

    // For each crop, get its activities
    for (const crop of crops) {
      const activities = await getCropActivity(farmerId, crop.id);
      allActivities = [...allActivities, ...activities];
    }

    // Sort by date (most recent first)
    allActivities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Return only the most recent 5 activities
    return allActivities.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent crop activities:', error);
    throw error;
  }
};
