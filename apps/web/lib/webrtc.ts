'use client';

import { useCallback, useRef, useState } from 'react';

export type WebRTCState = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isFrontCamera: boolean;
  connectionState: RTCPeerConnectionState | 'idle';
};

export type WebRTCActions = {
  startLocalStream: (isVideo: boolean) => Promise<MediaStream | null>;
  stopLocalStream: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => Promise<void>;
  createPeerConnection: () => RTCPeerConnection | null;
  closePeerConnection: () => void;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
  setRemoteAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
};

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC(): [WebRTCState, WebRTCActions] {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
    isFrontCamera: true,
    connectionState: 'idle',
  });

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  const startLocalStream = useCallback(async (isVideo: boolean): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: isVideo ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (isVideo) {
        videoTrackRef.current = stream.getVideoTracks()[0] || null;
      }

      setState(prev => ({ ...prev, localStream: stream, isVideoOff: !isVideo }));
      return stream;
    } catch (error) {
      console.error('[WebRTC] Failed to start local stream:', error);
      return null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    videoTrackRef.current = null;
    setState(prev => ({ ...prev, localStream: null }));
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (localStreamRef.current && videoTrackRef.current) {
      const currentFacingMode = state.isFrontCamera ? 'user' : 'environment';
      const newFacingMode = state.isFrontCamera ? 'environment' : 'user';
      
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        
        localStreamRef.current.addTrack(newVideoTrack);
        videoTrackRef.current = newVideoTrack;

        // Update peer connection if exists
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }

        setState(prev => ({ 
          ...prev, 
          localStream: localStreamRef.current, 
          isFrontCamera: !prev.isFrontCamera 
        }));
      } catch (error) {
        console.error('[WebRTC] Failed to switch camera:', error);
      }
    }
  }, [state.isFrontCamera]);

  const createPeerConnection = useCallback((): RTCPeerConnection | null => {
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionRef.current = pc;

      // Create remote stream
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      setState(prev => ({ ...prev, remoteStream, connectionState: pc.connectionState }));

      // Handle remote tracks
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
        setState(prev => ({ ...prev, remoteStream }));
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        setState(prev => ({ ...prev, connectionState: pc.connectionState }));
      };

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    } catch (error) {
      console.error('[WebRTC] Failed to create peer connection:', error);
      return null;
    }
  }, []);

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }
    setState(prev => ({ ...prev, remoteStream: null, connectionState: 'idle' }));
  }, []);

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    if (!peerConnectionRef.current) return null;
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error);
      return null;
    }
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
    if (!peerConnectionRef.current) return null;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('[WebRTC] Failed to create answer:', error);
      return null;
    }
  }, []);

  const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit): Promise<void> => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('[WebRTC] Failed to set remote answer:', error);
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[WebRTC] Failed to add ICE candidate:', error);
    }
  }, []);

  return [state, {
    startLocalStream,
    stopLocalStream,
    toggleMute,
    toggleVideo,
    switchCamera,
    createPeerConnection,
    closePeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
  }];
}
