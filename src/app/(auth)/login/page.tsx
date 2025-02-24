// src/app/(auth)/login/page.tsx
'use client';

import OtpVerificationForm from '@/components/auth/otp-verification-form';
import PhoneLoginForm from '@/components/auth/phone-login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const handlePhoneSubmit = async (phone: string) => {
    setPhoneNumber(phone);
    setIsVerifying(true);
  };

  const handleOtpVerify = async (otp: string) => {
    router.push('/farmers');
    console.log('Verifying OTP:', otp);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isVerifying ? 'Verify OTP' : 'Welcome Back'}
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {isVerifying
              ? 'Enter the verification code to continue'
              : 'Enter your phone number to login'}
          </p>
        </CardHeader>
        <CardContent>
          {!isVerifying ? (
            <PhoneLoginForm onSubmit={handlePhoneSubmit} />
          ) : (
            <OtpVerificationForm
              phoneNumber={phoneNumber}
              onVerify={handleOtpVerify}
              onChangePhone={() => setIsVerifying(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
