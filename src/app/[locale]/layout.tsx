import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Adjusted path relative to [locale] folder
import { cn } from '@/lib/utils';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { locales } from '@/i18n'; // Import locales from i18n config
import {unstable_setRequestLocale} from 'next-intl/server';
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

// Generate static params for locales
export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export const metadata: Metadata = {
  title: 'MoSCoW Realtime', // Stays the same, could be translated if needed via generateMetadata
  description: 'Collaborative MoSCoW prioritization in real-time.', // Stays the same, could be translated if needed
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function RootLayout({
  children,
  params: { locale }
}: Readonly<RootLayoutProps>) {
  // Enable static rendering
  unstable_setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = useMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
           <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
             {children}
           </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
