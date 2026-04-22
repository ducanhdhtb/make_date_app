'use client';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { DiscoverUser } from '@/lib/types';
const FALLBACK = 'https://placehold.co/800x800/png';
export function UserCard({ user, onLiked }: { user: DiscoverUser; onLiked?: () => void }) {
  const handleLike = async () => { try { await apiFetch('/likes', { method: 'POST', body: JSON.stringify({ targetUserId: user.id }) }); alert(`Đã thả tim ${user.displayName}`); onLiked?.(); } catch (error) { alert(error instanceof Error ? error.message : 'Không thể thả tim'); } };
  return <div className="card user-card"><Image src={user.avatarUrl || FALLBACK} alt={user.displayName} width={800} height={800} unoptimized /><div style={{ marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><h3 style={{ margin: 0 }}>{user.displayName}, {user.age}</h3><div className="muted">{user.jobTitle || 'Đang cập nhật nghề nghiệp'}</div></div><div className="muted">{user.distanceKm} km</div></div><p className="muted">{user.bio || 'Chưa có bio.'}</p><div className="pill-list" style={{ marginBottom: 12 }}>{user.interests.slice(0,4).map((item) => <span key={item} className="pill">{item}</span>)}</div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link className="btn btn-outline" href={`/profile?id=${user.id}`}>Xem profile</Link><button className="btn btn-secondary" type="button">Gửi lời mời</button><button className="btn btn-primary" type="button" onClick={handleLike}>Thả tim</button></div></div></div>;
}
