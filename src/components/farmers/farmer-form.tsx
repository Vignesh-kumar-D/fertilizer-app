'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Plus,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Crop } from '@/types';
import { cn, compressImage } from '@/lib/utils';
import Image from 'next/image';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { ButtonLoader } from '../shared/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema updated for new data structure
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  location: z.string().min(2, 'Location name must be at least 2 characters'),
  zone: z.string().min(2, 'Location name must be at least 2 characters'),
  crops: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .min(1, 'Select at least one crop'),
  image: z.string().optional(),
});

interface FarmerFormProps {
  farmerId?: string;
}

export function FarmerForm({ farmerId }: FarmerFormProps) {
  const router = useRouter();
  const {
    createFarmer,
    updateFarmer,
    getFarmerById,
    uploadFarmerImage,
    getCrops,
    addCrop: addCropToDb,
  } = useFirebase();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<Crop[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [addingCrop, setAddingCrop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [farmerNotFound, setFarmerNotFound] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      location: '',
      crops: [],
      image: '',
      zone: '',
    },
  });

  // Fetch all crops from Firebase
  useEffect(() => {
    const fetchCrops = async () => {
      setLoadingCrops(true);
      try {
        const cropsList = await getCrops();
        setCrops(cropsList);
      } catch (error) {
        console.error('Error fetching crops:', error);
        toast.error('Failed to load crops');
      } finally {
        setLoadingCrops(false);
      }
    };

    fetchCrops();
  }, [getCrops]);

  // Fetch farmer if editing
  useEffect(() => {
    const fetchFarmer = async () => {
      if (farmerId) {
        setLoading(true);
        try {
          const farmer = await getFarmerById(farmerId);
          if (farmer) {
            setSelectedCrops(farmer.crops || []);

            // Reset form with fetched data
            form.reset({
              name: farmer.name || '',
              phone: farmer.phone || '',
              location: farmer.location || '',
              crops: farmer.crops || [],
              image: farmer.image || '',
              zone: farmer.zone || '',
            });
          } else {
            setFarmerNotFound(true);
          }
        } catch (error) {
          console.error('Error fetching farmer:', error);
          setFarmerNotFound(true);
          toast.error('Could not load farmer data');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchFarmer();
  }, [farmerId, getFarmerById, form]);

  // Update form value when selected crops change
  useEffect(() => {
    form.setValue('crops', selectedCrops, { shouldValidate: true });
  }, [selectedCrops, form]);

  // Filter crops based on search term
  const filteredCrops = crops.filter(
    (crop) =>
      crop.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedCrops.some((selected) => selected.id === crop.id)
  );

  // Handle selecting a crop
  const handleSelectCrop = (crop: Crop) => {
    setSelectedCrops((prev) => [...prev, crop]);
    setOpen(false);
    setSearchTerm('');
  };

  // Handle removing a crop
  const handleRemoveCrop = (cropId: string) => {
    setSelectedCrops((prev) => prev.filter((c) => c.id !== cropId));
  };

  // Handle adding a new crop to Firebase
  const handleAddNewCrop = async (cropName: string) => {
    if (!cropName.trim()) return;

    setAddingCrop(true);
    try {
      // Check if crop with same name already exists
      const cropExists = crops.some(
        (crop) => crop.name.toLowerCase() === cropName.trim().toLowerCase()
      );

      if (cropExists) {
        toast.error(`A crop named "${cropName}" already exists`);
        return;
      }

      // Add crop to Firebase
      const newCrop = await addCropToDb(cropName.trim());

      // Update local crops list
      setCrops((prev) => [...prev, newCrop]);

      // Select the new crop
      handleSelectCrop(newCrop);
      toast.success(`Added new crop: ${cropName}`);
    } catch (error) {
      console.error('Error adding crop:', error);
      toast.error('Failed to add crop');
    } finally {
      setAddingCrop(false);
      setSearchTerm('');
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // First compress the image locally
      const compressedImageDataUrl = await compressImage(file);

      // Store temporarily in form for preview
      form.setValue('image', compressedImageDataUrl, { shouldValidate: true });

      // If we're editing an existing farmer, upload to Firebase
      if (farmerId) {
        // Convert data URL to File object for upload
        const response = await fetch(compressedImageDataUrl);
        const blob = await response.blob();
        const imageFile = new File([blob], file.name, { type: file.type });

        // Upload to Firebase and get URL
        const firebaseImageUrl = await uploadFarmerImage(imageFile, farmerId);

        // Update form with Firebase URL
        form.setValue('image', firebaseImageUrl, { shouldValidate: true });

        // Update farmer's image in Firestore
        await updateFarmer(farmerId, { image: firebaseImageUrl });
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle removing the image
  const handleRemoveImage = async () => {
    try {
      form.setValue('image', '', { shouldValidate: true });

      // If editing, update the farmer's image field in Firestore
      if (farmerId) {
        await updateFarmer(farmerId, { image: '' });
        toast.success('Image removed');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      if (farmerId) {
        // For existing farmer
        await updateFarmer(farmerId, {
          name: values.name,
          phone: values.phone,
          location: values.location,
          crops: values.crops,
          zone: values.zone,
          // The image is already updated in handleImageUpload
        });

        toast.success('Farmer updated successfully!');
      } else {
        // For new farmer
        const imageDataUrl = values.image;
        let firebaseImageUrl = '';

        // Create farmer first to get ID
        const newFarmerId = await createFarmer({
          ...values,
          image: '', // Temporarily empty
          totalDue: 0,
          totalPaid: 0,
          lastVisitDate: new Date().toISOString(),
        });

        // If we have an image, upload it with the new farmer ID
        if (imageDataUrl) {
          try {
            // Convert data URL to File
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const imageFile = new File([blob], 'profile.jpg', {
              type: 'image/jpeg',
            });

            // Upload to Firebase
            firebaseImageUrl = await uploadFarmerImage(imageFile, newFarmerId);

            // Update the farmer with the image URL
            await updateFarmer(newFarmerId, { image: firebaseImageUrl });
          } catch (imgError) {
            console.error(
              'Error uploading image after farmer creation:',
              imgError
            );
            // Continue even if image upload fails
          }
        }

        toast.success('Farmer created successfully');
      }

      router.push('/farmers');
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading || loadingCrops) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          {loading ? 'Loading farmer data...' : 'Loading crops...'}
        </p>
      </div>
    );
  }

  // Show not found state
  if (farmerNotFound) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Farmer not found. The requested farmer may have been deleted or does
            not exist.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/farmers')}>
          Return to Farmers List
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Farmer Image */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farmer Image</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center space-y-4">
                  {field.value ? (
                    <div className="relative w-32 h-32">
                      <Image
                        src={field.value}
                        alt="Farmer"
                        className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                        fill
                        priority
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500 mt-2">
                        {uploading ? 'Uploading...' : 'Add Photo'}
                      </span>
                    </label>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter farmer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 10-digit phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="zone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone</FormLabel>
              <FormControl>
                <Input placeholder="Enter Zone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="crops"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Crops</FormLabel>
              <div className="space-y-2">
                {/* Selected crops display */}
                <div className="flex flex-wrap gap-2 min-h-[36px] p-1 border rounded-md bg-background">
                  {selectedCrops.length > 0 &&
                    selectedCrops.map((crop) => (
                      <Badge
                        key={crop.id}
                        variant="secondary"
                        className="px-2 py-1"
                      >
                        {crop.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 p-0"
                          onClick={() => handleRemoveCrop(crop.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                </div>

                {/* Crops dropdown */}
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      type="button"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedCrops.length > 0
                        ? `${selectedCrops.length} crop${
                            selectedCrops.length > 1 ? 's' : ''
                          } selected`
                        : 'Search crops'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="bg-white p-0 w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)]"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        value={searchTerm}
                        placeholder="Search crops..."
                        onValueChange={setSearchTerm}
                        className="bg-white h-9"
                      />

                      <CommandList className="bg-white max-h-[200px] overflow-auto">
                        <CommandEmpty className="py-2">
                          {searchTerm ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex w-full items-center justify-start px-2 py-1 text-sm"
                              onClick={() => handleAddNewCrop(searchTerm)}
                              disabled={addingCrop}
                            >
                              {addingCrop ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 h-4 w-4" />
                              )}
                              {addingCrop ? 'Adding...' : `Add "${searchTerm}"`}
                            </Button>
                          ) : (
                            <p className="text-center py-2 px-2 text-sm text-muted-foreground">
                              No crops found
                            </p>
                          )}
                        </CommandEmpty>

                        <CommandGroup>
                          {filteredCrops.map((crop) => {
                            return (
                              <CommandItem
                                key={crop.id}
                                value={crop.name}
                                onSelect={() => handleSelectCrop(crop)}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedCrops.some((c) => c.id === crop.id)
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {crop.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground"
            disabled={isSubmitting || uploading || addingCrop}
          >
            {isSubmitting && <ButtonLoader />} {farmerId ? 'Update' : 'Add'}{' '}
            Farmer
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/farmers')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
