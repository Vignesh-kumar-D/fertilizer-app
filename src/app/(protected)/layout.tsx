// app/(protected)/layout.tsx
import AuthCheck from '@/components/auth/auth-check';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCheck>{children}</AuthCheck>;
}
