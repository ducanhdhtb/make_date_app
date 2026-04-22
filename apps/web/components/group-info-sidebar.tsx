'use client';

import Image from 'next/image';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

const FALLBACK = 'https://placehold.co/240x240/png';

type GroupMember = {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    email?: string;
  };
};

type GroupConversation = {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
};

type GroupInfoSidebarProps = {
  group: GroupConversation;
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated?: (group: GroupConversation) => void;
};

export function GroupInfoSidebar({ group, isOpen, onClose, onGroupUpdated }: GroupInfoSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description || '');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  const currentUser = getStoredUser();
  const isOwner = group.createdByUserId === currentUser?.id;
  const currentMember = group.members.find((m) => m.userId === currentUser?.id);

  const handleUpdateGroup = async () => {
    if (!editName.trim()) {
      setError('Tên nhóm không được để trống');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const updated = await apiFetch<GroupConversation>(`/group-conversations/${group.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }),
      });

      onGroupUpdated?.(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được nhóm');
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Bạn chắc chắn muốn rời nhóm này?')) return;

    try {
      await apiFetch(`/group-conversations/${group.id}/leave`, {
        method: 'POST',
      });
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không rời được nhóm');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa thành viên này?')) return;

    try {
      await apiFetch(`/group-conversations/${group.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      // Reload group info
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không xóa được thành viên');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: 'white',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        padding: 24,
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Thông tin nhóm</h2>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {error ? <p style={{ color: '#be123c', marginBottom: 12 }}>{error}</p> : null}

      {/* Group Avatar & Name */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Image
          src={group.avatarUrl || FALLBACK}
          alt={group.name}
          width={120}
          height={120}
          style={{ borderRadius: 999, marginBottom: 16 }}
          unoptimized
        />

        {isEditing ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              className="input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Tên nhóm"
              disabled={updating}
              maxLength={100}
            />
            <textarea
              className="input"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Mô tả nhóm"
              disabled={updating}
              maxLength={500}
              rows={3}
              style={{ fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(group.name);
                  setEditDescription(group.description || '');
                }}
                disabled={updating}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleUpdateGroup}
                disabled={updating}
              >
                {updating ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>{group.name}</h3>
            {group.description ? (
              <p className="muted" style={{ marginBottom: 12 }}>
                {group.description}
              </p>
            ) : null}
            {isOwner ? (
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Chỉnh sửa
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Group Info */}
      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              Tạo bởi
            </div>
            <div style={{ fontWeight: 500 }}>
              {group.members.find((m) => m.userId === group.createdByUserId)?.user.displayName || 'Ẩn danh'}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              Ngày tạo
            </div>
            <div style={{ fontWeight: 500 }}>
              {new Date(group.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              Cập nhật lần cuối
            </div>
            <div style={{ fontWeight: 500 }}>
              {new Date(group.updatedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>Thành viên ({group.members.length})</h4>
          {isOwner ? (
            <button
              className="btn btn-outline btn-xs"
              type="button"
              onClick={() => setShowAddMember(!showAddMember)}
            >
              + Thêm
            </button>
          ) : null}
        </div>

        {showAddMember ? (
          <div style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
            <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Tính năng thêm thành viên đang phát triển...
            </p>
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: 8 }}>
          {group.members.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                background: '#f9fafb',
              }}
            >
              <Image
                src={member.user.avatarUrl || FALLBACK}
                alt={member.user.displayName}
                width={40}
                height={40}
                style={{ borderRadius: 999 }}
                unoptimized
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>
                  {member.user.displayName}
                  {member.userId === currentUser?.id ? ' (Bạn)' : ''}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {member.role === 'owner' ? '👑 Chủ nhóm' : member.role === 'admin' ? '⭐ Quản trị viên' : 'Thành viên'}
                </div>
              </div>
              {isOwner && member.userId !== currentUser?.id ? (
                <button
                  className="btn btn-outline btn-xs"
                  type="button"
                  onClick={() => handleRemoveMember(member.userId)}
                >
                  Xóa
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gap: 8 }}>
        {isOwner ? (
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => {
              if (confirm('Bạn chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác.')) {
                apiFetch(`/group-conversations/${group.id}`, { method: 'DELETE' })
                  .then(() => {
                    onClose();
                    window.location.reload();
                  })
                  .catch((err) => alert(err instanceof Error ? err.message : 'Không xóa được nhóm'));
              }
            }}
          >
            🗑️ Xóa nhóm
          </button>
        ) : null}
        {currentMember?.userId === currentUser?.id && !isOwner ? (
          <button
            className="btn btn-outline"
            type="button"
            onClick={handleLeaveGroup}
          >
            👋 Rời nhóm
          </button>
        ) : null}
      </div>
    </div>
  );
}
