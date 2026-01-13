/**
 * Minimal root layout for API-only Next.js app
 * No UI components needed - this is just for metadata
 */

export const metadata = {
  title: 'Framer-Supabase API',
  description: 'Backend API layer for Framer website',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
