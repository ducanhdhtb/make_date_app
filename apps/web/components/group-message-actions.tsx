'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type GroupMessage = {
  id: string;
  textContent?: string | null;
  mediaUrl?: string | null;
  sender: { id: string; displayName: string };
  recalledAt?: string | null;
  deletedAt?: string | null;
  pinnedAt?: string | null;
};

type GroupMessageActionsProps = {
  message: GroupMessage;
  groupId: string;
  isOwn: boolean;
  isOwnerOrAdmin: boolean;
  onReply?: (message: GroupMessage) => void;
  onReactionAdded?: (emoji: string) => void;
  onMessageUpdated?: (message: GroupMessage) => void;
};

export function GroupMessageActions({
  message,
  groupId,
  isOwn,
  isOwnerOrAdmin,
  onReply,
  onReactionAdded,
  onMessageUpdated,
}: GroupMessageActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const reactionEmojis = ['❤️', '👍', '😂', '😍', '😮'];

  const handleReaction = async (emoji: string) => {
    setLoading(true);
    try {
      await apiFetch(`/group-conversations/${groupId}/messages/${message.id}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      onReactionAdded?.(emoji);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thêm được cảm xúc');
    } finally {
      setLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!confirm('Bạn chắc chắn muốn thu hồi tin nhắn này?')) return;

    setLoading(true);
    try {
      const updated = await apiFetch<GroupMessage>(
        `/group-conversations/${groupId}/messages/${message.id}/recall`,
        { method: 'PATCH' }
      );
      onMessageUpdated?.(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thu hồi được tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn chắc chắn muốn xóa tin nhắn này?')) return;

    setLoading(true);
    try {
      const updated = await apiFetch<GroupMessage>(
        `/group-conversations/${groupId}/messages/${message.id}`,
        { method: 'DELETE' }
      );
      onMessageUpdated?.(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không xóa được tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async () => {
    setLoading(true);
    try {
      const updated = await apiFetch<GroupMessage>(
        `/group-conversations/${groupId}/messages/${message.id}/pin`,
        { method: 'PATCH' }
      );
      onMessageUpdated?.(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không ghim được tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async () => {
    setLoading(true);
    try {
      const updated = await apiFetch<GroupMessage>(
        `/group-conversations/${groupId}/messages/${message.id}/pin`,
        { method: 'DELETE' }
      );
      onMessageUpdated?.(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không bỏ ghim được tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const isActionDisabled = Boolean(message.recalledAt || message.deletedAt || loading);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-outline btn-xs"
        type="button"
        onClick={() => setShowActions(!showActions)}
        disabled={isActionDisabled}
      >
        ⋮
      </button>

      {showActions ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            background: 'white',
            border: '1px solid #fbcfe8',
            borderRadius: 8,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: 200,
            marginBottom: 8,
          }}
        >
          {/* Quick Reactions */}
          <div style={{ padding: 8, borderBottom: '1px solid #fbcfe8', display: 'flex', gap: 4 }}>
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                className="btn btn-outline btn-xs"
                type="button"
                onClick={() => {
                  handleReaction(emoji);
                  setShowActions(false);
                }}
                disabled={loading}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gap: 0 }}>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                onReply?.(message);
                setShowActions(false);
              }}
              disabled={isActionDisabled}
              style={{ borderRadius: 0, borderBottom: '1px solid #fbcfe8' }}
            >
              💬 Trả lời
            </button>

            {isOwnerOrAdmin ? (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  message.pinnedAt ? handleUnpin() : handlePin();
                  setShowActions(false);
                }}
                disabled={loading}
                style={{ borderRadius: 0, borderBottom: '1px solid #fbcfe8' }}
              >
                {message.pinnedAt ? '📌 Bỏ ghim' : '📌 Ghim'}
              </button>
            ) : null}

            {isOwn ? (
              <>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => {
                    handleRecall();
                    setShowActions(false);
                  }}
                  disabled={loading}
                  style={{ borderRadius: 0, borderBottom: '1px solid #fbcfe8' }}
                >
                  🔄 Thu hồi
                </button>

                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => {
                    handleDelete();
                    setShowActions(false);
                  }}
                  disabled={loading}
                  style={{ borderRadius: 0 }}
                >
                  🗑️ Xóa
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
