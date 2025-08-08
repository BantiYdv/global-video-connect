import React, { useState, useEffect } from 'react';
import { User, Room } from '../types';
import { VideoIcon, UsersIcon, PlusIcon, LogOutIcon } from './icons';

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

interface RoomListProps {
  currentUser: User;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
  onCreateRoom: (roomName: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  currentUser,
  onJoinRoom,
  onLogout,
  onCreateRoom
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load rooms from localStorage (in a real app, this would come from the server)
    const storedRooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    setRooms(storedRooms);
  }, []);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    const newRoom: Room = {
      id: generateUUID(),
      name: newRoomName.trim(),
      participants: [],
      maxParticipants: 20
    };
    
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    
    setNewRoomName('');
    setShowCreateRoom(false);
    onCreateRoom(newRoom.id);
  };

  const handleJoinRoom = (roomId: string) => {
    setIsLoading(true);
    onJoinRoom(roomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Global Video Connect</h1>
          <p className="text-light-text text-lg">Join global video calls with people around the world</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-light-text">
              <UsersIcon />
              <span>Welcome, {currentUser.username}!</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-light-text hover:text-white transition-colors"
            >
              <LogOutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Create Room Section */}
        <div className="bg-dark-card rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Available Rooms</h2>
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="flex items-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon />
              <span>Create Room</span>
            </button>
          </div>

          {showCreateRoom && (
            <div className="mb-4 p-4 bg-dark-input rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="flex-1 bg-dark-card text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-brand-secondary focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
                <button
                  onClick={handleCreateRoom}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Room List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <VideoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-light-text text-lg">No rooms available</p>
                <p className="text-medium-text">Create a room to get started!</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-dark-input rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleJoinRoom(room.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                    <div className="flex items-center gap-1 text-light-text">
                      <UsersIcon />
                      <span className="text-sm">{room.participants.length}</span>
                    </div>
                  </div>
                  <p className="text-medium-text text-sm mb-3">
                    Room ID: {room.id.slice(0, 8)}...
                  </p>
                  <button
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      isLoading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-brand-secondary hover:bg-brand-primary text-white'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Joining...' : 'Join Room'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Join Section */}
        <div className="bg-dark-card rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Join</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter room ID..."
              className="flex-1 bg-dark-input text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-brand-secondary focus:outline-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleJoinRoom(e.currentTarget.value.trim());
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Enter room ID..."]') as HTMLInputElement;
                if (input?.value.trim()) {
                  handleJoinRoom(input.value.trim());
                }
              }}
              className="bg-brand-secondary hover:bg-brand-primary text-white px-6 py-2 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
