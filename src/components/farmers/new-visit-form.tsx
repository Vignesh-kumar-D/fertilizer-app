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
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  X,
  Trash2,
} from 'lucide-react';
import { Crop, Farmer, Visit } from '@/types';
import { compressImage } from '@/lib/utils';
import { useFirebase } from '@/lib/firebase/firebase-context';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FullScreenImageViewer } from '@/components/shared/FullScreenImageViewer';

const formSchema = z.object({
  farmerId: z.string().min(1, 'Please select a farmer'),
  cropId: z.string().min(1, 'Please select a crop'),
  date: z.string(),
  cropHealth: z.enum(['good', 'average', 'poor']),
  notes: z.string().min(1, 'Notes are required'),
  recommendations: z.string().min(1, 'Recommendations are required'),
  images: z.array(z.string()).default([]),
});

interface VisitFormProps {
  visitId?: string; // Optional visit ID for editing mode
  initialFarmerId?: string; // Optional farmer ID for pre-selection
}

export default function VisitForm({
  visitId,
  initialFarmerId,
}: VisitFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getFarmers,
    getFarmerById,
    createVisit,
    updateVisit,
    getVisitById,
    deleteVisit,
    currentUser,
  } = useFirebase();

  // State management
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerCrops, setFarmerCrops] = useState<Crop[]>([]);
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);

  const [isEdit, setIsEdit] = useState(false);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);

  // Get query params
  const queryFarmerId = searchParams.get('farmerId') || initialFarmerId || '';

  // Setup form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmerId: queryFarmerId,
      cropId: '',
      date: new Date().toISOString().split('T')[0],
      cropHealth: 'good',
      notes: '',
      recommendations: '',
      images: [],
    },
  });

  // Determine if we're in edit mode
  useEffect(() => {
    if (visitId) {
      setIsEdit(true);
      setLoading(true);

      // Fetch visit data
      const fetchVisit = async () => {
        try {
          const visit = await getVisitById(visitId);
          if (visit) {
            setEditVisit(visit);

            // Set form values from visit
            form.setValue('farmerId', visit.farmerId);
            form.setValue('cropId', visit.crop.id);
            form.setValue('date', visit.date);
            form.setValue('cropHealth', visit.cropHealth);
            form.setValue('notes', visit.notes);
            form.setValue('recommendations', visit.recommendations);

            // Handle images
            if (visit.images && visit.images.length > 0) {
              form.setValue('images', visit.images);
            }

            // Load farmer data
            const farmer = await getFarmerById(visit.farmerId);
            if (farmer) {
              setSelectedFarmer(farmer);
              setFarmerCrops(farmer.crops || []);
            }
          } else {
            toast.error('Visit not found');
            router.push('/visits');
          }
        } catch (error) {
          console.error('Error loading visit:', error);
          toast.error('Failed to load visit details');
          router.push('/visits');
        } finally {
          setLoading(false);
        }
      };

      fetchVisit();
    }
  }, [visitId, getVisitById, getFarmerById, form, router]);

  // Fetch farmers list
  useEffect(() => {
    const fetchFarmers = async () => {
      if (!isEdit) setLoading(true);
      try {
        const response = await getFarmers();
        setFarmers(response.data);
      } catch (error) {
        console.error('Error fetching farmers:', error);
        toast.error('Failed to load farmers');
      } finally {
        if (!isEdit) setLoading(false);
      }
    };

    fetchFarmers();
  }, [getFarmers, isEdit]);

  // Initialize farmer when coming from farmer profile
  useEffect(() => {
    if (isEdit) return; // Skip for edit mode

    const loadSelectedFarmer = async () => {
      if (queryFarmerId) {
        try {
          const farmer = await getFarmerById(queryFarmerId);
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
  }, [queryFarmerId, getFarmerById, router, isEdit]);

  // Watch for farmer ID changes
  const farmerIdValue = form.watch('farmerId');

  // Update available crops when farmer changes
  useEffect(() => {
    if (isEdit && !editVisit) return; // Wait for edit data to load

    const loadFarmerCrops = async () => {
      const farmerId = form.getValues('farmerId');
      if (
        farmerId &&
        ((isEdit && editVisit?.farmerId !== farmerId) ||
          (!isEdit && farmerId !== queryFarmerId))
      ) {
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
  }, [farmerIdValue, getFarmerById, form, queryFarmerId, isEdit, editVisit]);

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

    // If it's an initial image from the database, mark it for deletion

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

  const handleImageClick = (index: number) => {
    setViewerImageIndex(index);
    setViewerOpen(true);
  };

  const handleDeleteVisit = async () => {
    if (!visitId) return;

    try {
      setIsSubmitting(true);
      await deleteVisit(visitId);
      toast.success('Visit deleted successfully');
      router.push('/visits');
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Find selected crop from farmer's crops
      const selectedCrop = farmerCrops.find(
        (crop) => crop.id === values.cropId
      );

      if (!selectedCrop) {
        toast.error('Selected crop not found');
        setIsSubmitting(false);
        return;
      }
      const updatedImageUrls = values.images.filter(
        (img) => !imagesToUpload.some((file) => img.includes(file.name))
      );
      // Handle Edit mode
      if (isEdit && visitId) {
        // Update the visit details
        await updateVisit(visitId, {
          farmerId: values.farmerId,
          crop: selectedCrop,
          date: values.date,
          cropHealth: values.cropHealth as 'good' | 'average' | 'poor',
          notes: values.notes,
          recommendations: values.recommendations,
          // Don't update images yet
        });

        // Handle image updates if any

        // // Upload new images if any
        // if (imagesToUpload.length > 0) {
        //   try {
        //     const newImageUrls = await uploadVisitImages(
        //       imagesToUpload,
        //       visitId
        //     );
        //     updatedImageUrls = [...updatedImageUrls, ...newImageUrls];
        //   } catch (imgError) {
        //     console.error('Error uploading images:', imgError);
        //     toast.error('Visit updated but new images could not be uploaded');
        //   }
        // }

        // Update with final image URLs
        await updateVisit(visitId, { images: updatedImageUrls });

        toast.success('Visit updated successfully');
        router.push('/visits');
        return;
      }

      // Create mode
      await createVisit({
        farmerId: values.farmerId,
        crop: selectedCrop,
        date: values.date,
        cropHealth: values.cropHealth as 'good' | 'average' | 'poor',
        employeeId: currentUser?.id ?? '',
        notes: values.notes,
        recommendations: values.recommendations,
        images: updatedImageUrls, // Initially empty
      });

      // If we have images to upload

      router.push('/visits');
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} visit`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading, show spinner
  if (loading && (!isEdit || !editVisit)) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Loading {isEdit ? 'visit' : 'farmers'} data...
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? 'Edit Visit' : 'Add New Visit'}
            </h1>
            {selectedFarmer && (
              <p className="text-muted-foreground">
                {selectedFarmer.name} - {selectedFarmer.location}
              </p>
            )}
          </div>
        </div>

        {isEdit && visitId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this visit record. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={handleDeleteVisit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
                    value={field.value}
                    disabled={(isEdit && !editVisit) || isSubmitting}
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
                    value={field.value}
                    disabled={
                      !selectedFarmer ||
                      farmerCrops.length === 0 ||
                      isSubmitting
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
                    <Input type="date" {...field} disabled={isSubmitting} />
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
                  value={field.value}
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                          <Image
                            src={image}
                            fill
                            alt={`Visit photo ${index + 1}`}
                            className="object-cover rounded-lg w-full h-full cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                            disabled={uploading || isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {field.value.length < 5 && (
                        <label
                          className={`border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center transition-colors ${
                            isSubmitting
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
                            disabled={uploading || isSubmitting}
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
              disabled={isSubmitting || uploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Saving...'}
                </>
              ) : isEdit ? (
                'Update Visit'
              ) : (
                'Add Visit'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/visits')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      {/* Image Viewer for full-screen viewing */}
      <FullScreenImageViewer
        images={form.getValues('images')}
        initialIndex={viewerImageIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
