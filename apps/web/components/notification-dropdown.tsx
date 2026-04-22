'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { NotificationItem } from '@/lib/types';
import { getSocketClient } from '@/lib/socket';

export function NotificationDropdown() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const load = async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<NotificationItem[]>('/notifications');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) return;

    const onNotificationNew = (notification: NotificationItem) => {
      setItems((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)]);
    };

    const onNotificationReadAll = (event: { readAt?: string }) => {
      setItems((prev) => prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: event.readAt || new Date().toISOString()
      })));
    };

    socket.on('notification.new', onNotificationNew);
    socket.on('notification.read_all', onNotificationReadAll);

    return () => {
      socket.off('notification.new', onNotificationNew);
      socket.off('notification.read_all', onNotificationReadAll);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể đánh dấu đã đọc');
    }
  };

  if (!getAccessToken()) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-outline" type="button" onClick={() => setOpen((v) => !v)}>
        Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ''}
      </button>
      {open ? (
        <div className="dropdown-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <strong>Thông báo</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={load}>Tải lại</button>
              <button type="button" className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={markAllRead}>Đọc hết</button>
            </div>
          </div>
          {loading ? <div className="muted">Đang tải...</div> : null}
          {error ? <div style={{ color: '#be123c' }}>{error}</div> : null}
          {!loading && items.length === 0 ? <div className="muted">Chưa có thông báo nào.</div> : null}
          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {items.slice(0, 5).map((item) => {
              const targetConversationId = typeof item.data?.conversationId === 'string' ? item.data.conversationId : '';
              const href = targetConversationId ? `/chats?conversationId=${targetConversationId}` : '/notifications';
              return (
                <Link key={item.id} href={href} className="mini-item" style={{ background: item.isRead ? '#fff' : '#fff1f6' }} onClick={() => setOpen(false)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{item.title}</strong>
                    {!item.isRead ? <span className="pill">Mới</span> : null}
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>{item.body || 'Bạn có một cập nhật mới.'}</div>
                </Link>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href="/notifications" className="btn btn-primary" onClick={() => setOpen(false)}>Xem tất cả</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
