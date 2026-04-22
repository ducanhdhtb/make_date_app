'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocketClient } from './socket';
import { Call, CallType, IncomingCallPayload, WebRTCSignalingPayload } from './types';
import { useWebRTC } from './webrtc';
import { apiFetch } from './api';

type CallContextType = {
  // Call state
  currentCall: Call | null;
  incomingCall: IncomingCallPayload | null;
  isCallActive: boolean;
  callHistory: Call[];
  
  // WebRTC state
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isFrontCamera: boolean;
  connectionState: string;
  
  // Actions
  initiateCall: (conversationId: string, receiverId: string, callType: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  loadCallHistory: () => Promise<void>;
  clearIncomingCall: () => void;
};

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  
  const [webrtcState, webrtcActions] = useWebRTC();
  const socketRef = useRef<Socket | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  // Initialize socket listeners
  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) return;
    
    socketRef.current = socket;

    // Incoming call
    socket.on('call.incoming', (payload: IncomingCallPayload) => {
      console.log('[Call] Incoming call:', payload);
      setIncomingCall(payload);
    });

    // Call answered
    socket.on('call.answered', async (payload: { callId: string; receiverId: string }) => {
      console.log('[Call] Call answered:', payload);
      if (currentCall?.id === payload.callId) {
        setIsCallActive(true);
        callStartTimeRef.current = new Date();
        
        // Create offer for WebRTC
        const pc = webrtcActions.createPeerConnection();
        if (pc) {
          const offer = await webrtcActions.createOffer();
          if (offer) {
            socket.emit('call.sdp_offer', {
              callId: payload.callId,
              sdp: offer,
              receiverId: payload.receiverId
            });
          }
        }
      }
    });

    // Call rejected
    socket.on('call.rejected', (payload: { callId: string; receiverId: string; reason: string }) => {
      console.log('[Call] Call rejected:', payload);
      if (currentCall?.id === payload.callId) {
        webrtcActions.stopLocalStream();
        webrtcActions.closePeerConnection();
        setCurrentCall(null);
        setIsCallActive(false);
      }
    });

    // Call ended
    socket.on('call.ended', (payload: { callId: string; endedBy: string; duration: number }) => {
      console.log('[Call] Call ended:', payload);
      if (currentCall?.id === payload.callId) {
        webrtcActions.stopLocalStream();
        webrtcActions.closePeerConnection();
        setCurrentCall(null);
        setIsCallActive(false);
      }
    });

    // WebRTC SDP Offer
    socket.on('call.sdp_offer', async (payload: WebRTCSignalingPayload) => {
      console.log('[Call] SDP Offer received:', payload);
      if (payload.sdp && payload.callerId) {
        const pc = webrtcActions.createPeerConnection();
        if (pc && payload.sdp) {
          const answer = await webrtcActions.createAnswer(payload.sdp);
          if (answer) {
            socket.emit('call.sdp_answer', {
              callId: payload.callId,
              sdp: answer,
              callerId: payload.callerId
            });
          }
        }
      }
    });

    // WebRTC SDP Answer
    socket.on('call.sdp_answer', async (payload: WebRTCSignalingPayload) => {
      console.log('[Call] SDP Answer received:', payload);
      if (payload.sdp) {
        await webrtcActions.setRemoteAnswer(payload.sdp);
      }
    });

    // WebRTC ICE Candidate
    socket.on('call.ice_candidate', async (payload: WebRTCSignalingPayload) => {
      console.log('[Call] ICE Candidate received:', payload);
      if (payload.candidate) {
        await webrtcActions.addIceCandidate(payload.candidate);
      }
    });

    // Handle ICE candidates from local peer
    if (socketRef.current) {
      // This will be set up when peer connection is created
    }

    return () => {
      socket.off('call.incoming');
      socket.off('call.answered');
      socket.off('call.rejected');
      socket.off('call.ended');
      socket.off('call.sdp_offer');
      socket.off('call.sdp_answer');
      socket.off('call.ice_candidate');
    };
  }, [currentCall?.id, webrtcActions]);

  const initiateCall = useCallback(async (conversationId: string, receiverId: string, callType: CallType) => {
    try {
      // Start local stream
      const stream = await webrtcActions.startLocalStream(callType === 'video');
      if (!stream) {
        throw new Error('Failed to start local stream');
      }

      // Create call via API
      const call = await apiFetch<Call>('/calls', {
        method: 'POST',
        body: JSON.stringify({ conversationId, receiverId, callType })
      });

      setCurrentCall(call);
      
      // Emit call initiate event
      if (socketRef.current) {
        socketRef.current.emit('call.initiate', {
          conversationId,
          receiverId,
          callType
        });
      }

      // Notify receiver about incoming call
      if (socketRef.current) {
        socketRef.current.emit('call.incoming', {
          callId: call.id,
          caller: call.caller,
          callType,
          conversationId
        });
      }
    } catch (error) {
      console.error('[Call] Failed to initiate call:', error);
      webrtcActions.stopLocalStream();
      throw error;
    }
  }, [webrtcActions]);

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      // Start local stream
      const stream = await webrtcActions.startLocalStream(incomingCall.callType === 'video');
      if (!stream) {
        throw new Error('Failed to start local stream');
      }

      // Update call status via API
      const call = await apiFetch<Call>(`/calls/${incomingCall.callId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'connected' })
      });

      setCurrentCall(call);
      setIsCallActive(true);
      callStartTimeRef.current = new Date();
      setIncomingCall(null);

      // Notify caller
      if (socketRef.current) {
        socketRef.current.emit('call.answer', {
          callId: incomingCall.callId,
          callerId: incomingCall.caller.id
        });
      }
    } catch (error) {
      console.error('[Call] Failed to answer call:', error);
      webrtcActions.stopLocalStream();
      throw error;
    }
  }, [incomingCall, webrtcActions]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    // Update call status via API
    apiFetch<Call>(`/calls/${incomingCall.callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' })
    }).catch(console.error);

    // Notify caller
    if (socketRef.current) {
      socketRef.current.emit('call.reject', {
        callId: incomingCall.callId,
        callerId: incomingCall.caller.id,
        reason: 'rejected'
      });
    }

    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(async () => {
    if (!currentCall) return;

    const duration = callStartTimeRef.current 
      ? Math.floor((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000)
      : 0;

    // Update call status via API
    try {
      await apiFetch<Call>(`/calls/${currentCall.id}/end`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('[Call] Failed to end call:', error);
    }

    // Notify other party
    const targetUserId = currentCall.callerId === currentCall.receiverId 
      ? currentCall.receiverId 
      : currentCall.callerId;
    
    if (socketRef.current) {
      socketRef.current.emit('call.end', {
        callId: currentCall.id,
        targetUserId,
        duration
      });
    }

    // Cleanup
    webrtcActions.stopLocalStream();
    webrtcActions.closePeerConnection();
    setCurrentCall(null);
    setIsCallActive(false);
    callStartTimeRef.current = null;
  }, [currentCall, webrtcActions]);

  const loadCallHistory = useCallback(async () => {
    try {
      const response = await apiFetch<{ data: Call[] }>('/calls');
      setCallHistory(response.data || []);
    } catch (error) {
      console.error('[Call] Failed to load call history:', error);
    }
  }, []);

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const value: CallContextType = {
    currentCall,
    incomingCall,
    isCallActive,
    callHistory,
    localStream: webrtcState.localStream,
    remoteStream: webrtcState.remoteStream,
    isMuted: webrtcState.isMuted,
    isVideoOff: webrtcState.isVideoOff,
    isFrontCamera: webrtcState.isFrontCamera,
    connectionState: webrtcState.connectionState,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute: webrtcActions.toggleMute,
    toggleVideo: webrtcActions.toggleVideo,
    switchCamera: webrtcActions.switchCamera,
    loadCallHistory,
    clearIncomingCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
