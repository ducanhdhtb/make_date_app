import './globals.css';
import { ReactNode } from 'react';
import { AppShell } from '@/components/layout';
import { CallProvider } from '@/lib/call-context';
import { IncomingCallModal } from '@/components/incoming-call-modal';
import { OutgoingCallModal } from '@/components/outgoing-call-modal';
import { ActiveCallScreen } from '@/components/active-call-screen';

export const metadata = {
  title: 'NearMatch',
  description: 'Dating app MVP'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <CallProvider>
          <AppShell>{children}</AppShell>
          <IncomingCallModal />
          <OutgoingCallModal />
          <ActiveCallScreen />
        </CallProvider>
      </body>
    </html>
  );
}
