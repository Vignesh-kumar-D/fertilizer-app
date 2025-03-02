// src/app/(auth)/login/page.tsx
'use client';

import OtpVerificationForm from '@/components/auth/otp-verification-form';
import PhoneLoginForm from '@/components/auth/phone-login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
export default function LoginPage() {
  const { signInWithPhone, verifyOtp } = useFirebase();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmitPhone = async (phoneNumberSubmitted: string) => {
    setIsLoading(true);
    try {
      const id = await signInWithPhone(`+91${phoneNumberSubmitted}`);
      setVerificationId(id);
      setPhoneNumber(phoneNumberSubmitted);
    } catch {
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!verificationId) {
      return;
    }

    setIsLoading(true);

    try {
      await verifyOtp(verificationId, otp);
      router.push('/dashboard');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {verificationId ? 'Verify OTP' : 'Welcome Back'}
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {verificationId
              ? 'Enter the verification code to continue'
              : 'Enter your phone number to login'}
          </p>
        </CardHeader>
        <CardContent>
          {!verificationId ? (
            <PhoneLoginForm onSubmit={handleSubmitPhone} />
          ) : (
            <OtpVerificationForm
              isLoading={isLoading}
              phoneNumber={phoneNumber}
              onVerify={handleVerifyOtp}
              onChangePhone={() => setVerificationId(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
