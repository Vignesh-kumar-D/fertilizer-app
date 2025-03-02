// src/components/auth/otp-verification-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
const formSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'Must be only digits'),
});

interface OtpVerificationFormProps {
  isLoading: boolean;
  phoneNumber: string;
  onVerify: (otp: string) => Promise<void>;
  onChangePhone: () => void;
}

export default function OtpVerificationForm({
  isLoading,
  phoneNumber,
  onVerify,
  onChangePhone,
}: OtpVerificationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onVerify(values.otp);
    } catch {
      toast.error('error  in verifying form');
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Enter the 6-digit code sent to
        <br />
        <span className="font-medium text-foreground">+91 {phoneNumber}</span>
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter 6-digit OTP"
                    type="text"
                    maxLength={6}
                    disabled={isLoading}
                    className="text-lg text-center letter-spacing-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onChangePhone}
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
