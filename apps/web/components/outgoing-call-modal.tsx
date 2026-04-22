'use client';

import React from 'react';
import { useCall } from '../lib/call-context';

export function OutgoingCallModal() {
  const { currentCall, isCallActive, endCall, isVideoOff } = useCall();

  // Only show if there's a current call but it's not yet active
  if (!currentCall || isCallActive) return null;

  const isVideo = currentCall.callType === 'video';
  const receiver = currentCall.receiver;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <div className="relative">
          {receiver?.avatarUrl ? (
            <img
              src={receiver.avatarUrl}
              alt={receiver.displayName}
              className="w-32 h-32 rounded-full object-cover border-4 border-pink-500"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
              {receiver?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute inset-0 rounded-full border-4 border-pink-500/50 animate-ping" />
        </div>

        {/* User info */}
        <h2 className="mt-6 text-2xl font-bold text-white">
          {receiver?.displayName || 'Người dùng'}
        </h2>
        <p className="text-gray-400 mt-2">
          {isVideo ? 'Đang gọi video...' : 'Đang gọi...'}
        </p>

        {/* Call type indicator */}
        <div className="mt-4 flex items-center gap-2 text-pink-400">
          {isVideo ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
          <span className="text-sm">{isVideo ? 'Video Call' : 'Voice Call'}</span>
        </div>

        {/* End call button */}
        <button
          onClick={endCall}
          className="mt-8 w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
        <p className="text-gray-500 text-sm mt-2">Huỷ cuộc gọi</p>
      </div>
    </div>
  );
}
