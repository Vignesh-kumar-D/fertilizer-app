// src/app/purchases/new/page.tsx
'use client';

import { useState } from 'react';
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Farmer } from '@/types/farmer';

const formSchema = z.object({
  farmerId: z.string().min(1, 'Please select a farmer'),
  date: z.string(),
  items: z.array(z.string()).min(1, 'Add at least one item'),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0),
  remainingAmount: z.number(),
  paymentMode: z.enum(['cash', 'upi']),
  notes: z.string().optional(),
});

export default function AddPurchasePage() {
  const router = useRouter();
  const { farmers, addPurchase } = useMockData();
  const [items, setItems] = useState(['']);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      items: [''],
      totalAmount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      paymentMode: 'cash',
      notes: '',
    },
  });

  const addItem = () => {
    setItems([...items, '']);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    form.setValue(
      'items',
      newItems.filter((item) => item !== '')
    );
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    form.setValue(
      'items',
      newItems.filter((item) => item !== '')
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      addPurchase({
        ...values,
        items: values.items.filter((item) => item !== ''),
      });
      toast.success('Purchase added successfully');
      router.push('/purchases');
    } catch {
      toast.error('Failed to add purchase');
    }
  };

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
                          {farmers.map((farmer: Farmer) => (
                            <SelectItem key={farmer.id} value={farmer.id}>
                              {farmer.name} - {farmer.village}
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
                        <Input type="date" {...field} />
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Items</h2>
                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Enter item name"
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
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
                        <Input type="number" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          className="bg-white"
                          align="start"
                        >
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes..."
                          className="min-h-[100px]"
                          {...field}
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
            >
              Add Purchase
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/purchases')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
