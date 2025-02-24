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
import { useRouter } from 'next/navigation';
import { useMockData } from '@/lib/mock-data-context';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  date: z.string(),
  nextVisitDate: z.string(),
  cropHealth: z.enum(['good', 'average', 'poor']),
  notes: z.string().min(1, 'Notes are required'),
  recommendations: z.string().min(1, 'Recommendations are required'),
  images: z.array(z.string()).default([]),
});

export default function AddVisit({ paramId }: { paramId: string }) {
  const router = useRouter();
  //   const unwrappedParams = use(Promise.resolve(params));

  const { getFarmerById, addVisit } = useMockData();
  const farmer = getFarmerById(paramId);

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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      addVisit({
        farmerId: paramId,
        ...values,
      });
      toast.success('Visit added successfully');
      router.push(`/farmers/${paramId}/visits`);
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
          <h1 className="text-2xl font-bold">Add Visit - {farmer?.name}</h1>
          <p className="text-muted-foreground">{farmer?.village}</p>
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
              onClick={() => router.push(`/farmers/${paramId}/visits`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
