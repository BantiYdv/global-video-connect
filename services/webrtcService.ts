
import { io, Socket } from 'socket.io-client';
import type { SignalPayload, SignalType, User, Room, CallParticipant } from '../types';

// WebSocket connection
let socket: Socket | null = null;
let isConnected = false;
let isInitializing = false;

// Room state
let currentRoom: Room | null = null;
let participants: CallParticipant[] = [];
let peerConnections: Map<string, RTCPeerConnection> = new Map();

// Event listeners
const eventListeners: Map<string, Function[]> = new Map();

export const initializeSocket = (serverUrl: string = 'http://192.168.1.43:3001') => {
  if (socket && isConnected) {
    console.log('Socket already connected');
    return socket;
  }

  if (isInitializing) {
    console.log('Socket initialization in progress...');
    return socket;
  }

  isInitializing = true;
  console.log('Initializing socket connection to:', serverUrl);

  if (socket) {
    socket.disconnect();
  }

  socket = io(serverUrl, {
    transports: ['websocket'],
    autoConnect: true,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('Connected to signaling server');
    isConnected = true;
    isInitializing = false;
    emit('socket-connected');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from signaling server');
    isConnected = false;
    emit('socket-disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    isInitializing = false;
    emit('socket-error', error);
  });

  socket.on('signal', (payload: SignalPayload) => {
    handleSignal(payload);
  });

  socket.on('room-joined', (room: Room) => {
    currentRoom = room;
    emit('room-joined', room);
  });

  socket.on('user-joined', (user: User) => {
    console.log('User joined:', user.username);
    emit('user-joined', user);
  });

  socket.on('user-left', (userId: string) => {
    console.log('User left:', userId);
    emit('user-left', userId);
  });

  socket.on('room-participants', (roomParticipants: User[]) => {
    participants = roomParticipants.map(user => ({
      user,
      stream: null,
      isMuted: false,
      isVideoEnabled: true,
      isLocal: false
    }));
    emit('room-participants-updated', participants);
  });

  return socket;
};

export const connectToServer = (userId: string, username: string) => {
  if (!socket) {
    initializeSocket();
  }
  
  if (isConnected) {
    socket?.emit('user-connect', { id: userId, username });
  } else {
    socket?.once('connect', () => {
      socket?.emit('user-connect', { id: userId, username });
      console.log('User connected to server:', username);
    });
  }
};

export const joinRoom = (roomId: string, userId: string, username: string) => {
  if (!socket) {
    console.log('Socket not initialized, initializing...');
    initializeSocket();
  }
  
  if (!isConnected) {
    console.log('Socket not connected, waiting for connection...');
    socket?.once('connect', () => {
      console.log('Socket connected, joining room:', roomId);
      socket?.emit('join-room', { roomId, userId, username });
    });
    return;
  }
  
  console.log('Joining room:', roomId);
  socket.emit('join-room', { roomId, userId, username });
};

export const leaveRoom = () => {
  if (!socket || !isConnected) return;
  
  if (currentRoom) {
    socket.emit('leave-room', { roomId: currentRoom.id });
  }
  
  // Clean up peer connections
  peerConnections.forEach(pc => pc.close());
  peerConnections.clear();
  
  currentRoom = null;
  participants = [];
};

export const sendSignal = (payload: SignalPayload) => {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  
  if (!isConnected) {
    console.log('Socket not connected, queuing signal...');
    socket.once('connect', () => {
      socket?.emit('signal', payload);
    });
    return;
  }
  
  socket.emit('signal', payload);
};

const handleSignal = async (payload: SignalPayload) => {
  console.log('Received signal:', payload.type, 'from:', payload.from);
  
  switch (payload.type) {
    case 'offer':
      await handleOffer(payload);
      break;
    case 'answer':
      await handleAnswer(payload);
      break;
    case 'candidate':
      await handleCandidate(payload);
      break;
    case 'hangup':
      handleHangup(payload);
      break;
  }
};

const handleOffer = async (payload: SignalPayload) => {
  const { from, data } = payload;
  
  if (!data) return;
  
  const pc = createPeerConnection(
    (candidate) => {
      sendSignal({
        type: 'candidate',
        from: currentUser?.id || '',
        to: from,
        roomId: currentRoom?.id,
        data: candidate.toJSON()
      });
    },
    (event) => {
      const participant = participants.find(p => p.user.id === from);
      if (participant) {
        participant.stream = event.streams[0];
        emit('participant-stream-updated', participant);
      }
    }
  );
  
  peerConnections.set(from, pc);
  
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    sendSignal({
      type: 'answer',
      from: currentUser?.id || '',
      to: from,
      roomId: currentRoom?.id,
      data: answer
    });
  } catch (error) {
    console.error('Error handling offer:', error);
  }
};

const handleAnswer = async (payload: SignalPayload) => {
  const { from, data } = payload;
  
  if (!data) return;
  
  const pc = peerConnections.get(from);
  if (pc) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }
};

const handleCandidate = async (payload: SignalPayload) => {
  const { from, data } = payload;
  
  if (!data) return;
  
  const pc = peerConnections.get(from);
  if (pc) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit));
    } catch (error) {
      console.error('Error handling candidate:', error);
    }
  }
};

const handleHangup = (payload: SignalPayload) => {
  const { from } = payload;
  
  const pc = peerConnections.get(from);
  if (pc) {
    pc.close();
    peerConnections.delete(from);
  }
  
  // Remove participant
  participants = participants.filter(p => p.user.id !== from);
  emit('participant-removed', from);
};

// Global user state
let currentUser: User | null = null;

export const setCurrentUser = (user: User) => {
  currentUser = user;
};

export const createPeerConnection = (
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection => {
  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  const pc = new RTCPeerConnection(servers);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = onTrack;

  return pc;
};

export const createOfferForUser = async (targetUserId: string, localStream: MediaStream) => {
  const pc = createPeerConnection(
    (candidate) => {
      sendSignal({
        type: 'candidate',
        from: currentUser?.id || '',
        to: targetUserId,
        roomId: currentRoom?.id,
        data: candidate.toJSON()
      });
    },
    (event) => {
      const participant = participants.find(p => p.user.id === targetUserId);
      if (participant) {
        participant.stream = event.streams[0];
        emit('participant-stream-updated', participant);
      }
    }
  );

  peerConnections.set(targetUserId, pc);
  
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    sendSignal({
      type: 'offer',
      from: currentUser?.id || '',
      to: targetUserId,
      roomId: currentRoom?.id,
      data: offer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
  }
};

// Event system
export const on = (event: string, callback: Function) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  eventListeners.get(event)!.push(callback);
};

export const off = (event: string, callback: Function) => {
  const listeners = eventListeners.get(event);
  if (listeners) {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
};

const emit = (event: string, data?: any) => {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(callback => callback(data));
  }
};

export const getCurrentRoom = () => currentRoom;
export const getParticipants = () => participants;
export const isSocketConnected = () => isConnected;
