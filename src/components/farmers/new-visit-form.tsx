// src/app/visits/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Crop, Farmer } from '@/types';
import { compressImage } from '@/lib/utils';
import { useFirebase } from '@/lib/firebase/firebase-context';
import Image from 'next/image';

const formSchema = z.object({
  farmerId: z.string().min(1, 'Please select a farmer'),
  cropId: z.string().min(1, 'Please select a crop'),
  date: z.string(),
  cropHealth: z.enum(['good', 'average', 'poor']),
  notes: z.string().min(1, 'Notes are required'),
  recommendations: z.string().min(1, 'Recommendations are required'),
  images: z.array(z.string()).default([]),
});

export default function NewVisitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getFarmers,
    getFarmerById,
    createVisit,
    updateVisit,
    uploadVisitImages,
    currentUser,
  } = useFirebase();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingVisit, setUploadingVisit] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerCrops, setFarmerCrops] = useState<Crop[]>([]);
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);

  // Get farmerId from URL if available
  const initialFarmerId = searchParams.get('farmerId');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmerId: initialFarmerId || '',
      cropId: '',
      date: new Date().toISOString().split('T')[0],
      cropHealth: 'good',
      notes: '',
      recommendations: '',
      images: [],
    },
  });

  // Fetch farmers list
  useEffect(() => {
    const fetchFarmers = async () => {
      setLoading(true);
      try {
        const response = await getFarmers();
        setFarmers(response.data);
      } catch (error) {
        console.error('Error fetching farmers:', error);
        toast.error('Failed to load farmers');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, [getFarmers]);

  // Initialize farmer when coming from farmer profile
  useEffect(() => {
    const loadSelectedFarmer = async () => {
      if (initialFarmerId) {
        try {
          const farmer = await getFarmerById(initialFarmerId);
          if (farmer) {
            setSelectedFarmer(farmer);
            setFarmerCrops(farmer.crops || []);
          } else {
            toast.error('Farmer not found');
            router.push('/visits');
          }
        } catch (error) {
          console.error('Error loading farmer:', error);
          toast.error('Failed to load farmer details');
        }
      }
    };

    loadSelectedFarmer();
  }, [initialFarmerId, getFarmerById, router]);

  // Watch for farmer ID changes
  const farmerIdValue = form.watch('farmerId');

  // Update available crops when farmer changes
  useEffect(() => {
    const loadFarmerCrops = async () => {
      const farmerId = form.getValues('farmerId');
      if (farmerId && farmerId !== initialFarmerId) {
        try {
          const farmer = await getFarmerById(farmerId);
          if (farmer) {
            setSelectedFarmer(farmer);
            setFarmerCrops(farmer.crops || []);

            // Reset the crop selection when farmer changes
            form.setValue('cropId', '', { shouldValidate: true });
          }
        } catch (error) {
          console.error('Error loading farmer crops:', error);
          toast.error('Failed to load farmer crops');
        }
      }
    };

    loadFarmerCrops();
  }, [farmerIdValue, getFarmerById, form, initialFarmerId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const currentImages = form.getValues('images');
    if (currentImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    try {
      // Store files for later upload to Firebase
      const newFiles = Array.from(files);
      setImagesToUpload((prev) => [...prev, ...newFiles]);

      // Process for preview
      const compressedImages = await Promise.all(
        newFiles.map((file) => compressImage(file))
      );

      form.setValue('images', [...currentImages, ...compressedImages], {
        shouldValidate: true,
      });
      toast.success('Images added for upload');
    } catch (error) {
      console.error('Error compressing images:', error);
      toast.error(
        'Failed to process images. Make sure each image is under 2MB'
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images');

    // Remove from preview images
    form.setValue(
      'images',
      currentImages.filter((_, i) => i !== index),
      { shouldValidate: true }
    );

    // Remove from files to upload
    if (index < imagesToUpload.length) {
      setImagesToUpload((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setUploadingVisit(true);
    try {
      // Find selected crop from farmer's crops
      const selectedCrop = farmerCrops.find(
        (crop) => crop.id === values.cropId
      );

      if (!selectedCrop) {
        toast.error('Selected crop not found');
        setUploadingVisit(false);
        return;
      }

      // Create visit first
      const visitId = await createVisit({
        farmerId: values.farmerId,
        crop: selectedCrop,
        date: values.date,
        cropHealth: values.cropHealth as 'good' | 'average' | 'poor',
        employeeId: currentUser?.id ?? '',
        notes: values.notes,
        recommendations: values.recommendations,
        images: [], // Initially empty
      });

      // If we have images to upload
      if (imagesToUpload.length > 0) {
        try {
          const imageUrls = await uploadVisitImages(imagesToUpload, visitId);

          // Update the visit with image URLs
          await updateVisit(visitId, { images: imageUrls });

          toast.success('Visit and images added successfully');
        } catch (imgError) {
          console.error('Error uploading images:', imgError);
          toast.error('Visit created but images could not be uploaded');
        }
      } else {
        toast.success('Visit added successfully');
      }

      router.push('/visits');
    } catch (error) {
      console.error('Error adding visit:', error);
      toast.error('Failed to add visit');
    } finally {
      setUploadingVisit(false);
    }
  };

  // If loading, show spinner
  if (loading && !initialFarmerId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading farmers data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Visit</h1>
          {selectedFarmer && (
            <p className="text-muted-foreground">
              {selectedFarmer.name} - {selectedFarmer.location}
            </p>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Farmer Selection */}
            <FormField
              control={form.control}
              name="farmerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Farmer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!initialFarmerId || uploadingVisit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a farmer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {farmers.map((farmer) => (
                        <SelectItem key={farmer.id} value={farmer.id}>
                          {farmer.name} - {farmer.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Crop Selection */}
            <FormField
              control={form.control}
              name="cropId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Crop</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      !selectedFarmer ||
                      farmerCrops.length === 0 ||
                      uploadingVisit
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a crop" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {farmerCrops.length > 0 ? (
                        farmerCrops.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {crop.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No crops available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={uploadingVisit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cropHealth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Health Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={uploadingVisit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop health status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="good">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Good
                      </span>
                    </SelectItem>
                    <SelectItem value="average">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                        Average
                      </span>
                    </SelectItem>
                    <SelectItem value="poor">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                        Poor
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visit Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter visit notes and observations..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={uploadingVisit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recommendations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recommendations</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter recommendations for the farmer..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={uploadingVisit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Photos</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {field.value.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          {/* Using standard img tag to avoid Next.js Image domain issues */}
                          <Image
                            src={image}
                            fill
                            alt={`Visit photo ${index + 1}`}
                            className="object-cover rounded-lg w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                            disabled={uploading || uploadingVisit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {field.value.length < 5 && (
                        <label
                          className={`border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center transition-colors ${
                            uploadingVisit
                              ? 'cursor-not-allowed border-gray-200'
                              : 'cursor-pointer hover:border-primary border-gray-300'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading || uploadingVisit}
                          />
                          {uploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-500 mt-2">
                            {uploading ? 'Processing...' : 'Add Photos'}
                          </span>
                        </label>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add up to 5 photos. Each photo should be under 2MB.
                    </p>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={uploadingVisit || uploading}
            >
              {uploadingVisit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Visit'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/visits')}
              disabled={uploadingVisit}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
