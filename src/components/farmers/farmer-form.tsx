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
  Check,
  ChevronsUpDown,
  Plus,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/lib/mock-data-context';
import { toast } from 'sonner';
import { Crop } from '@/types';
import { cn, compressImage } from '@/lib/utils';
import Image from 'next/image';

// Schema updated for new data structure
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  location: z.string().min(2, 'Location name must be at least 2 characters'),
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
  const { crops, addCrop, addFarmer, updateFarmer, getFarmerById } =
    useMockData();
  const [selectedCrops, setSelectedCrops] = useState<Crop[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);

  // Get existing farmer data if editing
  const existingFarmer = farmerId ? getFarmerById(farmerId) : undefined;

  // Initialize form with existing data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingFarmer?.name || '',
      phone: existingFarmer?.phone || '',
      location: existingFarmer?.location || '',
      crops: existingFarmer?.crops || [],
      image: existingFarmer?.image || '',
    },
  });

  // Initialize selected crops when editing
  useEffect(() => {
    if (existingFarmer?.crops) {
      setSelectedCrops(existingFarmer.crops);
    }
  }, [existingFarmer]);

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

  // Handle adding a new crop
  const handleAddNewCrop = (corpName: string) => {
    if (corpName.trim()) {
      const newCrop = addCrop({ name: corpName.trim() });
      handleSelectCrop(newCrop);
      setShowAddCrop(false);
      toast.success(`Added new crop: ${corpName}`);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedImage = await compressImage(file);
      form.setValue('image', compressedImage, { shouldValidate: true });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image. Make sure it is under 1MB');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Handle removing the image
  const handleRemoveImage = () => {
    form.setValue('image', '', { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (farmerId) {
        updateFarmer(farmerId, {
          ...values,
          crops: values.crops,
        });
        toast.success('Farmer updated successfully');
      } else {
        addFarmer({
          ...values,
          crops: values.crops,
          image: values.image ?? '',
        });
        toast.success('Farmer added successfully');
      }
      router.push('/farmers');
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    }
  };

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
                      <ImageIcon className="h-8 w-8 text-gray-400" />
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
                          {searchTerm && !showAddCrop ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex w-full items-center justify-start px-2 py-1 text-sm"
                              onClick={() => {
                                handleAddNewCrop(searchTerm);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add &quot;{searchTerm}&quot;
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
          <Button type="submit" className="bg-primary text-primary-foreground">
            {farmerId ? 'Update' : 'Add'} Farmer
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
