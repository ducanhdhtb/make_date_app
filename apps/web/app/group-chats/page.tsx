'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from '@/components/layout';
import { CreateGroupModal } from '@/components/create-group-modal';
import { GroupInfoSidebar } from '@/components/group-info-sidebar';
import { GroupMessageActions } from '@/components/group-message-actions';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth';
import { getSocketClient, subscribeSocketState } from '@/lib/socket';
import { SocketConnectionState } from '@/lib/types';

const FALLBACK = 'https://placehold.co/240x240/png';

type GroupConversation = {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  messages?: GroupMessage[];
};

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

type GroupMessage = {
  id: string;
  groupConversationId: string;
  senderUserId: string;
  textContent?: string | null;
  mediaUrl?: string | null;
  messageType: string;
  createdAt: string;
  recalledAt?: string | null;
  deletedAt?: string | null;
  pinnedAt?: string | null;
  sender: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  reactions?: GroupMessageReaction[];
  parentMessage?: {
    id: string;
    textContent?: string | null;
    sender: { displayName: string };
  } | null;
};

type GroupMessageReaction = {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: { id: string; displayName: string }[];
};

type GroupMessageNewEvent = {
  groupConversationId: string;
  message: GroupMessage;
};

type GroupMessageUpdatedEvent = {
  groupConversationId: string;
  message: GroupMessage;
  action?: string;
};

type GroupMessageReactionUpdatedEvent = {
  groupConversationId: string;
  messageId: string;
  reactions: GroupMessageReaction[];
};

type GroupMemberAddedEvent = {
  groupConversationId: string;
  member: GroupMember;
  user: GroupMember['user'];
};

type GroupMemberRemovedEvent = {
  groupConversationId: string;
  userId: string;
};

type GroupUpdatedEvent = {
  groupConversationId: string;
  group: GroupConversation;
  action?: string;
};

type GroupTypingEvent = {
  groupConversationId: string;
  userId: string;
  displayName?: string;
};

