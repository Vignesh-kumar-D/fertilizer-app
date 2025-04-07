'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  Loader2,
  // Trash2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Crop, Farmer, Purchase } from '@/types';
import { useFirebase } from '@/lib/firebase/firebase-context';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { compressImage } from '@/lib/utils';
import { FullScreenImageViewer } from '@/components/shared/FullScreenImageViewer';
import { uploadPurchaseImages } from '@/lib/firebase/utils/purchase';

// Updated schema to include crop, quantity, working combo and images
const formSchema = z.object({
  farmerId: z.string().min(1, 'Please select a farmer'),
  cropId: z.string().min(1, 'Please select a crop'),
  date: z.string(),
  items: z.string().min(1, 'Add at least one item'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0),
  remainingAmount: z.number(),
  notes: z.string().optional(),
  isWorkingCombo: z.boolean().default(false),
  images: z.array(z.string()).default([]),
});

interface PurchaseFormProps {
  purchaseId?: string; // Optional purchase ID for editing mode
  initialFarmerId?: string; // Optional farmer ID for pre-selection
}

export default function PurchaseForm({
  purchaseId,
  initialFarmerId,
}: PurchaseFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getFarmers,
    getFarmerById,
    createPurchase,
    updatePurchase,
    getPurchaseById,
    // deletePurchase,
  } = useFirebase();

  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerCrops, setFarmerCrops] = useState<Crop[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editPurchase, setEditPurchase] = useState<Purchase | null>(null);

  // Image handling state
  const [uploading, setUploading] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);

  const queryFarmerId = searchParams.get('farmerId') || initialFarmerId || '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      items: '',
      farmerId: queryFarmerId,
      cropId: '',
      quantity: 0,
      totalAmount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      notes: '',
      isWorkingCombo: false,
      images: [],
    },
  });

  // Determine if we're in edit mode
  useEffect(() => {
    if (purchaseId) {
      setIsEdit(true);
      setLoading(true);

      // Fetch purchase data
      const fetchPurchase = async () => {
        try {
          const purchase = await getPurchaseById(purchaseId);
          if (purchase) {
            setEditPurchase(purchase);

            // Set form values from purchase
            form.setValue('farmerId', purchase.farmerId);
            form.setValue('cropId', purchase.crop.id);
            form.setValue('date', purchase.date);
            form.setValue('items', purchase.items);
            form.setValue('quantity', purchase.quantity);
            form.setValue('totalAmount', purchase.totalAmount);
            form.setValue('amountPaid', purchase.amountPaid);
            form.setValue('remainingAmount', purchase.remainingAmount);
            form.setValue('notes', purchase.notes || '');
            form.setValue('isWorkingCombo', purchase.isWorkingCombo || false);

            // Handle images
            if (purchase.images && purchase.images.length > 0) {
              form.setValue('images', purchase.images);
            }

            // Load farmer data
            const farmer = await getFarmerById(purchase.farmerId);
            if (farmer) {
              setSelectedFarmer(farmer);
              setFarmerCrops(farmer.crops || []);
            }
          } else {
            toast.error('Purchase not found');
            router.push('/purchases');
          }
        } catch (error) {
          console.error('Error loading purchase:', error);
          toast.error('Failed to load purchase details');
          router.push('/purchases');
        } finally {
          setLoading(false);
        }
      };

      fetchPurchase();
    }
  }, [purchaseId, getPurchaseById, getFarmerById, form, router]);

  // Fetch all farmers
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

  // Load initial farmer if farmerId is provided
  useEffect(() => {
    if (isEdit) return; // Skip for edit mode

    const loadInitialFarmer = async () => {
      if (queryFarmerId) {
        try {
          const farmer = await getFarmerById(queryFarmerId);
          if (farmer) {
            setSelectedFarmer(farmer);
            setFarmerCrops(farmer.crops || []);

            // If there's only one crop, auto-select it
            if (farmer.crops && farmer.crops.length === 1) {
              form.setValue('cropId', farmer.crops[0].id);
            }
          }
        } catch (error) {
          console.error('Error loading initial farmer:', error);
          toast.error('Failed to load farmer details');
        }
      }
    };

    loadInitialFarmer();
  }, [queryFarmerId, getFarmerById, form, isEdit]);

  // Watch for farmer ID changes
  const farmerIdValue = form.watch('farmerId');

  // Update available crops when farmer changes
  useEffect(() => {
    if (isEdit && !editPurchase) return; // Wait for edit data to load

    const loadFarmerCrops = async () => {
      const farmerId = form.getValues('farmerId');
      if (
        farmerId &&
        ((isEdit && editPurchase?.farmerId !== farmerId) ||
          (!isEdit && farmerId !== queryFarmerId))
      ) {
        try {
          const farmer = await getFarmerById(farmerId);
          if (farmer) {
            setSelectedFarmer(farmer);
            setFarmerCrops(farmer.crops || []);

            // Reset the crop selection when farmer changes
            form.setValue('cropId', '');

            // If there's only one crop, auto-select it
            if (farmer.crops && farmer.crops.length === 1) {
              form.setValue('cropId', farmer.crops[0].id);
            }
          }
        } catch (error) {
          console.error('Error loading farmer crops:', error);
          toast.error('Failed to load farmer crops');
        }
      }
    };

    loadFarmerCrops();
  }, [farmerIdValue, getFarmerById, form, queryFarmerId, isEdit, editPurchase]);

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

  // const handleDeletePurchase = async () => {
  //   if (!purchaseId) return;

  //   try {
  //     setSubmitting(true);
  //     await deletePurchase(purchaseId);
  //     toast.success('Purchase deleted successfully');
  //     router.push('/purchases');
  //   } catch (error) {
  //     console.error('Error deleting purchase:', error);
  //     toast.error('Failed to delete purchase');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);

      // Find selected crop
      const selectedCrop = farmerCrops.find(
        (crop) => crop.id === values.cropId
      );

      if (!selectedCrop) {
        toast.error('Selected crop not found');
        return;
      }

      // Handle Edit mode
      if (isEdit && purchaseId) {
        // Update the purchase details
        await updatePurchase(purchaseId, {
          farmerId: values.farmerId,
          crop: selectedCrop,
          date: values.date,
          items: values.items,
          quantity: values.quantity,
          totalAmount: values.totalAmount,
          amountPaid: values.amountPaid,
          remainingAmount: values.remainingAmount,
          notes: values.notes || '',
          isWorkingCombo: values.isWorkingCombo,
          // Don't update images yet
        });

        // Handle image updates if any
        let updatedImageUrls = values.images.filter(
          (img) => !imagesToUpload.some((file) => img.includes(file.name))
        );

        // Upload new images if any
        if (imagesToUpload.length > 0) {
          try {
            const newImageUrls = await uploadPurchaseImages(
              imagesToUpload,
              purchaseId
            );
            updatedImageUrls = [...updatedImageUrls, ...newImageUrls];
          } catch (imgError) {
            console.error('Error uploading images:', imgError);
            toast.error(
              'Purchase updated but new images could not be uploaded'
            );
          }
        }

        // Update with final image URLs
        await updatePurchase(purchaseId, { images: updatedImageUrls });

        toast.success('Purchase updated successfully');
        router.push('/purchases');
        return;
      }

      // Create new purchase
      const newPurchaseId = await createPurchase({
        farmerId: values.farmerId,
        crop: selectedCrop,
        date: values.date,
        items: values.items,
        quantity: values.quantity,
        totalAmount: values.totalAmount,
        amountPaid: values.amountPaid,
        remainingAmount: values.remainingAmount,
        notes: values.notes || '',
        isWorkingCombo: values.isWorkingCombo,
        images: [],
      });

      // If we have images to upload
      if (imagesToUpload.length > 0) {
        try {
          const imageUrls = await uploadPurchaseImages(
            imagesToUpload,
            newPurchaseId
          );

          // Update the purchase with image URLs
          await updatePurchase(newPurchaseId, { images: imageUrls });

          toast.success('Purchase and images added successfully');
        } catch (imgError) {
          console.error('Error uploading images:', imgError);
          toast.error('Purchase created but images could not be uploaded');
        }
      } else {
        toast.success('Purchase added successfully');
      }

      router.push('/purchases');
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} purchase`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && (!isEdit || !editPurchase)) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading data...</p>
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
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Purchase' : 'Add Purchase'}
          </h1>
        </div>

        {/* {isEdit && purchaseId && (
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
                  This will permanently delete this purchase record. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={handleDeletePurchase}
                  disabled={submitting}
                >
                  {submitting ? (
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
        )} */}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="farmerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Farmer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={(isEdit && !editPurchase) || submitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a farmer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          className="bg-white"
                          align="start"
                        >
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

                {/* Crop selection field - only enabled when farmer is selected */}
                <FormField
                  control={form.control}
                  name="cropId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Crop</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedFarmer || submitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a crop" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          className="bg-white"
                          align="start"
                        >
                          {farmerCrops.map((crop) => (
                            <SelectItem key={crop.id} value={crop.id}>
                              {crop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (in litres)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        {...field}
                        onChange={(e) => {
                          const stringValue = e.target.value;
                          const paid = parseFloat(stringValue);
                          const currentPaid = isNaN(paid) ? 0 : paid;

                          field.onChange(currentPaid);
                        }}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="items"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Items</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter items"
                          className="min-h-[100px]"
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="isWorkingCombo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={submitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Working Combo</FormLabel>
                        <FormDescription>
                          Mark this as a working combo if this combination works
                          well.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input
                          // Change type to text, add inputMode
                          type="text"
                          inputMode="decimal"
                          placeholder="Enter total amount" // Optional: Add placeholder
                          {...field}
                          // Modify onChange
                          onChange={(e) => {
                            const stringValue = e.target.value;
                            // Allow empty input, parse potentially non-numeric input
                            const total = parseFloat(stringValue);
                            // If parsing fails (NaN) or input is empty, treat as 0 for form state
                            const currentTotal = isNaN(total) ? 0 : total;

                            field.onChange(currentTotal); // Update react-hook-form state

                            // Recalculate remaining amount based on the new total
                            const currentPaid = form.getValues('amountPaid');
                            form.setValue(
                              'remainingAmount',
                              Math.max(0, currentTotal - currentPaid) // Ensure remaining isn't negative
                            );
                          }}
                          // Disable if editing OR submitting
                          disabled={isEdit || submitting}
                          // Use field.value which RHF manages (should be number)
                          // RHF handles converting number state back to string for text input
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input
                          // Change type to text, add inputMode
                          type="text"
                          inputMode="decimal"
                          placeholder="Enter amount paid" // Optional: Add placeholder
                          {...field}
                          // Modify onChange
                          onChange={(e) => {
                            const stringValue = e.target.value;
                            const paid = parseFloat(stringValue);
                            const currentPaid = isNaN(paid) ? 0 : paid;

                            field.onChange(currentPaid); // Update react-hook-form state

                            // Recalculate remaining amount based on the new paid amount
                            const currentTotal = form.getValues('totalAmount');
                            form.setValue(
                              'remainingAmount',
                              Math.max(0, currentTotal - currentPaid) // Ensure remaining isn't negative
                            );
                          }}
                          // Disable if editing OR submitting
                          disabled={isEdit || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remainingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remaining Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={Math.max(0, field.value)}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes..."
                          className="min-h-[100px]"
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
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
                                alt={`Purchase photo ${index + 1}`}
                                className="object-cover rounded-lg w-full h-full cursor-pointer"
                                onClick={() => handleImageClick(index)}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeImage(index)}
                                disabled={uploading || submitting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {field.value.length < 5 && (
                            <label
                              className={`border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center transition-colors ${
                                submitting
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
                                disabled={uploading || submitting}
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
            </CardContent>
          </Card>
          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Saving...'}
                </>
              ) : isEdit ? (
                'Update Purchase'
              ) : (
                'Add Purchase'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/purchases')}
              disabled={submitting}
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
