'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { NotificationItem } from '@/lib/types';
import { getSocketClient } from '@/lib/socket';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!getAccessToken()) {
      window.location.href = '/auth/login';
      return;
    }
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

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Thông báo</h1>
            <div className="muted">Realtime cho match mới, tin nhắn mới và cập nhật hệ thống.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" type="button" onClick={load}>Tải lại</button>
            <button className="btn btn-primary" type="button" onClick={markAllRead}>Đánh dấu đã đọc</button>
          </div>
        </div>
        {error ? <p style={{ color: '#be123c' }}>{error}</p> : null}
        {loading ? <p>Đang tải thông báo...</p> : null}
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          {items.map((item) => {
            const targetConversationId = typeof item.data?.conversationId === 'string' ? item.data.conversationId : '';
            const href = targetConversationId ? `/chats?conversationId=${targetConversationId}` : '/notifications';
            return (
              <Link key={item.id} href={href} className="mini-item" style={{ background: item.isRead ? '#fff' : '#fff1f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div>
                    <strong>{item.title}</strong>
                    <div className="muted" style={{ marginTop: 4 }}>{item.body || 'Không có nội dung chi tiết.'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {!item.isRead ? <span className="pill">Mới</span> : null}
                    <div className="muted" style={{ marginTop: 6 }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {!loading && items.length === 0 ? <p className="muted">Bạn chưa có thông báo nào.</p> : null}
      </div>
      <BottomNav />
    </div>
  );
}
