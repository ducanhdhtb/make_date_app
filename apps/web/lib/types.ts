export type Gender = 'male' | 'female' | 'other';
export type InterestedIn = 'male' | 'female' | 'everyone';

export type AuthResponse = { accessToken: string; user: { id: string; email: string; displayName: string } };
export type MeResponse = {
  id: string; email: string; displayName: string; bio?: string | null; jobTitle?: string | null; avatarUrl?: string | null;
  city?: string | null; gender?: Gender | null; interestedIn?: InterestedIn | null; latitude?: number | null; longitude?: number | null;
  isLocationPrecise?: boolean; isStoryPublic?: boolean; interests: { interestName: string }[]; photos: { id: string; photoUrl: string; sortOrder: number }[];
};
export type DiscoverUser = { id: string; displayName: string; age: number; jobTitle?: string | null; bio?: string | null; avatarUrl?: string | null; distanceKm: number; interests: string[]; latestStory?: Story | null; lastActiveAt?: string; };
export type ProfileDetail = { id: string; displayName: string; age: number; gender?: Gender | null; jobTitle?: string | null; bio?: string | null; avatarUrl?: string | null; photos: { id: string; photoUrl: string; sortOrder: number }[]; interests: string[]; distanceKm?: number | null; latestStory?: Story | null; };
export type MatchItem = { id: string; user: { id: string; displayName: string; avatarUrl?: string | null }; matchedAt: string; status: string; };
export type Story = { id: string; mediaType: 'text' | 'image'; mediaUrl?: string | null; textContent?: string | null; caption?: string | null; createdAt: string; expiresAt: string; user?: { id: string; displayName: string; avatarUrl?: string | null }; };

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

export type Conversation = {
  id: string;
  type: string;
  updatedAt: string;
  unreadCount?: number;
  participants: { userId: string; user: { id: string; displayName: string; avatarUrl?: string | null } }[];
  messages?: { id: string; textContent?: string | null; mediaUrl?: string | null; createdAt: string; deliveredAt?: string | null; seenAt?: string | null; recalledAt?: string | null; deletedAt?: string | null; sender?: { id: string; displayName: string } }[];
};

export type MessageReaction = { emoji: string; count: number; reacted?: boolean; users?: { id: string; displayName: string }[] };

export type MessageQuote = {
  id: string;
  textContent?: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  messageType?: string;
  recalledAt?: string | null;
  deletedAt?: string | null;
  sender?: { id: string; displayName: string; avatarUrl?: string | null };
};

export type Message = {
  id: string;
  textContent?: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  durationSeconds?: number | null;
  pinnedAt?: string | null;
  forwardedFromMessage?: MessageQuote | null;
  messageType: string;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  recalledAt?: string | null;
  deletedAt?: string | null;
  parentMessage?: MessageQuote | null;
  reactions?: MessageReaction[];
  sender: { id: string; displayName: string; avatarUrl?: string | null };
};

export type PaginatedMessagesResponse = {
  items: Message[];
  hasMore: boolean;
  nextCursor?: string | null;
};

export type SocketConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export type BlockItem = {
  id: string;
  blockedUserId: string;
  reason?: string | null;
  createdAt: string;
  blocked?: { id: string; displayName: string; avatarUrl?: string | null; city?: string | null };
};

export type ReportItem = {
  id: string;
  targetType: string;
  targetId?: string | null;
  reason: string;
  details?: string | null;
  createdAt: string;
};

// ============ VIDEO/VOICE CALL TYPES ============

export type CallType = 'video' | 'voice';
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';

export type Call = {
  id: string;
  conversationId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  caller?: { id: string; displayName: string; avatarUrl?: string | null };
  receiver?: { id: string; displayName: string; avatarUrl?: string | null };
};

export type IncomingCallPayload = {
  callId: string;
  caller: { id: string; displayName: string; avatarUrl?: string | null };
  callType: CallType;
  conversationId: string;
};

export type WebRTCSignalingPayload = {
  callId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  callerId?: string;
  receiverId?: string;
  fromUserId?: string;
};
