# WALA - Secure WhatsApp-like Application

## Overview

WALA (WhatsApp-like Application) is a secure, real-time chat application that implements end-to-end encryption using DES encryption for messages and RSA encryption for key exchange. The application features digital signatures for message authenticity and includes both client chat functionality and admin monitoring capabilities.

## Features

### 🔐 Security Features
- **DES Encryption**: All messages are encrypted using DES with session-specific keys
- **RSA Key Exchange**: Secure session key distribution using 2048-bit RSA encryption
- **Digital Signatures**: Message authenticity verification using RSA signatures
- **Automatic Key Rotation**: RSA keys are automatically updated every 30 minutes
- **Secure Storage**: All messages stored encrypted on the server

### 💬 Chat Features
- **Real-time Messaging**: Instant message delivery using WebSocket connections
- **Group Chat**: Broadcast messages to all connected users
- **Private Chat**: Direct messaging between users
- **Message History**: Encrypted message storage and retrieval
- **Online Status**: Real-time user presence indicators

### 👨‍💼 Admin Features
- **System Monitoring**: Real-time server statistics and user activity
- **User Management**: View connected users and their status
- **Message Logging**: Monitor message flow and system activity
- **Security Dashboard**: Overview of encryption status and security metrics
- **Server Statistics**: Uptime, connection counts, and performance metrics

## Architecture

### Backend (Node.js + Socket.io)
- **Express Server**: RESTful API endpoints
- **Socket.io**: Real-time WebSocket communication
- **Crypto Module**: RSA key generation and management
- **CryptoJS**: DES encryption/decryption
- **Security Middleware**: Rate limiting, CORS, and Helmet protection

### Frontend (React.js)
- **React 18**: Modern React with hooks and context
- **Styled Components**: CSS-in-JS styling
- **Socket.io Client**: Real-time communication
- **React Router**: Client-side routing
- **React Toastify**: User notifications

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   cd newProj
   npm run install-all
   ```

2. **Start the Application**
   ```bash
   npm start
   ```
   This will start both the server (port 5000) and client (port 3000) concurrently.

3. **Access the Application**
   - Client Interface: http://localhost:3000
   - Server API: http://localhost:5000

## Usage

### For Clients
1. Open http://localhost:3000 in your browser
2. Select "Client" and enter a unique username
3. Start chatting securely with other connected users
4. All messages are automatically encrypted and signed

### For Administrators
1. Open http://localhost:3000 in your browser
2. Select "Admin" and enter the admin password: `admin123`
3. Monitor system status, connected users, and message activity
4. View security metrics and server performance

## Security Implementation

### Encryption Flow
1. **Initial Connection**: Client generates RSA key pair
2. **Key Exchange**: Server sends its public RSA key to client
3. **Session Key**: Server generates DES session key, encrypts with client's public key
4. **Message Encryption**: All messages encrypted with DES session key
5. **Digital Signatures**: Messages signed with sender's RSA private key
6. **Key Rotation**: RSA keys automatically rotated every 30 minutes

### Security Measures
- Rate limiting to prevent spam and DoS attacks
- CORS protection for cross-origin requests
- Helmet.js for security headers
- Input validation and sanitization
- Secure session management
- Encrypted message storage

## API Endpoints

### REST API
- `GET /api/health` - Server health check
- `GET /api/stats` - Basic server statistics

### WebSocket Events

#### Client Events
- `register` - User registration with RSA public key
- `send-message` - Send encrypted message
- `get-message-history` - Retrieve message history

#### Server Events
- `server-public-key` - Server's RSA public key
- `registration-success` - Successful registration with encrypted session key
- `new-message` - Incoming message notification
- `users-update` - Online users list update
- `rsa-key-update` - RSA key rotation notification

#### Admin Events
- `admin-login` - Administrator authentication
- `get-admin-data` - Request system data
- `admin-data` - System statistics and user data
- `system-status` - Real-time system status updates

## File Structure

```
newProj/
├── package.json                 # Root package configuration
├── server/
│   └── index.js                # Main server file
├── client/
│   ├── package.json            # Client dependencies
│   ├── public/
│   │   ├── index.html          # HTML template
│   │   ├── manifest.json       # PWA manifest
│   │   └── favicon.svg         # Application icon
│   └── src/
│       ├── index.js            # React entry point
│       ├── index.css           # Base styles
│       ├── App.js              # Main App component
│       ├── components/
│       │   ├── Login.js        # Authentication component
│       │   ├── ChatApp.js      # Main chat interface
│       │   └── AdminDashboard.js # Admin monitoring panel
│       ├── context/
│       │   ├── SocketContext.js # WebSocket management
│       │   └── AuthContext.js  # Authentication state
│       └── styles/
│           └── GlobalStyles.js # Global styling
└── README.md                   # This file
```

## Testing on Multiple Computers

### Network Setup
1. **Find Server IP**: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your local IP
2. **Update Client Configuration**: In `client/src/context/SocketContext.js`, replace `localhost` with your server's IP address
3. **Firewall**: Ensure ports 3000 and 5000 are open on the server machine
4. **Start Server**: Run the application on the server machine
5. **Connect Clients**: Access `http://[SERVER_IP]:3000` from other computers

### Example Configuration
```javascript
// In SocketContext.js
const newSocket = io('http://192.168.1.100:5000', {
  transports: ['websocket', 'polling']
});
```

## Development

### Available Scripts
- `npm start` - Start both server and client
- `npm run server` - Start only the server
- `npm run client` - Start only the client
- `npm run build` - Build client for production
- `npm run install-all` - Install all dependencies

### Environment Variables
Create a `.env` file in the root directory:
```
PORT=5000
NODE_ENV=development
ADMIN_PASSWORD=admin123
```

## Security Considerations

### Production Deployment
- Change default admin password
- Use HTTPS/WSS for encrypted transport
- Implement proper user authentication
- Use a production database (MongoDB, PostgreSQL)
- Set up proper logging and monitoring
- Configure firewall and network security
- Regular security audits and updates

### Known Limitations
- DES encryption (56-bit) is considered weak by modern standards
- In-memory storage (use database in production)
- Simple admin authentication (implement proper auth)
- No user registration persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## Acknowledgments

- Socket.io for real-time communication
- CryptoJS for encryption utilities
- React community for excellent documentation
- Node.js ecosystem for robust backend tools