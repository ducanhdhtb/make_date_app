
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearSession, getStoredUser } from '@/lib/auth';
import { disconnectSocketClient, reconnectSocketClient, subscribeSocketState } from '@/lib/socket';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { SocketConnectionState } from '@/lib/types';

function SocketBanner() {
  const [state, setState] = useState<SocketConnectionState>('idle');

  useEffect(() => {
    const unsubscribe = subscribeSocketState(setState);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (state === 'connected' || state === 'idle') return null;

  const text = state === 'connecting'
    ? 'Đang kết nối realtime...'
    : state === 'reconnecting'
      ? 'Mất kết nối realtime, đang thử kết nối lại...'
      : state === 'error'
        ? 'Realtime đang lỗi kết nối.'
        : 'Realtime đang offline.';

  return (
    <div className="socket-banner">
      <span>{text}</span>
      <button className="btn btn-outline" type="button" onClick={() => reconnectSocketClient()}>Thử lại</button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; displayName: string } | null>(null);
  useEffect(() => { setUser(getStoredUser()); }, []);
  const onLogout = () => { disconnectSocketClient(); clearSession(); window.location.href = '/auth/login'; };

  return (
    <div className="page">
      <div className="container">
        <div className="navbar" style={{ marginBottom: 24 }}>
          <Link href="/" className="brand">NearMatch</Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'end' }}>
            {user ? <span className="muted">Xin chào, {user.displayName}</span> : null}
            {user ? (
              <>
                <Link className="btn btn-outline" href="/discover">Khám phá</Link>
                <Link className="btn btn-outline" href="/chats">Chats</Link>
                <NotificationDropdown />
                <button className="btn btn-primary" onClick={onLogout}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline" href="/auth/login">Đăng nhập</Link>
                <Link className="btn btn-primary" href="/auth/register">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
        <SocketBanner />
        {children}
      </div>
    </div>
  );
}

export function BottomNav() {
  return (
    <div className="bottom-nav" style={{ marginTop: 24 }}>
      <Link href="/discover">Khám phá</Link>
      <Link href="/matches">Matches</Link>
      <Link href="/chats">Chats</Link>
      <Link href="/notifications">Thông báo</Link>
      <Link href="/stories">Story</Link>
      <Link href="/profile/edit">Hồ sơ</Link>
    </div>
  );
}
