'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/layout';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth';
import { SafetyActions } from '@/components/safety-actions';
import { compressImageForChat, formatBytes } from '@/lib/image';
import { Conversation, Message, MessageReaction, PaginatedMessagesResponse, SocketConnectionState, CallType } from '@/lib/types';
import { getSocketClient, reconnectSocketClient, subscribeSocketState } from '@/lib/socket';
import { useCall } from '@/lib/call-context';

const FALLBACK = 'https://placehold.co/240x240/png';
const PAGE_SIZE = 20;
const ROW_ESTIMATE = 140;
const OVERSCAN = 6;
const TYPING_IDLE_MS = 1600;

type MessageNewEvent = { conversationId: string; message: Message };
type MessageUpdatedEvent = { conversationId: string; message: Message };
type ConversationReadEvent = { conversationId: string; userId: string; readAt: string };
type MessageDeliveredEvent = { conversationId: string; messageIds: string[]; deliveredAt: string };
type MessageSeenEvent = { conversationId: string; userId: string; messageIds: string[]; seenAt: string };
type NotificationNewEvent = { type?: string; data?: { conversationId?: string } | null };
type UserBlockedEvent = { blockerUserId: string; blockedUserId: string };
type TypingEvent = { conversationId: string; userId: string; displayName?: string };
type MessageReactionUpdatedEvent = { conversationId: string; messageId: string; reactions: MessageReaction[] };

type PendingOutgoingMessage = {
  id: string;
  conversationId: string;
  textContent?: string;
  imageFile?: File;
  attachmentFile?: File;
  attachmentKind?: 'image' | 'file' | 'audio';
  imagePreviewUrl?: string;
  parentMessage?: Message | null;
  createdAt: string;
  error?: string;
  status: 'pending' | 'failed';
  uploadProgress?: number;
};

type DisplayMessage = Message & {
  isPending?: boolean;
  isFailed?: boolean;
  pendingDraftId?: string;
  localPreviewUrl?: string;
  uploadProgress?: number;
};

type CompressionInfo = {
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
};

function formatDelivery(message: DisplayMessage, mine: boolean) {
  if (!mine) return '';
  if ((message as any).isFailed) return 'Gửi lỗi';
  if ((message as any).isPending && typeof (message as any).uploadProgress === 'number' && (message as any).uploadProgress > 0) return `Đang tải ${(message as any).uploadProgress}%`;
  if ((message as any).isPending) return 'Đang gửi';
  if (message.seenAt) return 'Đã xem';
  if (message.deliveredAt) return 'Đã nhận';
  return 'Đang gửi';
}

function getMessagePreview(message?: { textContent?: string | null; mediaUrl?: string | null; recalledAt?: string | null; deletedAt?: string | null }) {
  if (!message) return 'Chưa có tin nhắn';
  if (message.deletedAt) return 'Tin nhắn đã bị xóa';
  if (message.recalledAt) return 'Tin nhắn đã được thu hồi';
  return message.textContent || (message.mediaUrl ? 'Đã gửi một ảnh' : 'Chưa có tin nhắn');
}


function getQuotedPreview(message?: { textContent?: string | null; mediaUrl?: string | null; recalledAt?: string | null; deletedAt?: string | null }) {
  if (!message) return 'Tin nhắn gốc không còn khả dụng';
  if (message.deletedAt) return 'Tin nhắn gốc đã bị xóa';
  if (message.recalledAt) return 'Tin nhắn gốc đã được thu hồi';
  return message.textContent || (message.mediaUrl ? 'Đã gửi một ảnh' : 'Tin nhắn gốc không còn khả dụng');
}

function reactionPalette() {
  return ['❤️', '👍', '😂', '😍', '😮'];
}

function CallButtons({ conversationId, receiverId }: { conversationId: string; receiverId: string }) {
  const { initiateCall, currentCall, isCallActive } = useCall();
  const [calling, setCalling] = useState(false);

  const handleCall = async (callType: CallType) => {
    if (calling || currentCall || isCallActive) return;
    setCalling(true);
    try {
      await initiateCall(conversationId, receiverId, callType);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      alert('Không thể thực hiện cuộc gọi. Vui lòng thử lại.');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        onClick={() => handleCall('voice')}
        disabled={calling || !!currentCall || isCallActive}
        style={{
          padding: '8px 12px',
          borderRadius: 999,
          border: 'none',
          background: calling || currentCall || isCallActive ? '#ccc' : '#10b981',
          color: 'white',
          cursor: calling || currentCall || isCallActive ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
        }}
        title="Gọi thoại"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => handleCall('video')}
        disabled={calling || !!currentCall || isCallActive}
        style={{
          padding: '8px 12px',
          borderRadius: 999,
          border: 'none',
          background: calling || currentCall || isCallActive ? '#ccc' : '#8b5cf6',
          color: 'white',
          cursor: calling || currentCall || isCallActive ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
        }}
        title="Gọi video"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );
}

