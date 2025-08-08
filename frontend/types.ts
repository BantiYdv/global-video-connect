
export interface User {
  id: string;
  username: string;
}

export interface StoredUser extends User {
  passwordHash: string; // In a real app, never store plain text passwords
}

export type SignalType = 'offer' | 'answer' | 'candidate' | 'hangup' | 'join-room' | 'leave-room' | 'user-joined' | 'user-left';

export interface SignalPayload {
  type: SignalType;
  from: string;
  to?: string; // Optional for room-based signaling
  roomId?: string; // For global video calls
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  user?: User; // For user join/leave events
}

export interface Room {
  id: string;
  name: string;
  participants: User[];
  maxParticipants?: number;
}

export interface CallParticipant {
  user: User;
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isLocal: boolean;
}

export interface GlobalCallState {
  roomId: string;
  participants: CallParticipant[];
  isInCall: boolean;
  localStream: MediaStream | null;
}