export default function GroupChatsPage() {
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketState, setSocketState] = useState<SocketConnectionState>('idle');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const joinedGroupRef = useRef('');
  const typingIdleTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const currentUser = getStoredUser();

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ data: GroupConversation[] }>('/group-conversations');
      setGroups(data.data || []);
      if (!selectedGroupId && data.data?.[0]) {
        setSelectedGroupId(data.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách nhóm');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = (groupId: string) => {
    loadGroups();
    setSelectedGroupId(groupId);
  };

  const loadMessages = async (groupId: string) => {
    setError('');
    setMessages([]);
    try {
      const data = await apiFetch<{ items: GroupMessage[] }>(`/group-conversations/${groupId}/messages?limit=50`);
      setMessages(data.items || []);
      
      setTimeout(() => {
        const box = chatBoxRef.current;
        if (box) box.scrollTop = box.scrollHeight;
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được tin nhắn');
    }
  };

  const emitTypingStop = () => {
    if (!selectedGroupId || !isTypingRef.current) return;
    const socket = getSocketClient();
    socket?.emit('group.typing.stop', { groupConversationId: selectedGroupId });
    isTypingRef.current = false;
  };

  const scheduleTypingStop = () => {
    if (typingIdleTimerRef.current) window.clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = window.setTimeout(() => emitTypingStop(), 1600);
  };

  const emitTypingStart = () => {
    if (!selectedGroupId || !currentUser) return;
    const socket = getSocketClient();
    if (!socket) return;
    if (!isTypingRef.current) {
      socket.emit('group.typing.start', { 
        groupConversationId: selectedGroupId, 
        displayName: currentUser.displayName 
      });
      isTypingRef.current = true;
    }
    scheduleTypingStop();
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || (!messageText.trim() && !imageFile) || !currentUser) return;

    const textSnapshot = messageText;
    const fileSnapshot = imageFile;
    const previewSnapshot = imagePreviewUrl;
    const replySnapshot = replyTo;

    setSending(true);
    emitTypingStop();
    setMessageText('');
    setImageFile(null);
    setImagePreviewUrl('');
    setReplyTo(null);

    try {
      if (fileSnapshot) {
        // Upload image
        const token = getAccessToken();
        if (!token) throw new Error('Thiếu access token');

        const formData = new FormData();
        formData.append('file', fileSnapshot);
        if (textSnapshot.trim()) formData.append('textContent', textSnapshot.trim());
        if (replySnapshot?.id) formData.append('parentMessageId', replySnapshot.id);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/group-conversations/${selectedGroupId}/messages/image`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error('Upload ảnh thất bại'));
            }
          };
          xhr.onerror = () => reject(new Error('Không thể kết nối khi upload ảnh'));
          xhr.send(formData);
        });
      } else {
        // Send text message
        await apiFetch(`/group-conversations/${selectedGroupId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            textContent: textSnapshot.trim(),
            parentMessageId: replySnapshot?.id || undefined,
          }),
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không gửi được tin nhắn');
      setMessageText(textSnapshot);
      setImageFile(fileSnapshot);
      setImagePreviewUrl(previewSnapshot);
      setReplyTo(replySnapshot);
    } finally {
      setSending(false);
    }
  };

  const handleSelectImage = (file: File | null) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl('');
      return;
    }
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedGroupId) return;
    const message = messages.find((m) => m.id === messageId);
    const reacted = message?.reactions?.some((r) => r.emoji === emoji && r.reacted);

    try {
      const reactions = reacted
        ? await apiFetch<GroupMessageReaction[]>(
            `/group-conversations/${selectedGroupId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
            { method: 'DELETE' }
          )
        : await apiFetch<GroupMessageReaction[]>(
            `/group-conversations/${selectedGroupId}/messages/${messageId}/reactions`,
            { method: 'POST', body: JSON.stringify({ emoji }) }
          );
      
      setMessages((prev) => 
        prev.map((m) => m.id === messageId ? { ...m, reactions } : m)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không cập nhật được cảm xúc');
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => subscribeSocketState(setSocketState), []);

  useEffect(() => {
    if (selectedGroupId) {
      loadMessages(selectedGroupId);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    emitTypingStop();
    setTypingUsers({});
  }, [selectedGroupId]);

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket || !currentUser) return;

    const onGroupMessageNew = (event: GroupMessageNewEvent) => {
      if (event.groupConversationId === selectedGroupId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [...prev, event.message];
        });
        
        setTimeout(() => {
          const box = chatBoxRef.current;
          if (box) box.scrollTop = box.scrollHeight;
        }, 50);
      }

      setGroups((prev) =>
        prev.map((g) =>
          g.id === event.groupConversationId
            ? { ...g, updatedAt: event.message.createdAt, messages: [event.message] }
            : g
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    };

    const onGroupMessageUpdated = (event: GroupMessageUpdatedEvent) => {
      if (event.groupConversationId === selectedGroupId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.message.id ? { ...m, ...event.message } : m))
        );
      }
    };

    const onGroupMessageReactionUpdated = (event: GroupMessageReactionUpdatedEvent) => {
      if (event.groupConversationId === selectedGroupId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.messageId ? { ...m, reactions: event.reactions } : m))
        );
      }
    };

    const onGroupMemberAdded = (event: GroupMemberAddedEvent) => {
      if (event.groupConversationId === selectedGroupId) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === event.groupConversationId
              ? { ...g, members: [...g.members, event.member] }
              : g
          )
        );
      }
    };

    const onGroupMemberRemoved = (event: GroupMemberRemovedEvent) => {
      if (event.groupConversationId === selectedGroupId) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === event.groupConversationId
              ? { ...g, members: g.members.filter((m) => m.userId !== event.userId) }
              : g
          )
        );
      }
    };

    const onGroupUpdated = (event: GroupUpdatedEvent) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === event.groupConversationId ? { ...g, ...event.group } : g))
      );
    };

    const onGroupTypingStart = (event: GroupTypingEvent) => {
      if (event.groupConversationId !== selectedGroupId) return;
      if (event.userId === currentUser.id) return;
      setTypingUsers((prev) => ({ ...prev, [event.userId]: event.displayName || 'Thành viên' }));
    };

    const onGroupTypingStop = (event: GroupTypingEvent) => {
      if (event.groupConversationId !== selectedGroupId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[event.userId];
        return next;
      });
    };

    socket.on('group.message.new', onGroupMessageNew);
    socket.on('group.message.updated', onGroupMessageUpdated);
    socket.on('group.message.reaction_updated', onGroupMessageReactionUpdated);
    socket.on('group.member.added', onGroupMemberAdded);
    socket.on('group.member.removed', onGroupMemberRemoved);
    socket.on('group.updated', onGroupUpdated);
    socket.on('group.typing.start', onGroupTypingStart);
    socket.on('group.typing.stop', onGroupTypingStop);

    return () => {
      socket.off('group.message.new', onGroupMessageNew);
      socket.off('group.message.updated', onGroupMessageUpdated);
      socket.off('group.message.reaction_updated', onGroupMessageReactionUpdated);
      socket.off('group.member.added', onGroupMemberAdded);
      socket.off('group.member.removed', onGroupMemberRemoved);
      socket.off('group.updated', onGroupUpdated);
      socket.off('group.typing.start', onGroupTypingStart);
      socket.off('group.typing.stop', onGroupTypingStop);
    };
  }, [currentUser?.id, selectedGroupId]);

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket || !selectedGroupId) return;

    if (joinedGroupRef.current && joinedGroupRef.current !== selectedGroupId) {
      socket.emit('group.leave', { groupConversationId: joinedGroupRef.current });
    }

    joinedGroupRef.current = selectedGroupId;
    socket.emit('group.join', { groupConversationId: selectedGroupId });

    return () => {
      if (joinedGroupRef.current === selectedGroupId) {
        socket.emit('group.leave', { groupConversationId: selectedGroupId });
        joinedGroupRef.current = '';
      }
    };
  }, [selectedGroupId]);

  useEffect(() => {
    return () => {
      emitTypingStop();
      if (typingIdleTimerRef.current) window.clearTimeout(typingIdleTimerRef.current);
    };
  }, []);

  const typingNames = Object.values(typingUsers);
  const memberCount = selectedGroup?.members.length || 0;

  return (
    <div>
      <div className="grid-2">
        {/* Left Sidebar - Group List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0 }}>Nhóm Chat</h1>
            <button 
              className="btn btn-primary btn-sm" 
              type="button"
              onClick={() => setShowCreateModal(true)}
            >
              + Tạo nhóm
            </button>
          </div>

          <p className="muted">Chat nhóm với nhiều người, realtime với WebSocket</p>

          {error ? <p style={{ color: '#be123c' }}>{error}</p> : null}
          {loading ? <p>Đang tải nhóm...</p> : null}

          <div style={{ display: 'grid', gap: 12 }}>
            {groups.map((group) => {
              const latestMessage = group.messages?.[0];
              return (
                <button
                  key={group.id}
                  type="button"
                  className="chat-list-item"
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{ borderColor: selectedGroupId === group.id ? '#ec4899' : '#fbcfe8' }}
                >
                  <Image 
                    src={group.avatarUrl || FALLBACK} 
                    alt={group.name} 
                    width={56} 
                    height={56} 
                    style={{ borderRadius: 999 }} 
                    unoptimized 
                  />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <strong>{group.name}</strong>
                      <span className="muted">{new Date(group.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="muted">
                      {group.members.length} thành viên
                      {latestMessage ? ` · ${latestMessage.sender.displayName}: ${latestMessage.textContent || 'Đã gửi ảnh'}` : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!loading && groups.length === 0 ? (
            <p className="muted">Chưa có nhóm nào. Tạo nhóm mới để bắt đầu!</p>
          ) : null}
        </div>

        {/* Right Side - Chat Area */}
        <div className="card">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Image 
                    src={selectedGroup.avatarUrl || FALLBACK} 
                    alt={selectedGroup.name} 
                    width={56} 
                    height={56} 
                    style={{ borderRadius: 999 }} 
                    unoptimized 
                  />
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedGroup.name}</h2>
                    <div className="muted">{memberCount} thành viên</div>
                    {typingNames.length ? (
                      <div className="typing-indicator">
                        {typingNames.slice(0, 2).join(', ')} đang nhập...
                      </div>
                    ) : null}
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-sm" 
                  type="button"
                  onClick={() => setShowGroupInfo(!showGroupInfo)}
                >
                  ℹ️ Thông tin
                </button>
              </div>

              {/* Messages */}
              <div ref={chatBoxRef} className="chat-box" style={{ minHeight: 400, maxHeight: 500 }}>
                {messages.map((message) => {
                  const mine = message.sender.id === currentUser?.id;
                  const isOwnerOrAdmin = selectedGroup?.createdByUserId === currentUser?.id;
                  return (
                    <div 
                      key={message.id} 
                      className={mine ? 'chat-bubble mine' : 'chat-bubble'}
                    >
                      <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.75 }}>
                        {mine ? 'Bạn' : message.sender.displayName}
                      </div>

                      {message.parentMessage ? (
                        <div className="quoted-message">
                          <strong>{message.parentMessage.sender?.displayName || 'Thành viên'}</strong>
                          <div>{message.parentMessage.textContent || 'Tin nhắn'}</div>
                        </div>
                      ) : null}

                      {message.messageType === 'image' && message.mediaUrl ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <a href={message.mediaUrl} target="_blank" rel="noreferrer">
                            <Image 
                              src={message.mediaUrl} 
                              alt="Ảnh" 
                              width={220} 
                              height={220} 
                              className="chat-image" 
                              unoptimized 
                            />
                          </a>
                          {message.textContent ? <div>{message.textContent}</div> : null}
                        </div>
                      ) : (
                        <div>{message.textContent}</div>
                      )}

                      {message.recalledAt ? (
                        <div className="chat-system-note">Tin nhắn đã được thu hồi</div>
                      ) : null}
                      {message.deletedAt ? (
                        <div className="chat-system-note">Tin nhắn đã bị xóa</div>
                      ) : null}

                      {message.pinnedAt ? (
                        <div className="chat-system-note">📌 Tin nhắn đã được ghim</div>
                      ) : null}

                      <div style={{ 
                        fontSize: 12, 
                        marginTop: 6, 
                        opacity: 0.7, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        gap: 8, 
                        alignItems: 'center' 
                      }}>
                        <span>
                          {new Date(message.createdAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {message.reactions?.length ? (
                            <div className="reaction-row">
                              {message.reactions.map((reaction) => (
                                <button
                                  key={`${message.id}-${reaction.emoji}`}
                                  className={`reaction-chip ${reaction.reacted ? 'active' : ''}`}
                                  type="button"
                                  onClick={() => toggleReaction(message.id, reaction.emoji)}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}

                          <GroupMessageActions
                            message={message}
                            groupId={selectedGroupId}
                            isOwn={mine}
                            isOwnerOrAdmin={isOwnerOrAdmin}
                            onReply={(msg) => setReplyTo(msg)}
                            onReactionAdded={() => {}}
                            onMessageUpdated={(updated) => {
                              setMessages((prev) =>
                                prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 ? (
                  <div className="muted">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</div>
                ) : null}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                <input
                  className="input"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    if (e.target.value.trim()) emitTypingStart();
                    else emitTypingStop();
                  }}
                  placeholder="Nhập tin nhắn..."
                />

                {replyTo ? (
                  <div className="quoted-message composer-quote">
                    <div className="inline-status" style={{ justifyContent: 'space-between' }}>
                      <strong>Đang trả lời {replyTo.sender.displayName}</strong>
                      <button className="btn btn-outline btn-xs" type="button" onClick={() => setReplyTo(null)}>
                        Bỏ reply
                      </button>
                    </div>
                    <div>{replyTo.textContent || 'Tin nhắn'}</div>
                  </div>
                ) : null}

                {imagePreviewUrl ? (
                  <div className="composer-preview">
                    <Image 
                      src={imagePreviewUrl} 
                      alt="Preview" 
                      width={180} 
                      height={180} 
                      className="chat-image" 
                      unoptimized 
                    />
                    <div style={{ display: 'grid', gap: 8 }}>
                      <strong>{imageFile?.name}</strong>
                      <div className="inline-status">
                        <button 
                          className="btn btn-outline btn-xs" 
                          type="button"
                          onClick={() => handleSelectImage(null)}
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="inline-status">
                  <input 
                    id="group-chat-image-input" 
                    className="input" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleSelectImage(e.target.files?.[0] || null)} 
                  />
                  <button 
                    className="btn btn-primary" 
                    type="submit" 
                    disabled={sending || (!messageText.trim() && !imageFile)}
                  >
                    {sending ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div>
              <h2 style={{ marginTop: 0 }}>Chọn một nhóm</h2>
              <p className="muted">
                Chọn nhóm từ danh sách bên trái để bắt đầu chat
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />

      <GroupInfoSidebar
        group={selectedGroup}
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        onGroupUpdated={(updatedGroup) => {
          setGroups((prev) =>
            prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
          );
        }}
      />

      {/* Group Info Sidebar - Placeholder */}
      {showGroupInfo && selectedGroup ? (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            right: 0, 
            bottom: 0, 
            width: 320, 
            background: 'white', 
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            padding: 24,
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Thông tin nhóm</h2>
            <button 
              className="btn btn-outline btn-sm" 
              type="button"
              onClick={() => setShowGroupInfo(false)}
            >
              ✕
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Image 
              src={selectedGroup.avatarUrl || FALLBACK} 
              alt={selectedGroup.name} 
              width={120} 
              height={120} 
              style={{ borderRadius: 999 }} 
              unoptimized 
            />
            <h3 style={{ marginTop: 12, marginBottom: 4 }}>{selectedGroup.name}</h3>
            {selectedGroup.description ? (
              <p className="muted">{selectedGroup.description}</p>
            ) : null}
          </div>

          <div>
            <h4>Thành viên ({memberCount})</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {selectedGroup.members.map((member) => (
                <div 
                  key={member.id} 
                  style={{ 
                    display: 'flex', 
                    gap: 12, 
                    alignItems: 'center',
                    padding: 8,
                    borderRadius: 8,
                    background: '#f9fafb'
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
                    <div style={{ fontWeight: 500 }}>{member.user.displayName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {member.role === 'owner' ? '👑 Chủ nhóm' : member.role === 'admin' ? '⭐ Quản trị viên' : 'Thành viên'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}