function makeDraftDisplayMessage(draft: PendingOutgoingMessage, sender: { id: string; displayName: string; avatarUrl?: string | null }): DisplayMessage {
  return {
    id: draft.id,
    textContent: draft.textContent || null,
    mediaUrl: draft.imagePreviewUrl || null,
    messageType: draft.imagePreviewUrl ? 'image' : 'text',
    createdAt: draft.createdAt,
    parentMessage: draft.parentMessage ? {
      id: draft.parentMessage.id,
      textContent: draft.parentMessage.textContent || null,
      mediaUrl: draft.parentMessage.mediaUrl || null,
      sender: draft.parentMessage.sender,
      recalledAt: draft.parentMessage.recalledAt || null,
      deletedAt: draft.parentMessage.deletedAt || null,
      messageType: draft.parentMessage.messageType
    } : null,
    reactions: [],
    sender,
    deliveredAt: null,
    seenAt: null,
    recalledAt: null,
    deletedAt: null,
    isPending: draft.status === 'pending',
    isFailed: draft.status === 'failed',
    pendingDraftId: draft.id,
    localPreviewUrl: draft.imagePreviewUrl,
    uploadProgress: draft.uploadProgress || 0
  };
}

function formatTypingLabel(names: string[]) {
  if (!names.length) return '';
  if (names.length === 1) return `${names[0]} đang nhập...`;
  return `${names.slice(0, 2).join(', ')} đang nhập...`;
}

function ChatsContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [forwardMessageTarget, setForwardMessageTarget] = useState<Message | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [attachmentPreviewLabel, setAttachmentPreviewLabel] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [imageCompressionInfo, setImageCompressionInfo] = useState<CompressionInfo | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingOutgoingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketState, setSocketState] = useState<SocketConnectionState>('idle');
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const joinedConversationRef = useRef('');
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const composerPreviewRef = useRef('');
  const pendingMessagesRef = useRef<PendingOutgoingMessage[]>([]);
  const typingIdleTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const params = useSearchParams();
  const currentUser = getStoredUser();

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  );

  const selectedTarget = useMemo(() => {
    if (!selectedConversation || !currentUser) return null;
    return selectedConversation.participants.find((participant) => participant.user.id !== currentUser.id)?.user || null;
  }, [selectedConversation, currentUser]);

  const displayMessages = useMemo(() => {
    if (!currentUser || !selectedId) return messages;
    const drafts = pendingMessages
      .filter((draft) => draft.conversationId === selectedId)
      .map((draft) => makeDraftDisplayMessage(draft, {
        id: currentUser.id,
        displayName: currentUser.displayName
      }));

    return [...messages, ...drafts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [currentUser, messages, pendingMessages, selectedId]);

  const totalVirtualHeight = displayMessages.length * ROW_ESTIMATE;
  const virtualStartIndex = Math.max(0, Math.floor(virtualScrollTop / ROW_ESTIMATE) - OVERSCAN);
  const virtualEndIndex = Math.min(
    displayMessages.length,
    Math.ceil((virtualScrollTop + viewportHeight) / ROW_ESTIMATE) + OVERSCAN
  );
  const visibleMessages = displayMessages.slice(virtualStartIndex, virtualEndIndex);
  const topSpacerHeight = virtualStartIndex * ROW_ESTIMATE;
  const bottomSpacerHeight = Math.max(0, totalVirtualHeight - (virtualEndIndex * ROW_ESTIMATE));

  const clearAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreviewLabel('');
    const input = document.getElementById('chat-attachment-input') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  const clearComposerImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    composerPreviewRef.current = '';
    setImagePreviewUrl('');
    setImageFile(null);
    setImageCompressionInfo(null);
    const input = document.getElementById('chat-image-input') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  const emitTypingStop = () => {
    if (!selectedId || !isTypingRef.current) return;
    const socket = getSocketClient();
    socket?.emit('typing.stop', { conversationId: selectedId });
    isTypingRef.current = false;
  };

  const scheduleTypingStop = () => {
    if (typingIdleTimerRef.current) window.clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = window.setTimeout(() => emitTypingStop(), TYPING_IDLE_MS);
  };

  const emitTypingStart = () => {
    if (!selectedId || !currentUser) return;
    const socket = getSocketClient();
    if (!socket) return;
    if (!isTypingRef.current) {
      socket.emit('typing.start', { conversationId: selectedId, displayName: currentUser.displayName });
      isTypingRef.current = true;
    }
    scheduleTypingStop();
  };

  const loadConversations = async (silent = false) => {
    if (!getAccessToken()) {
      window.location.href = '/auth/login';
      return;
    }
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Conversation[]>('/conversations');
      setConversations(data);
      const requestedId = params.get('conversationId');
      if (requestedId && data.some((conversation) => conversation.id === requestedId)) {
        setSelectedId(requestedId);
      } else if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hội thoại');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadPins = async (conversationId: string) => {
    try {
      const data = await apiFetch<Message[]>(`/conversations/${conversationId}/pins`);
      setPinnedMessages(data);
    } catch {
      setPinnedMessages([]);
    }
  };

  const loadMessages = async (conversationId: string, options?: { older?: boolean; q?: string }) => {
    const older = Boolean(options?.older);
    const before = older ? nextCursor : null;
    if (older && (!before || loadingOlder)) return;

    if (older) setLoadingOlder(true);
    else {
      setError('');
      setMessages([]);
      setHasMoreMessages(false);
      setNextCursor(null);
    }

    const box = chatBoxRef.current;
    const previousHeight = older && box ? box.scrollHeight : 0;

    try {
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (before) qs.set('before', before);
      const q = typeof options?.q === 'string' ? options.q.trim() : activeSearchQuery.trim();
      if (q) qs.set('q', q);
      const data = await apiFetch<PaginatedMessagesResponse>(`/conversations/${conversationId}/messages?${qs.toString()}`);
      setMessages((prev) => older ? [...data.items, ...prev] : data.items);
      setHasMoreMessages(data.hasMore);
      setNextCursor(data.nextCursor || null);
      setConversations((prev) => prev.map((item) => item.id === conversationId ? { ...item, unreadCount: 0 } : item));

      requestAnimationFrame(() => {
        const target = chatBoxRef.current;
        if (!target) return;
        if (older) target.scrollTop = target.scrollHeight - previousHeight;
        else target.scrollTop = target.scrollHeight;
        setViewportHeight(target.clientHeight);
        setVirtualScrollTop(target.scrollTop);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được tin nhắn');
    } finally {
      if (older) setLoadingOlder(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSocketState(setSocketState);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId, { q: activeSearchQuery });
      loadPins(selectedId);
    }
  }, [selectedId, activeSearchQuery]);

  useEffect(() => {
    pendingMessagesRef.current = pendingMessages;
  }, [pendingMessages]);

  useEffect(() => {
    composerPreviewRef.current = imagePreviewUrl;
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      emitTypingStop();
      if (typingIdleTimerRef.current) window.clearTimeout(typingIdleTimerRef.current);
      if (composerPreviewRef.current) URL.revokeObjectURL(composerPreviewRef.current);
      pendingMessagesRef.current.forEach((draft) => {
        if (draft.imagePreviewUrl) URL.revokeObjectURL(draft.imagePreviewUrl);
      });
    };
  }, []);

  useEffect(() => {
    emitTypingStop();
    setTypingUsers({});
    setReplyTo(null);
  }, [selectedId]);

  useEffect(() => {
    const box = chatBoxRef.current;
    if (!box) return;
    if (stickToBottomRef.current) {
      box.scrollTop = box.scrollHeight;
      setVirtualScrollTop(box.scrollTop);
    }
  }, [displayMessages.length]);

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket || !currentUser) return;

    const onMessageNew = (event: MessageNewEvent) => {
      setConversations((prev) => {
        const next = prev.map((conversation) => {
          if (conversation.id !== event.conversationId) return conversation;
          const isCurrentConversation = event.conversationId === selectedId;
          const nextUnread = isCurrentConversation || event.message.sender.id === currentUser.id
            ? 0
            : (conversation.unreadCount || 0) + 1;
          return {
            ...conversation,
            updatedAt: event.message.createdAt,
            unreadCount: nextUnread,
            messages: [event.message]
          };
        });
        return [...next].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });

      if (event.message.sender.id === currentUser.id) {
        setPendingMessages((prev) => {
          const matchIndex = prev.findIndex((draft) =>
            draft.conversationId === event.conversationId
            && draft.status === 'pending'
            && (draft.textContent || '') === (event.message.textContent || '')
            && Boolean(draft.imagePreviewUrl) === Boolean(event.message.mediaUrl)
          );
          if (matchIndex === -1) return prev;
          const matched = prev[matchIndex];
          if (matched.imagePreviewUrl) URL.revokeObjectURL(matched.imagePreviewUrl);
          return prev.filter((_, index) => index != matchIndex);
        });
      }

      if (event.conversationId === selectedId) {
        setMessages((prev) => prev.some((item) => item.id === event.message.id) ? prev : [...prev, event.message]);
      }
    };

    const onMessageUpdated = (event: MessageUpdatedEvent) => {
      setMessages((prev) => prev.map((message) => message.id === event.message.id ? { ...message, ...event.message } : message));
      setConversations((prev) => prev.map((conversation) => conversation.id === event.conversationId ? { ...conversation, messages: conversation.messages?.map((item) => item.id === event.message.id ? { ...item, ...event.message } : item) || [event.message] } : conversation));
    };

    const onReactionUpdated = (event: MessageReactionUpdatedEvent) => {
      setMessages((prev) => prev.map((message) => message.id === event.messageId ? { ...message, reactions: event.reactions } : message));
    };

    const onConversationRead = (event: ConversationReadEvent) => {
      if (event.userId !== currentUser.id) return;
      setConversations((prev) => prev.map((conversation) => (
        conversation.id === event.conversationId ? { ...conversation, unreadCount: 0 } : conversation
      )));
    };

    const onMessageDelivered = (event: MessageDeliveredEvent) => {
      setMessages((prev) => prev.map((message) => event.messageIds.includes(message.id) ? { ...message, deliveredAt: event.deliveredAt } : message));
    };

    const onMessageSeen = (event: MessageSeenEvent) => {
      if (event.userId === currentUser.id) return;
      setMessages((prev) => prev.map((message) => event.messageIds.includes(message.id) ? { ...message, seenAt: event.seenAt } : message));
    };

    const onNotificationNew = (event: NotificationNewEvent) => {
      if (event.type === 'new_message' && event.data?.conversationId && event.data.conversationId !== selectedId) {
        loadConversations(true);
      }
    };

    const onUserBlocked = (event: UserBlockedEvent) => {
      const impactsCurrentUser = event.blockerUserId === currentUser.id || event.blockedUserId === currentUser.id;
      if (!impactsCurrentUser) return;
      if (selectedTarget && [selectedTarget.id, currentUser.id].includes(event.blockerUserId) && [selectedTarget.id, currentUser.id].includes(event.blockedUserId)) {
        alert('Hội thoại này không còn khả dụng do có thao tác chặn người dùng.');
        window.location.href = '/discover';
      } else {
        loadConversations(true);
      }
    };

    const onTypingStart = (event: TypingEvent) => {
      if (event.conversationId !== selectedId) return;
      setTypingUsers((prev) => ({ ...prev, [event.userId]: event.displayName || 'Đối phương' }));
    };

    const onTypingStop = (event: TypingEvent) => {
      if (event.conversationId !== selectedId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[event.userId];
        return next;
      });
    };

    socket.on('message.new', onMessageNew);
    socket.on('message.updated', onMessageUpdated);
    socket.on('conversation.read', onConversationRead);
    socket.on('message.delivered', onMessageDelivered);
    socket.on('message.seen', onMessageSeen);
    socket.on('notification.new', onNotificationNew);
    socket.on('user.blocked', onUserBlocked);
    socket.on('typing.start', onTypingStart);
    socket.on('typing.stop', onTypingStop);
    socket.on('message.reaction_updated', onReactionUpdated);

    return () => {
      socket.off('message.new', onMessageNew);
      socket.off('message.updated', onMessageUpdated);
      socket.off('conversation.read', onConversationRead);
      socket.off('message.delivered', onMessageDelivered);
      socket.off('message.seen', onMessageSeen);
      socket.off('notification.new', onNotificationNew);
      socket.off('user.blocked', onUserBlocked);
      socket.off('typing.start', onTypingStart);
      socket.off('typing.stop', onTypingStop);
      socket.off('message.reaction_updated', onReactionUpdated);
    };
  }, [currentUser?.id, selectedId, selectedTarget?.id]);

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket || !selectedId) return;

    if (joinedConversationRef.current && joinedConversationRef.current !== selectedId) {
      socket.emit('conversation.leave', { conversationId: joinedConversationRef.current });
    }

    joinedConversationRef.current = selectedId;
    socket.emit('conversation.join', { conversationId: selectedId });

    return () => {
      if (joinedConversationRef.current === selectedId) {
        socket.emit('conversation.leave', { conversationId: selectedId });
        joinedConversationRef.current = '';
      }
    };
  }, [selectedId]);

  const createPendingDraft = (conversationId: string, text: string, file?: File | null, previewUrl?: string, parentMessage?: Message | null, attachmentKind?: 'image' | 'file' | 'audio') => {
    const createdAt = new Date().toISOString();
    const draft: PendingOutgoingMessage = {
      id: crypto.randomUUID(),
      conversationId,
      textContent: text.trim() || undefined,
      imageFile: attachmentKind === 'image' ? file || undefined : undefined,
      attachmentFile: attachmentKind && attachmentKind !== 'image' ? file || undefined : undefined,
      attachmentKind,
      imagePreviewUrl: previewUrl,
      parentMessage: parentMessage || null,
      createdAt,
      status: 'pending',
      uploadProgress: file ? 0 : undefined
    };
    setPendingMessages((prev) => [...prev, draft]);
    setConversations((prev) => prev.map((conversation) => conversation.id === conversationId ? {
      ...conversation,
      updatedAt: createdAt,
      messages: [{
        id: draft.id,
        textContent: draft.textContent || null,
        mediaUrl: previewUrl || null,
        fileName: file?.name || null,
        mimeType: file?.type || null,
        createdAt,
        pinnedAt: null,
        parentMessage: replyTo ? {
          id: replyTo.id,
          textContent: replyTo.textContent || null,
          mediaUrl: replyTo.mediaUrl || null,
          sender: replyTo.sender,
          recalledAt: replyTo.recalledAt || null,
          deletedAt: replyTo.deletedAt || null,
          messageType: replyTo.messageType
        } : null,
        reactions: [],
        sender: currentUser ? { id: currentUser.id, displayName: currentUser.displayName } : undefined,
        deliveredAt: null,
        seenAt: null,
        recalledAt: null,
        deletedAt: null
      }]
    } : conversation).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    return draft;
  };

  const updateDraftProgress = (draftId: string, uploadProgress: number) => {
    setPendingMessages((prev) => prev.map((item) => item.id === draftId ? { ...item, uploadProgress } : item));
  };

  const uploadImageMessage = (conversationId: string, file: File, text: string, draftId: string, parentMessageId?: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('Thiếu access token');
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/conversations/${conversationId}/messages/image`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        updateDraftProgress(draftId, Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateDraftProgress(draftId, 100);
          resolve();
          return;
        }
        try {
          const body = JSON.parse(xhr.responseText || '{}');
          reject(new Error(body?.message || 'Upload ảnh thất bại'));
        } catch {
          reject(new Error('Upload ảnh thất bại'));
        }
      };
      xhr.onerror = () => reject(new Error('Không thể kết nối khi upload ảnh'));
      const formData = new FormData();
      formData.append('file', file);
      if (text.trim()) formData.append('textContent', text.trim());
      if (parentMessageId) formData.append('parentMessageId', parentMessageId);
      xhr.send(formData);
    });
  };

  const submitMessage = async (conversationId: string, text: string, file?: File | null, draftId?: string, parentMessageId?: string) => {
    if (file) {
      await uploadImageMessage(conversationId, file, text, draftId!, parentMessageId);
      return;
    }

    await apiFetch(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ textContent: text.trim(), parentMessageId: parentMessageId || undefined })
    });
  };

  const markDraftFailed = (draftId: string, err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'Không gửi được tin nhắn';
    setPendingMessages((prev) => prev.map((draft) => draft.id === draftId ? { ...draft, status: 'failed', error: errorMessage } : draft));
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || (!messageText.trim() && !imageFile) || !currentUser) return;
    const textSnapshot = messageText;
    const fileSnapshot = imageFile;
    const previewSnapshot = imagePreviewUrl || undefined;

    setSending(true);
    emitTypingStop();
    const replySnapshot = replyTo;
    const draft = createPendingDraft(selectedId, textSnapshot, fileSnapshot, previewSnapshot, replySnapshot);
    setMessageText('');
    clearComposerImage();
    clearAttachment();
    setReplyTo(null);

    try {
      await submitMessage(selectedId, textSnapshot, fileSnapshot, draft.id, replySnapshot?.id);
    } catch (err) {
      markDraftFailed(draft.id, err);
      alert(`${err instanceof Error ? err.message : 'Không gửi được tin nhắn'}. Bạn có thể thử gửi lại ngay trong khung chat.`);
    } finally {
      setSending(false);
    }
  };


  const uploadAttachmentMessage = (conversationId: string, file: File, text: string, draftId: string, parentMessageId?: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('Thiếu access token');
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/conversations/${conversationId}/messages/attachment`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        updateDraftProgress(draftId, Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateDraftProgress(draftId, 100);
          resolve();
        } else {
          reject(new Error('Upload attachment thất bại'));
        }
      };
      xhr.onerror = () => reject(new Error('Upload attachment thất bại'));
      const form = new FormData();
      form.append('file', file);
      if (text.trim()) form.append('textContent', text.trim());
      if (parentMessageId) form.append('parentMessageId', parentMessageId);
      xhr.send(form);
    });
  };

  const resendFailedMessage = async (draftId: string) => {
    const draft = pendingMessages.find((item) => item.id === draftId);
    if (!draft) return;
    setPendingMessages((prev) => prev.map((item) => item.id === draftId ? { ...item, status: 'pending', error: undefined, uploadProgress: item.imageFile ? 0 : undefined } : item));
    try {
      await submitMessage(draft.conversationId, draft.textContent || '', draft.imageFile, draftId, draft.parentMessage?.id)
    } catch (err) {
      markDraftFailed(draftId, err);
    }
  };

  const removePendingMessage = (draftId: string) => {
    const draft = pendingMessages.find((item) => item.id === draftId);
    if (draft?.imagePreviewUrl) URL.revokeObjectURL(draft.imagePreviewUrl);
    setPendingMessages((prev) => prev.filter((item) => item.id !== draftId));
  };

  const onSelectAttachment = (file: File | null) => {
    if (!file) {
      clearAttachment();
      return;
    }
    setAttachmentFile(file);
    setAttachmentPreviewLabel(`${file.name} · ${formatBytes(file.size)} · ${file.type || 'application/octet-stream'}`);
  };

  const onSelectImage = async (file: File | null) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl('');
      setImageCompressionInfo(null);
      return;
    }

    try {
      const compressed = await compressImageForChat(file);
      const nextPreviewUrl = URL.createObjectURL(compressed.file);
      composerPreviewRef.current = nextPreviewUrl;
      setImageFile(compressed.file);
      setImagePreviewUrl(nextPreviewUrl);
      setImageCompressionInfo({
        originalBytes: compressed.originalBytes,
        compressedBytes: compressed.compressedBytes,
        width: compressed.width,
        height: compressed.height
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xử lý được ảnh đã chọn');
      setImageFile(null);
      setImagePreviewUrl('');
      setImageCompressionInfo(null);
    }
  };

  const onChatScroll = () => {
    const box = chatBoxRef.current;
    if (!box) return;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    stickToBottomRef.current = nearBottom;
    setVirtualScrollTop(box.scrollTop);
    setViewportHeight(box.clientHeight);
    if (box.scrollTop < 40 && hasMoreMessages && !loadingOlder && selectedId) {
      loadMessages(selectedId, { older: true });
    }
  };

  const copyMessage = async (message: DisplayMessage) => {
    try {
      const text = message.textContent || message.mediaUrl || '';
      if (!text) return;
      await navigator.clipboard.writeText(text);
      alert('Đã sao chép nội dung tin nhắn.');
    } catch {
      alert('Không sao chép được nội dung.');
    }
  };

  const recallMessage = async (messageId: string) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/conversations/${selectedId}/messages/${messageId}/recall`, { method: 'PATCH' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thu hồi được tin nhắn');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/conversations/${selectedId}/messages/${messageId}`, { method: 'DELETE' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không xóa được tin nhắn');
    }
  };

  const pinMessage = async (message: DisplayMessage) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/conversations/${selectedId}/messages/${message.id}/pin`, { method: 'PATCH' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không ghim được tin nhắn');
    }
  };

  const unpinMessage = async (message: DisplayMessage) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/conversations/${selectedId}/messages/${message.id}/pin`, { method: 'DELETE' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không bỏ ghim được tin nhắn');
    }
  };

  const forwardMessage = async (message: DisplayMessage, targetConversationId: string) => {
    if (!message) return;
    try {
      await apiFetch(`/conversations/${targetConversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          textContent: message.textContent || '',
          forwardedFromMessageId: message.id,
        }),
      });
      setForwardMessageTarget(null);
      alert('Đã chuyển tiếp tin nhắn!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không chuyển tiếp được tin nhắn');
    }
  };

  const toggleReaction = async (message: DisplayMessage, emoji: string) => {
    if (!selectedId || (message as any).isPending) return;
    const reacted = message.reactions?.some((item) => item.emoji === emoji && item.reacted);
    try {
      const reactions = reacted
        ? await apiFetch<MessageReaction[]>(`/conversations/${selectedId}/messages/${message.id}/reactions/${encodeURIComponent(emoji)}`, { method: 'DELETE' })
        : await apiFetch<MessageReaction[]>(`/conversations/${selectedId}/messages/${message.id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) });
      setMessages((prev) => prev.map((item) => item.id === message.id ? { ...item, reactions } : item));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không cập nhật được cảm xúc');
    }
  };

  const runSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    setActiveSearchQuery(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
  };

  const typingNames = Object.values(typingUsers);

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Chats</h1>
          <p className="muted">Realtime bằng WebSocket, typing indicator, upload progress ảnh, message actions, optimistic UI và virtualized message list.</p>
          {socketState !== 'connected' ? (
            <div className="inline-status">
              <span>Trạng thái realtime: {socketState}</span>
              <button className="btn btn-outline" type="button" onClick={() => reconnectSocketClient()}>Kết nối lại</button>
            </div>
          ) : null}
          {error ? <p style={{ color: '#be123c' }}>{error}</p> : null}
          {loading ? <p>Đang tải hội thoại...</p> : null}
          <div style={{ display: 'grid', gap: 12 }}>
            {conversations.map((conversation) => {
              const otherUser = conversation.participants.find((participant) => participant.user.id !== currentUser?.id)?.user;
              const latestMessage = conversation.messages?.[0];
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className="chat-list-item"
                  onClick={() => setSelectedId(conversation.id)}
                  style={{ borderColor: selectedId === conversation.id ? '#ec4899' : '#fbcfe8' }}
                >
                  <Image src={otherUser?.avatarUrl || FALLBACK} alt={otherUser?.displayName || 'User'} width={56} height={56} style={{ borderRadius: 999 }} unoptimized />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <strong>{otherUser?.displayName || 'Ẩn danh'}</strong>
                      <span className="muted">{new Date(conversation.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="muted">{getMessagePreview(latestMessage)}</div>
                  </div>
                  {(conversation.unreadCount || 0) > 0 ? <span className="badge">{conversation.unreadCount}</span> : null}
                </button>
              );
            })}
          </div>
          {!loading && conversations.length === 0 ? <p className="muted">Chưa có hội thoại nào. Hãy match rồi quay lại.</p> : null}
        </div>

        <div className="card">
          {selectedConversation && selectedTarget ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Image src={selectedTarget.avatarUrl || FALLBACK} alt={selectedTarget.displayName} width={56} height={56} style={{ borderRadius: 999 }} unoptimized />
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedTarget.displayName}</h2>
                    <div className="muted">{hasMoreMessages ? 'Kéo lên để tải thêm tin nhắn cũ' : 'Đã tải hết lịch sử hội thoại hiện có'}</div>
                    {typingNames.length ? <div className="typing-indicator">{formatTypingLabel(typingNames)}</div> : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CallButtons conversationId={selectedId} receiverId={selectedTarget.id} />
                  <SafetyActions 
                    targetUserId={selectedTarget.id} 
                    targetUserName={selectedTarget.displayName} 
                    reportTargetType="message" 
                    reportTargetId={selectedId} 
                  />
                </div>
              </div>

              {pinnedMessages.length ? (
                <div className="pinned-bar">
                  <strong>Đã ghim:</strong>
                  <div className="pinned-list">
                    {pinnedMessages.slice(0, 3).map((item) => (
                      <button key={item.id} type="button" className="pinned-chip" onClick={() => { const el = document.getElementById(`msg-${item.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>📌 {getMessagePreview(item)}</button>
                    ))}
                  </div>
                </div>
              ) : null}

              <form onSubmit={runSearch} className="chat-search-bar">
                <input className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm trong hội thoại..." />
                <button className="btn btn-outline btn-xs" type="submit">Tìm</button>
                {activeSearchQuery ? <button className="btn btn-outline btn-xs" type="button" onClick={clearSearch}>Bỏ lọc</button> : null}
              </form>

              <div ref={chatBoxRef} className="chat-box" onScroll={onChatScroll}>
                {loadingOlder ? <div className="pill" style={{ margin: '0 auto 12px' }}>Đang tải tin nhắn cũ...</div> : null}
                <div style={{ height: topSpacerHeight }} />
                {visibleMessages.map((message) => {
                  const mine = message.sender.id === currentUser?.id;
                  const actionDisabled = Boolean((message as any).isPending || (message as any).isFailed || message.recalledAt || message.deletedAt);
                  return (
                    <div id={`msg-${message.id}`} key={message.id} className={mine ? 'chat-bubble mine' : 'chat-bubble'}>
                      <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.75 }}>{mine ? 'Bạn' : message.sender.displayName}</div>
                      {message.forwardedFromMessage ? (
                        <div className="quoted-message">
                          <strong>Forwarded</strong>
                          <div>{getQuotedPreview(message.forwardedFromMessage)}</div>
                        </div>
                      ) : null}
                      {message.parentMessage ? (
                        <div className="quoted-message">
                          <strong>{message.parentMessage.sender?.displayName || 'Ẩn danh'}</strong>
                          <div>{getQuotedPreview(message.parentMessage)}</div>
                        </div>
                      ) : null}
                      {message.messageType === 'image' && message.mediaUrl ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <a href={message.mediaUrl} target="_blank" rel="noreferrer">
                            <Image src={(message as any).localPreviewUrl || message.mediaUrl} alt="Ảnh chat" width={220} height={220} className="chat-image" unoptimized />
                          </a>
                          {message.textContent ? <div>{message.textContent}</div> : null}
                        </div>
                      ) : message.messageType === 'audio' && message.mediaUrl ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <audio controls src={message.mediaUrl} style={{ width: '100%' }} />
                          <div className="muted">{message.fileName || 'Audio đính kèm'}</div>
                          {message.textContent ? <div>{message.textContent}</div> : null}
                        </div>
                      ) : message.messageType === 'file' && message.mediaUrl ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="file-attachment">📎 {message.fileName || 'Tệp đính kèm'}</a>
                          {message.fileSize ? <div className="muted">{formatBytes(message.fileSize)}</div> : null}
                          {message.textContent ? <div>{message.textContent}</div> : null}
                        </div>
                      ) : (
                        <div>{message.textContent}</div>
                      )}
                      {message.recalledAt ? <div className="chat-system-note">Tin nhắn này đã được thu hồi.</div> : null}
                      {message.deletedAt ? <div className="chat-system-note">Tin nhắn này đã bị xóa.</div> : null}
                      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="inline-status">
                          {mine ? <span>{formatDelivery(message, mine)}</span> : null}
                          {message.reactions?.length ? (
                            <div className="reaction-row">
                              {message.reactions.map((reaction) => (
                                <button key={`${message.id}-${reaction.emoji}`} className={`reaction-chip ${reaction.reacted ? 'active' : ''}`} type="button" onClick={() => toggleReaction(message, reaction.emoji)}>
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                          {(message as any).isFailed ? (
                            <>
                              <button className="btn btn-outline btn-xs" type="button" onClick={() => resendFailedMessage((message as any).pendingDraftId!)}>Gửi lại</button>
                              <button className="btn btn-outline btn-xs" type="button" onClick={() => removePendingMessage((message as any).pendingDraftId!)}>Bỏ</button>
                            </>
                          ) : (
                            <div className="message-actions">
                              {reactionPalette().map((emoji) => (
                                <button key={`${message.id}-quick-${emoji}`} className={`btn btn-outline btn-xs ${(message.reactions || []).some((item) => item.emoji === emoji && item.reacted) ? 'reaction-active-btn' : ''}`} type="button" disabled={Boolean(message.deletedAt || message.recalledAt || (message as any).isPending)} onClick={() => toggleReaction(message, emoji)}>{emoji}</button>
                              ))}
                              <button className="btn btn-outline btn-xs" type="button" onClick={() => copyMessage(message)}>Copy</button>
                              <button className="btn btn-outline btn-xs" type="button" disabled={Boolean(message.deletedAt || message.recalledAt)} onClick={() => setReplyTo(message)}>Reply</button>
                              <button className="btn btn-outline btn-xs" type="button" disabled={Boolean((message as any).isPending)} onClick={() => message.pinnedAt ? unpinMessage(message) : pinMessage(message)}>{message.pinnedAt ? 'Bỏ ghim' : 'Ghim'}</button>
                              <button className="btn btn-outline btn-xs" type="button" disabled={Boolean((message as any).isPending)} onClick={() => setForwardMessageTarget(message)}>Forward</button>
                              {mine ? <button className="btn btn-outline btn-xs" type="button" disabled={actionDisabled} onClick={() => recallMessage(message.id)}>Thu hồi</button> : null}
                              {mine ? <button className="btn btn-outline btn-xs" type="button" disabled={actionDisabled} onClick={() => deleteMessage(message.id)}>Xóa</button> : null}
                            </div>
                          )}
                        </div>
                      </div>
                      {typeof (message as any).uploadProgress === 'number' && (message as any).isPending ? <div className="upload-progress"><span style={{ width: `${(message as any).uploadProgress}%` }} /></div> : null}
                      {(message as any).isFailed ? <div className="chat-error-text">{pendingMessages.find((draft) => draft.id === (message as any).pendingDraftId)?.error || 'Tin nhắn gửi lỗi'}</div> : null}
                    </div>
                  );
                })}
                <div style={{ height: bottomSpacerHeight }} />
                {displayMessages.length === 0 ? <div className="muted">Chưa có tin nhắn nào trong hội thoại này.</div> : null}
              </div>

              <form onSubmit={sendMessage} style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                <input className="input" value={messageText} onChange={(e) => { setMessageText(e.target.value); if (e.target.value.trim()) emitTypingStart(); else emitTypingStop(); }} placeholder="Nhập tin nhắn..." />
                {replyTo ? (
                  <div className="quoted-message composer-quote">
                    <div className="inline-status" style={{ justifyContent: 'space-between' }}>
                      <strong>Đang trả lời {replyTo.sender.displayName}</strong>
                      <button className="btn btn-outline btn-xs" type="button" onClick={() => setReplyTo(null)}>Bỏ reply</button>
                    </div>
                    <div>{getQuotedPreview(replyTo)}</div>
                  </div>
                ) : null}
                {attachmentPreviewLabel ? (
                  <div className="composer-preview">
                    <div style={{ display: 'grid', gap: 8 }}>
                      <strong>{attachmentPreviewLabel}</strong>
                      <span className="muted">File/audio sẽ được upload lên Cloudinary khi gửi.</span>
                      <div className="inline-status">
                        <button className="btn btn-outline btn-xs" type="button" onClick={clearAttachment}>Bỏ file</button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {imagePreviewUrl ? (
                  <div className="composer-preview">
                    <Image src={imagePreviewUrl} alt="Preview trước khi gửi" width={180} height={180} className="chat-image" unoptimized />
                    <div style={{ display: 'grid', gap: 8 }}>
                      <strong>{imageFile?.name}</strong>
                      <span className="muted">Ảnh sẽ được upload lên Cloudinary khi gửi và hiển thị tiến độ theo phần trăm.</span>
                      {imageCompressionInfo ? (
                        <span className="muted">
                          {formatBytes(imageCompressionInfo.originalBytes)} → {formatBytes(imageCompressionInfo.compressedBytes)} · {imageCompressionInfo.width}×{imageCompressionInfo.height}
                        </span>
                      ) : null}
                      <div className="inline-status">
                        <button className="btn btn-outline btn-xs" type="button" onClick={clearComposerImage}>Xóa ảnh</button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="inline-status">
                  <input id="chat-image-input" className="input" type="file" accept="image/*" onChange={(e) => onSelectImage(e.target.files?.[0] || null)} />
                  <input id="chat-attachment-input" className="input" type="file" accept="audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" onChange={(e: ChangeEvent<HTMLInputElement>) => onSelectAttachment(e.target.files?.[0] || null)} />
                  {(!imageFile && !attachmentFile) ? <span className="muted">Có thể gửi text, ảnh, file hoặc audio.</span> : <span className="pill">Đã chọn tệp đính kèm</span>}
                  <button className="btn btn-primary" type="submit" disabled={sending || socketState === 'error'}>{sending ? 'Đang gửi...' : 'Gửi'}</button>
                </div>
              </form>
              {forwardMessageTarget ? (
                <div className="forward-card">
                  <div className="inline-status" style={{ justifyContent: 'space-between' }}>
                    <strong>Chuyển tiếp tin nhắn</strong>
                    <button className="btn btn-outline btn-xs" type="button" onClick={() => setForwardMessageTarget(null)}>Đóng</button>
                  </div>
                  <div className="muted" style={{ marginBottom: 8 }}>{getMessagePreview(forwardMessageTarget)}</div>
                  <div className="forward-grid">
                    {conversations.filter((item) => item.id !== selectedId).map((item) => {
                      const target = item.participants.find((p) => p.user.id !== currentUser?.id)?.user;
                      return (
                        <button key={item.id} type="button" className="btn btn-outline" onClick={() => forwardMessage(forwardMessageTarget, item.id)}>
                          {target?.displayName || 'Hội thoại'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <h2 style={{ marginTop: 0 }}>Chọn một hội thoại</h2>
              <p className="muted">Màn hình này hỗ trợ typing indicator, upload progress, reply/quote, emoji reaction, search hội thoại, thu hồi/xóa/copy, optimistic UI, infinite scroll và realtime.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 16 }}>Đang tải...</div>}>
      <ChatsContent />
    </Suspense>
  );
}
