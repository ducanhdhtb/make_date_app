'use client';

import { Suspense, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import Link from 'next/link';

type NotificationPreferences = {
  id: string;
  newMatch: boolean;
  newMessage: boolean;
  newLike: boolean;
  incomingCall: boolean;
  missedCall: boolean;
  storyReaction: boolean;
  groupMessage: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
};

function PreferencesContent() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/auth/login';
      return;
    }
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await apiFetch<NotificationPreferences>('/notifications/preferences');
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    setPreferences({ ...preferences, [key]: value });
    setSaving(true);
    setSaved(false);

    try {
      await apiFetch<NotificationPreferences>('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ [key]: value })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setPreferences({ ...preferences, [key]: !value });
    } finally {
      setSaving(false);
    }
  };

  const toggleItems: { key: keyof NotificationPreferences; label: string; description: string; icon: string }[] = [
    { key: 'newMatch', label: 'Match mới', description: 'Khi có ai đó match với bạn', icon: '💕' },
    { key: 'newMessage', label: 'Tin nhắn mới', description: 'Khi có tin nhắn mới từ match', icon: '💬' },
    { key: 'newLike', label: 'Like mới', description: 'Khi có ai đó thả tim bạn', icon: '❤️' },
    { key: 'incomingCall', label: 'Cuộc gọi đến', description: 'Khi có cuộc gọi video/voice', icon: '📞' },
    { key: 'missedCall', label: 'Cuộc gọi nhỡ', description: 'Khi bạn bỏ lỡ cuộc gọi', icon: '📵' },
    { key: 'storyReaction', label: 'Reaction story', description: 'Khi có ai reaction story của bạn', icon: '😍' },
    { key: 'groupMessage', label: 'Tin nhắn nhóm', description: 'Khi có tin nhắn mới trong nhóm', icon: '👥' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            Đang tải...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/notifications" className="text-gray-500 hover:text-gray-700">
                ← Quay lại
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Cài đặt thông báo</h1>
            </div>
            {saving && <span className="text-sm text-gray-500">Đang lưu...</span>}
            {saved && <span className="text-sm text-green-600">✓ Đã lưu</span>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Push Notifications */}
        <div className="card mb-4">
          <h2 className="text-lg font-semibold mb-4">🔔 Thông báo đẩy</h2>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium">Bật thông báo đẩy</div>
              <div className="text-sm text-gray-500">Nhận thông báo trên trình duyệt</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.pushEnabled ?? true}
                onChange={(e) => updatePreference('pushEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">Âm thanh thông báo</div>
              <div className="text-sm text-gray-500">Phát âm khi có thông báo</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.soundEnabled ?? true}
                onChange={(e) => updatePreference('soundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📱 Loại thông báo</h2>
          <p className="text-sm text-gray-500 mb-4">Chọn những thông báo bạn muốn nhận</p>

          <div className="space-y-1">
            {toggleItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(preferences?.[item.key] ?? true)}
                    onChange={(e) => updatePreference(item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">ℹ️ Lưu ý</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Thông báo đẩy yêu cầu quyền từ trình duyệt</li>
            <li>• Bạn có thể tắt thông báo bất cứ lúc nào</li>
            <li>• Thông báo trong app vẫn hoạt động ngay cả khi tắt push</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 16 }}>Đang tải...</div>}>
      <PreferencesContent />
    </Suspense>
  );
}
