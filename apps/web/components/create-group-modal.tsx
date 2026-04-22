'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

const FALLBACK = 'https://placehold.co/240x240/png';

type User = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string;
};

type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (groupId: string) => void;
};

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = getStoredUser();

  const filteredUsers = availableUsers.filter((user) =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedMembers.includes(user.id)
  );

  const loadAvailableUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<User[]>('/users/available');
      setAvailableUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setSearchQuery('');
      setError('');
    }
  }, [isOpen]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Tên nhóm không được để trống');
      return;
    }

    if (groupName.trim().length < 3) {
      setError('Tên nhóm phải có ít nhất 3 ký tự');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Phải chọn ít nhất 1 thành viên');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await apiFetch<{ id: string }>('/group-conversations', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim() || undefined,
          memberIds: selectedMembers,
        }),
      });

      onGroupCreated?.(response.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được nhóm');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Tạo nhóm mới</h2>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error ? <p style={{ color: '#be123c', marginBottom: 12 }}>{error}</p> : null}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          {/* Group Name */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Tên nhóm *
            </label>
            <input
              className="input"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm (tối thiểu 3 ký tự)"
              maxLength={100}
              disabled={creating}
            />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {groupName.length}/100
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Mô tả (tùy chọn)
            </label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả nhóm..."
              maxLength={500}
              rows={3}
              disabled={creating}
              style={{ fontFamily: 'inherit' }}
            />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {description.length}/500
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Chọn thành viên * ({selectedMembers.length} được chọn)
            </label>

            {/* Search */}
            <input
              className="input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thành viên..."
              disabled={creating || loading}
              style={{ marginBottom: 12 }}
            />

            {/* Selected Members */}
            {selectedMembers.length > 0 ? (
              <div style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  Đã chọn:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedMembers.map((memberId) => {
                    const user = availableUsers.find((u) => u.id === memberId);
                    return (
                      <button
                        key={memberId}
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => toggleMember(memberId)}
                        disabled={creating}
                      >
                        {user?.displayName || 'Thành viên'} ✕
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Available Users */}
            <div style={{ display: 'grid', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {loading ? (
                <p className="muted">Đang tải danh sách người dùng...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="muted">
                  {searchQuery ? 'Không tìm thấy người dùng' : 'Không có người dùng khả dụng'}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="btn btn-outline"
                    onClick={() => toggleMember(user.id)}
                    disabled={creating}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      textAlign: 'left',
                      background: selectedMembers.includes(user.id) ? '#fce7f3' : 'transparent',
                      borderColor: selectedMembers.includes(user.id) ? '#ec4899' : '#fbcfe8',
                    }}
                  >
                    <Image
                      src={user.avatarUrl || FALLBACK}
                      alt={user.displayName}
                      width={40}
                      height={40}
                      style={{ borderRadius: 999 }}
                      unoptimized
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{user.displayName}</div>
                      {user.email ? (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {user.email}
                        </div>
                      ) : null}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline"
              type="button"
              onClick={onClose}
              disabled={creating}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={creating || !groupName.trim() || selectedMembers.length === 0}
            >
              {creating ? 'Đang tạo...' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
