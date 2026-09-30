import type { Metadata, Viewport } from 'next';
import './globals.css';
import { InstallProvider } from '@/components/pwa/install-provider';

export const metadata: Metadata = {
  title: 'Sheep-In',
  description: 'Aplikasi rekording dan evaluasi ternak domba',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Sheep-In',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6efe7',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col"><InstallProvider>{children}</InstallProvider></body>
    </html>
  );
}
