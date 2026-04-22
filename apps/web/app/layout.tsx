import './globals.css';
import { ReactNode } from 'react';
import { AppShell } from '@/components/layout';

export const metadata = {
  title: 'NearMatch',
  description: 'Dating app MVP'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
