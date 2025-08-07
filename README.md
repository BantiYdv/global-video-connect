# Global Video Connect

A real-time global video calling application that allows users to join video rooms and connect with people around the world.

## Features

- 🌍 **Global Video Calls**: Join rooms and connect with users worldwide
- 👥 **Multi-Participant Support**: Support for multiple users in a single room
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎥 **Video/Audio Controls**: Mute/unmute audio and enable/disable video
- 🔄 **Real-time Signaling**: WebSocket-based signaling for WebRTC connections
- 🏠 **Room Management**: Create and join rooms with unique IDs
- 👤 **User Authentication**: Simple user registration and login system

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Real-time Communication**: WebRTC, Socket.IO
- **Styling**: Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Server Dependencies

```bash
# Copy server package.json to server directory
cp server-package.json server/package.json
cd server
npm install
```

## Running the Application

### 1. Start the WebSocket Server

```bash
cd server
npm start
```

The server will start on `http://localhost:3001`

### 2. Start the Frontend Development Server

```bash
# In the root directory
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Join a Room**: 
   - Create a new room with a custom name
   - Join an existing room by clicking on it
   - Use the "Quick Join" feature to enter a room ID directly
3. **Video Call**: 
   - Allow camera and microphone permissions
   - Use the controls to mute/unmute or enable/disable video
   - Click on participant videos to view them in speaker mode
   - Use the grid view to see all participants

## Project Structure

```
global-video-connect/
├── components/
│   ├── AuthForm.tsx          # User authentication
│   ├── GlobalVideoCall.tsx   # Multi-participant video call UI
│   ├── RoomList.tsx          # Room listing and creation
│   ├── icons.tsx             # SVG icons
│   └── VideoCall.tsx         # Legacy single-call component
├── services/
│   └── webrtcService.ts      # WebRTC and WebSocket logic
├── types.ts                  # TypeScript type definitions
├── App.tsx                   # Main application component
├── server.js                 # WebSocket server
└── package.json              # Frontend dependencies
```

## WebRTC Features

- **STUN Servers**: Multiple Google STUN servers for NAT traversal
- **Peer-to-Peer**: Direct connections between participants
- **Automatic Reconnection**: Handles connection drops gracefully
- **Room-based Signaling**: Efficient signaling for multiple participants

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Development

### Adding New Features

1. **New Room Types**: Modify the `Room` interface in `types.ts`
2. **Additional Controls**: Add new controls to `GlobalVideoCall.tsx`
3. **Custom Signaling**: Extend the signaling protocol in `webrtcService.ts`

### Testing

1. Open multiple browser windows/tabs
2. Register different users
3. Join the same room
4. Test video/audio functionality

## Deployment

### Frontend

```bash
npm run build
```

### Server

```bash
# Set environment variables
PORT=3001
NODE_ENV=production

# Start server
npm start
```

## Troubleshooting

### Common Issues

1. **Camera/Microphone not working**: Check browser permissions
2. **Connection issues**: Ensure the WebSocket server is running
3. **Video not displaying**: Check WebRTC support in browser

### Debug Mode

Enable console logging by checking the browser's developer tools for detailed connection information.

## License

MIT License - feel free to use this project for learning and development.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Future Enhancements

- [ ] Screen sharing
- [ ] Chat functionality
- [ ] Recording capabilities
- [ ] Advanced room settings
- [ ] User profiles and avatars
- [ ] Mobile app version
