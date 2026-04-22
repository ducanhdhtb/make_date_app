'use client';

import React from 'react';
import { useCall } from '../lib/call-context';

export function IncomingCallModal() {
  const { incomingCall, answerCall, rejectCall, clearIncomingCall } = useCall();

  if (!incomingCall) return null;

  const handleAnswer = async () => {
    try {
      await answerCall();
    } catch (error) {
      console.error('Failed to answer call:', error);
      alert('Không thể trả lời cuộc gọi. Vui lòng thử lại.');
    }
  };

  const handleReject = () => {
    rejectCall();
  };

  const isVideo = incomingCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-pulse">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {incomingCall.caller.avatarUrl ? (
              <img
                src={incomingCall.caller.avatarUrl}
                alt={incomingCall.caller.displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-pink-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {incomingCall.caller.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {isVideo ? '📹 Video' : '📞 Voice'}
            </div>
          </div>

          {/* Caller info */}
          <h2 className="mt-6 text-xl font-bold text-gray-900">
            {incomingCall.caller.displayName}
          </h2>
          <p className="text-gray-500 mt-1">
            {isVideo ? 'Đang gọi video...' : 'Đang gọi...'}
          </p>

          {/* Actions */}
          <div className="flex gap-6 mt-8">
            <button
              onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleAnswer}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-lg animate-bounce"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Kéo xuống để bỏ qua
          </p>
        </div>
      </div>
    </div>
  );
}
