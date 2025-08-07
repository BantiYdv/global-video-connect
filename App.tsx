
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User, StoredUser, CallParticipant, Room } from './types';
import { AuthForm } from './components/AuthForm';
import { RoomList } from './components/RoomList';
import { GlobalVideoCall } from './components/GlobalVideoCall';
import { 
  initializeSocket, 
  connectToServer, 
  joinRoom, 
  leaveRoom, 
  setCurrentUser, 
  on, 
  off,
  createOfferForUser,
  getCurrentRoom,
  getParticipants,
  isSocketConnected
} from './services/webrtcService';

// In a real app, use a proper hashing library like bcrypt.
// This is a simplified hash for demonstration.
const simpleHash = async (text: string) => {
    try {
        // Check if crypto.subtle is available
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const buffer = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback for environments where crypto.subtle is not available
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16);
        }
    } catch (error) {
        console.error('Hash error:', error);
        // Fallback to simple hash
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
};

// Generate UUID with fallback for older browsers
const generateUUID = () => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        } else {
            // Fallback UUID generator
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    } catch (error) {
        console.error('UUID generation error:', error);
        // Simple fallback
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

const App: React.FC = () => {
    const [currentUser, setCurrentUserState] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentRoom, setCurrentRoomState] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<CallParticipant[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isInCall, setIsInCall] = useState(false);

    const socketRef = useRef<any>(null);

    const getUsers = useCallback(() => {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]') as StoredUser[];
        return storedUsers.map(({ id, username }) => ({ id, username }));
    }, []);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null') as User | null;
        if (storedUser) {
            setCurrentUserState(storedUser);
            setCurrentUser(storedUser);
        }
        // Initialize WebSocket immediately
        initializeWebSocket();
    }, []);

    const initializeWebSocket = useCallback(() => {
        console.log('Initializing WebSocket connection...');
        
        // Initialize socket immediately
        socketRef.current = initializeSocket();
        
        // Set up event listeners
        on('socket-connected', () => {
            console.log('Socket connected');
            setIsConnected(true);
            // Connect user if we have currentUser
            if (currentUser) {
                connectToServer(currentUser.id, currentUser.username);
            }
        });

        on('socket-disconnected', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        on('room-joined', (room: Room) => {
            console.log('Joined room:', room);
            setCurrentRoomState(room);
            setIsInCall(true);
        });

        on('user-joined', (user: User) => {
            console.log('User joined room:', user);
            // Add new participant
            const newParticipant: CallParticipant = {
                user,
                stream: null,
                isMuted: false,
                isVideoEnabled: true,
                isLocal: false
            };
            setParticipants(prev => [...prev, newParticipant]);
            
            // Create offer for new user if we have a local stream
            if (localStream && currentUser) {
                createOfferForUser(user.id, localStream);
            }
        });

        on('user-left', (userId: string) => {
            console.log('User left room:', userId);
            setParticipants(prev => prev.filter(p => p.user.id !== userId));
        });

        on('room-participants-updated', (roomParticipants: CallParticipant[]) => {
            console.log('Room participants updated:', roomParticipants);
            setParticipants(roomParticipants);
        });

        on('participant-stream-updated', (participant: CallParticipant) => {
            setParticipants(prev => 
                prev.map(p => p.user.id === participant.user.id ? participant : p)
            );
        });

        on('participant-removed', (userId: string) => {
            setParticipants(prev => prev.filter(p => p.user.id !== userId));
        });

        return () => {
            // Cleanup event listeners
            off('socket-connected', () => {});
            off('socket-disconnected', () => {});
            off('room-joined', () => {});
            off('user-joined', () => {});
            off('user-left', () => {});
            off('room-participants-updated', () => {});
            off('participant-stream-updated', () => {});
            off('participant-removed', () => {});
        };
    }, [currentUser, localStream]);

    // Connect user to server when currentUser changes
    useEffect(() => {
        if (currentUser && isConnected) {
            console.log('Connecting user to server:', currentUser.username);
            connectToServer(currentUser.id, currentUser.username);
        }
    }, [currentUser, isConnected]);

    const handleAuth = async (username: string, password: string) => {
        try {
            setAuthError(null);
            let storedUsers = JSON.parse(localStorage.getItem('users') || '[]') as StoredUser[];
            const passwordHash = await simpleHash(password);
            const existingUser = storedUsers.find(u => u.username === username);

            if (existingUser) { // Login
                if (existingUser.passwordHash === passwordHash) {
                    const user = { id: existingUser.id, username: existingUser.username };
                    setCurrentUserState(user);
                    setCurrentUser(user);
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    initializeWebSocket();
                } else {
                    setAuthError('Incorrect password.');
                }
            } else { // Register
                const newUser: StoredUser = { id: generateUUID(), username, passwordHash };
                storedUsers.push(newUser);
                localStorage.setItem('users', JSON.stringify(storedUsers));
                const user = { id: newUser.id, username: newUser.username };
                setCurrentUserState(user);
                setCurrentUser(user);
                localStorage.setItem('currentUser', JSON.stringify(user));
                initializeWebSocket();
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setAuthError('Authentication failed. Please try again.');
        }
    };

    const handleLogout = () => {
        handleHangUp();
        localStorage.removeItem('currentUser');
        setCurrentUserState(null);
        setCurrentUser(null);
        setIsConnected(false);
        setCurrentRoomState(null);
        setParticipants([]);
        setLocalStream(null);
        setIsInCall(false);
    };

    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            setLocalStream(stream);
            setIsVideoEnabled(true);
            setIsMuted(false);
            return stream;
        } catch (error) {
            console.error("Error accessing media devices.", error);
            alert("Could not access camera and microphone. Please check permissions.");
            return null;
        }
    }, []);

    const handleJoinRoom = useCallback(async (roomId: string) => {
        if (!currentUser) return;

        const stream = await startLocalStream();
        if (stream) {
            // Add local user to participants
            const localParticipant: CallParticipant = {
                user: currentUser,
                stream: null, // Local stream is handled separately
                isMuted: false,
                isVideoEnabled: true,
                isLocal: true
            };
            setParticipants([localParticipant]);
            
            joinRoom(roomId, currentUser.id, currentUser.username);
        }
    }, [currentUser, startLocalStream]);

    const handleCreateRoom = useCallback((roomId: string) => {
        handleJoinRoom(roomId);
    }, [handleJoinRoom]);

    const handleHangUp = useCallback(() => {
        leaveRoom();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setCurrentRoomState(null);
        setParticipants([]);
        setIsInCall(false);
    }, [localStream]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(prev => !prev);
        }
    };
    
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(prev => !prev);
        }
    };
    
    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <AuthForm onAuth={handleAuth} authError={authError} />
            </div>
        );
    }
    
    if (isInCall && currentRoom) {
        return (
            <GlobalVideoCall
                participants={participants}
                localStream={localStream}
                onHangUp={handleHangUp}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                isMuted={isMuted}
                isVideoEnabled={isVideoEnabled}
                roomName={currentRoom.name}
            />
        );
    }

    return (
        <RoomList 
            currentUser={currentUser}
            onJoinRoom={handleJoinRoom}
            onLogout={handleLogout}
            onCreateRoom={handleCreateRoom}
        />
    );
};

export default App;
