// src/app/purchases/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Crop, Farmer } from '@/types';
import { useFirebase } from '@/lib/firebase/firebase-context';

// Updated schema to include crop and quantity
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
});

export default function NewPurchaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getFarmers, getFarmerById, createPurchase } = useFirebase();

  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerCrops, setFarmerCrops] = useState<Crop[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const initialFarmerId = searchParams.get('farmerId');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      items: '',
      farmerId: initialFarmerId || '',
      cropId: '',
      quantity: 1,
      totalAmount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      notes: '',
    },
  });

  // Fetch all farmers
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

  // Load initial farmer if farmerId is provided
  useEffect(() => {
    const loadInitialFarmer = async () => {
      if (initialFarmerId) {
        try {
          const farmer = await getFarmerById(initialFarmerId);
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

    if (initialFarmerId) {
      loadInitialFarmer();
    }
  }, [initialFarmerId, getFarmerById, form]);

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

    if (farmerIdValue) {
      loadFarmerCrops();
    }
  }, [farmerIdValue, getFarmerById, form, initialFarmerId]);

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

      // Create purchase with Firebase
      await createPurchase({
        farmerId: values.farmerId,
        crop: selectedCrop,
        date: values.date,
        items: values.items,
        quantity: values.quantity,
        totalAmount: values.totalAmount,
        amountPaid: values.amountPaid,
        remainingAmount: values.remainingAmount,
        notes: values.notes || '',
      });

      toast.success('Purchase added successfully');
      router.push('/purchases');
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Failed to add purchase');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Add Purchase</h1>
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
                        defaultValue={field.value}
                        disabled={!!initialFarmerId || submitting}
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
                        defaultValue={field.value}
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
                        type="number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value));
                        }}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
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
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const total = parseFloat(e.target.value);
                            field.onChange(total);
                            const paid = form.getValues('amountPaid');
                            form.setValue('remainingAmount', total - paid);
                          }}
                          disabled={submitting}
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
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const paid = parseFloat(e.target.value);
                            field.onChange(paid);
                            const total = form.getValues('totalAmount');
                            form.setValue('remainingAmount', total - paid);
                          }}
                          disabled={submitting}
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

          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
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
    </div>
  );
}
