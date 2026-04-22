'use client';
import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/layout';
import { SafetyActions } from '@/components/safety-actions';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { ProfileDetail } from '@/lib/types';
const FALLBACK='https://placehold.co/1000x700/png';

function ProfileContent() {
  const params = useSearchParams();
  const profileId = params.get('id');
  const [user, setUser] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/auth/login';
      return;
    }
    if (!profileId) {
      setError('Thiếu id profile');
      setLoading(false);
      return;
    }
    apiFetch<ProfileDetail>(`/users/${profileId}`)
      .then(setUser)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được profile'))
      .finally(() => setLoading(false));
  }, [profileId]);

  const onLike = async () => {
    if (!user) return;
    try {
      const result = await apiFetch<any>('/likes', { method: 'POST', body: JSON.stringify({ targetUserId: user.id }) });
      alert(result?.matched ? 'Đã match thành công' : 'Đã thả tim');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể thả tim');
    }
  };

  const onShare = async () => {
    if (!user) return;
    const link = `${window.location.origin}/profile?id=${user.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${user.displayName} trên NearMatch`, text: 'Xem hồ sơ này nhé', url: link });
      } else {
        await navigator.clipboard.writeText(link);
        alert('Đã copy link profile');
      }
      await apiFetch('/shares', { method: 'POST', body: JSON.stringify({ targetType: 'profile', targetId: user.id, channel: typeof navigator.share === 'function' ? 'web_share' : 'copy_link' }) });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể chia sẻ');
    }
  };

  return (
    <div>
      <a href="/discover" className="muted">&lt; Quay lại</a>
      {loading ? <div className="card" style={{ marginTop: 16 }}>Đang tải profile...</div> : null}
      {error ? <div className="card" style={{ marginTop: 16, color: '#be123c' }}>{error}</div> : null}
      {user ? (
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="card">
            <Image className="profile-cover" src={user.avatarUrl || user.photos[0]?.photoUrl || FALLBACK} alt={user.displayName} width={1000} height={700} unoptimized />
            {user.photos.length ? (
              <div className="grid-2" style={{ marginTop: 16, gap: 12 }}>
                {user.photos.slice(0, 4).map((photo) => (
                  <Image key={photo.id} src={photo.photoUrl} alt={user.displayName} width={300} height={220} style={{ width: '100%', height: 160, borderRadius: 16, objectFit: 'cover' }} unoptimized />
                ))}
              </div>
            ) : null}
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0 }}>{user.displayName}, {user.age}</h1>
                <div className="muted">{user.jobTitle || 'Đang cập nhật nghề nghiệp'}</div>
              </div>
              <div className="muted">{user.distanceKm ? `Cách ${user.distanceKm} km` : 'Khoảng cách ẩn'}</div>
            </div>
            <p style={{ marginTop: 20 }}>{user.bio || 'Người dùng chưa cập nhật bio.'}</p>
            <div className="pill-list" style={{ marginBottom: 18 }}>{user.interests.map((item) => <span key={item} className="pill">{item}</span>)}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="button" onClick={onLike}>Thả tim</button>
              <button className="btn btn-outline" type="button" onClick={onShare}>Chia sẻ</button>
              <SafetyActions
                targetUserId={user.id}
                targetUserName={user.displayName}
                onBlocked={() => {
                  alert('Đã chặn người dùng');
                  window.location.href = '/discover';
                }}
                onReported={() => alert('Đã gửi report')}
              />
            </div>
            <div className="card" style={{ marginTop: 20, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Story gần nhất</h3>
              {user.latestStory ? (
                user.latestStory.mediaType === 'image' ? (
                  <Image src={user.latestStory.mediaUrl || FALLBACK} alt="Story" width={800} height={500} style={{ width: '100%', height: 180, borderRadius: 16, objectFit: 'cover' }} unoptimized />
                ) : (
                  <div style={{ minHeight: 140, borderRadius: 18, background: 'linear-gradient(135deg,#f9a8d4,#c4b5fd)', padding: 20, color: '#fff', display: 'flex', alignItems: 'end' }}><strong>{user.latestStory.textContent}</strong></div>
                )
              ) : <p className="muted">Chưa có story mới.</p>}
            </div>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 16 }}>Đang tải...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
