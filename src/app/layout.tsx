import type { Metadata } from 'next';
// Corrected import for next/font/google
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { cn } from '@/lib/utils'; // Import cn utility

export const metadata: Metadata = {
  title: 'MoSCoW Realtime', // Updated App Name
  description: 'Collaborative MoSCoW prioritization in real-time.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Add suppressHydrationWarning if using dark mode toggle later */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable, // Use the generated variable name directly
          GeistMono.variable // Use the generated variable name directly
        )}
      >
        {children}
      </body>
    </html>
  );
}
