import React, { useRef, useEffect, useState } from 'react';
import { User, CallParticipant } from '../types';
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneHangUpIcon, UsersIcon } from './icons';

interface GlobalVideoCallProps {
  participants: CallParticipant[];
  localStream: MediaStream | null;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  roomName: string;
}

export const GlobalVideoCall: React.FC<GlobalVideoCallProps> = ({
  participants,
  localStream,
  onHangUp,
  onToggleMute,
  onToggleVideo,
  isMuted,
  isVideoEnabled,
  roomName
}) => {
  const [gridLayout, setGridLayout] = useState<'grid' | 'speaker'>('grid');
  const [speakerParticipant, setSpeakerParticipant] = useState<CallParticipant | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const speakerVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (speakerVideoRef.current && speakerParticipant?.stream) {
      speakerVideoRef.current.srcObject = speakerParticipant.stream;
    }
  }, [speakerParticipant]);

  const handleParticipantClick = (participant: CallParticipant) => {
    if (gridLayout === 'grid') {
      setSpeakerParticipant(participant);
      setGridLayout('speaker');
    }
  };

  const handleBackToGrid = () => {
    setGridLayout('grid');
    setSpeakerParticipant(null);
  };

  const getGridColumns = (count: number) => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const renderParticipantVideo = (participant: CallParticipant, isLarge = false) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
      if (videoRef.current && participant.stream) {
        videoRef.current.srcObject = participant.stream;
      }
    }, [participant.stream]);

    const baseClasses = isLarge 
      ? "w-full h-full object-cover rounded-lg"
      : "w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity";

    return (
      <div className={`relative ${isLarge ? 'w-full h-full' : 'aspect-video'}`}>
        {participant.stream && participant.isVideoEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={baseClasses}
            onClick={() => !isLarge && handleParticipantClick(participant)}
          />
        ) : (
          <div className={`${baseClasses} bg-dark-card flex items-center justify-center`}>
            <div className="text-center">
              <div className={`${isLarge ? 'w-32 h-32' : 'w-16 h-16'} rounded-full bg-dark-input flex items-center justify-center mb-2`}>
                <span className={`${isLarge ? 'text-6xl' : 'text-2xl'} text-light-text`}>
                  {participant.user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className={`${isLarge ? 'text-xl' : 'text-sm'} text-light-text`}>
                {participant.user.username}
              </p>
            </div>
          </div>
        )}
        
        {/* Participant status indicators */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {participant.isMuted && (
            <div className="bg-red-500 text-white p-1 rounded-full">
              <MicOffIcon />
            </div>
          )}
          {!participant.isVideoEnabled && (
            <div className="bg-red-500 text-white p-1 rounded-full">
              <VideoOffIcon />
            </div>
          )}
          {participant.isLocal && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              You
            </div>
          )}
        </div>
      </div>
    );
  };

  if (gridLayout === 'speaker' && speakerParticipant) {
    return (
      <div className="w-full h-screen bg-black flex flex-col relative">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-xl font-semibold">{roomName}</h2>
            <p className="text-sm opacity-75">Speaker view: {speakerParticipant.user.username}</p>
          </div>
          <button
            onClick={handleBackToGrid}
            className="bg-dark-card/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-dark-input transition-colors"
          >
            Back to Grid
          </button>
        </div>

        {/* Speaker Video */}
        <div className="w-full h-full flex items-center justify-center p-4">
          {renderParticipantVideo(speakerParticipant, true)}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-dark-card/80 backdrop-blur-sm p-3 rounded-full">
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-dark-input text-light-text hover:bg-gray-600'}`}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </button>
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-colors ${!isVideoEnabled ? 'bg-red-500 text-white' : 'bg-dark-input text-light-text hover:bg-gray-600'}`}
          >
            {!isVideoEnabled ? <VideoOffIcon /> : <VideoIcon />}
          </button>
          <button
            onClick={onHangUp}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneHangUpIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        <div className="text-white">
          <h2 className="text-xl font-semibold">{roomName}</h2>
          <p className="text-sm opacity-75">{participants.length} participants</p>
        </div>
        <div className="flex items-center gap-2 text-white">
          <UsersIcon />
          <span>{participants.length}</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="w-full h-full flex items-center justify-center p-4 pt-20">
        <div className={`grid ${getGridColumns(participants.length)} gap-4 w-full max-w-6xl`}>
          {participants.map((participant) => (
            <div key={participant.user.id} className="relative">
              {renderParticipantVideo(participant)}
            </div>
          ))}
        </div>
      </div>

      {/* Local Video (Picture-in-Picture) */}
      {localStream && (
        <div className="absolute bottom-24 right-4 w-1/4 max-w-[200px]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full aspect-video rounded-lg border-2 border-brand-secondary shadow-lg ${
              isVideoEnabled ? 'block' : 'hidden'
            }`}
          />
          {!isVideoEnabled && (
            <div className="w-full aspect-video rounded-lg border-2 border-brand-secondary shadow-lg bg-dark-card flex items-center justify-center">
              <p className="text-medium-text text-sm">Camera off</p>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-dark-card/80 backdrop-blur-sm p-3 rounded-full">
        <button
          onClick={onToggleMute}
          className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-dark-input text-light-text hover:bg-gray-600'}`}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </button>
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-colors ${!isVideoEnabled ? 'bg-red-500 text-white' : 'bg-dark-input text-light-text hover:bg-gray-600'}`}
        >
          {!isVideoEnabled ? <VideoOffIcon /> : <VideoIcon />}
        </button>
        <button
          onClick={onHangUp}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <PhoneHangUpIcon />
        </button>
      </div>
    </div>
  );
};
