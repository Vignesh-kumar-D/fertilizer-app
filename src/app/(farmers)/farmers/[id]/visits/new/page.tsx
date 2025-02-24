// src/app/farmers/[id]/visits/new/page.tsx
'use client';

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
import { useRouter, useParams } from 'next/navigation';
import { useMockData } from '@/lib/mock-data-context';
import { toast } from 'sonner';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';

// Image compression utility
const compressImage = async (file: File): Promise<string> => {
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

        // Calculate dimensions
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        // Check size (2MB limit)
        const base64Size = compressedBase64.length * (3 / 4) - 2;
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

const formSchema = z.object({
  date: z.string(),
  nextVisitDate: z.string(),
  cropHealth: z.enum(['good', 'average', 'poor']),
  notes: z.string().min(1, 'Notes are required'),
  recommendations: z.string().min(1, 'Recommendations are required'),
  images: z.array(z.string()).default([]),
});

export default function AddVisitPage() {
  const router = useRouter();
  const { getFarmerById, addVisit } = useMockData();
  const { id } = useParams<{ id: string }>();
  const farmer = getFarmerById(id);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      nextVisitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      cropHealth: 'good',
      notes: '',
      recommendations: '',
      images: [],
    },
  });

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
      const compressedImages = await Promise.all(
        Array.from(files).map((file) => compressImage(file))
      );

      form.setValue('images', [...currentImages, ...compressedImages]);
      toast.success('Images uploaded successfully');
    } catch {
      toast.error('Failed to upload images. Make sure each image is under 2MB');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images');
    form.setValue(
      'images',
      currentImages.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      addVisit({
        farmerId: id,
        ...values,
      });
      toast.success('Visit added successfully');
      router.push(`/farmers/${id}/visits`);
    } catch {
      toast.error('Failed to add visit');
    }
  };
  if (!farmer) {
    return <div>Farmer not found</div>;
  }
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Visit - {farmer.name}</h1>
          <p className="text-muted-foreground">{farmer.village}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextVisitDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Visit Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop health status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                          <img
                            src={image}
                            alt={`Visit photo ${index + 1}`}
                            className="object-cover rounded-lg w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {field.value.length < 5 && (
                        <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500 mt-2">
                            {uploading ? 'Uploading...' : 'Add Photos'}
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
            >
              Add Visit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/farmers/${id}/visits`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
