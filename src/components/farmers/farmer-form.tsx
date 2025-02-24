'use client';

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
import { useRouter } from 'next/navigation';
import { useMockData } from '@/lib/mock-data-context';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  village: z.string().min(2, 'Village name must be at least 2 characters'),
  crops: z.string().transform((str) => str.split(',').map((s) => s.trim())),
});

interface FarmerFormProps {
  farmerId?: string;
}

export function FarmerForm({ farmerId }: FarmerFormProps) {
  const router = useRouter();
  const { addFarmer, updateFarmer, getFarmerById } = useMockData();

  const existingFarmer = farmerId ? getFarmerById(farmerId) : undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingFarmer?.name || '',
      phone: existingFarmer?.phone || '',
      village: existingFarmer?.village || '',
      crops: existingFarmer?.crops || [''],
    },
  });

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
        });
        toast.success('Farmer added successfully');
      }
      router.push('/farmers');
    } catch {
      toast.error(`Something went wrong`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="village"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Village</FormLabel>
              <FormControl>
                <Input placeholder="Enter village name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="crops"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crops (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Wheat, Rice, Cotton" {...field} />
              </FormControl>
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
