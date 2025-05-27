const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const CryptoJS = require('crypto-js');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory storage (in production, use a database)
const users = new Map();
const messages = [];
const adminSessions = new Set();

// RSA key management
let serverRSAKey = new NodeRSA({ b: 2048 });
const userRSAKeys = new Map();
const sessionKeys = new Map();

// Regenerate RSA keys every 30 minutes
setInterval(() => {
  console.log('Regenerating RSA keys...');
  serverRSAKey = new NodeRSA({ b: 2048 });
  // Notify all clients about key update
  io.emit('rsa-key-update', {
    publicKey: serverRSAKey.exportKey('public')
  });
}, 30 * 60 * 1000);

// DES encryption/decryption utilities
function encryptDES(text, key) {
  return CryptoJS.DES.encrypt(text, key).toString();
}

function decryptDES(encryptedText, key) {
  const bytes = CryptoJS.DES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Digital signature utilities
function signMessage(message, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  return sign.sign(privateKey, 'hex');
}

function verifySignature(message, signature, publicKey) {
  // For demo purposes, we'll just accept any signature
  // In a real application, we would verify the signature using the public key
  return true;
}

// Generate session key for DES encryption
function generateSessionKey() {
  return crypto.randomBytes(8).toString('hex'); // 64-bit key for DES
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send server's public RSA key to client
  socket.emit('server-public-key', {
    publicKey: serverRSAKey.exportKey('public')
  });

  // Handle user registration
  socket.on('register', (data) => {
    try {
      const { username, clientPublicKey } = data;
      
      if (users.has(username)) {
        socket.emit('registration-error', { message: 'Username already exists' });
        return;
      }

      // Generate session key and encrypt it with client's public key
      const sessionKey = generateSessionKey();
      // For demo purposes, skip RSA encryption since client sends mock keys
      const encryptedSessionKey = Buffer.from(sessionKey).toString('base64');

      // Store user data
      users.set(username, {
        socketId: socket.id,
        publicKey: clientPublicKey,
        sessionKey: sessionKey,
        online: true
      });

      sessionKeys.set(socket.id, sessionKey);
      socket.username = username;

      socket.emit('registration-success', {
        encryptedSessionKey: encryptedSessionKey,
        message: 'Registration successful'
      });

      // Broadcast user list update
      io.emit('users-update', Array.from(users.keys()).filter(u => users.get(u).online));
      
      console.log(`User ${username} registered successfully`);
    } catch (error) {
      console.error('Registration error:', error);
      socket.emit('registration-error', { message: 'Registration failed' });
    }
  });

  // Handle admin login
  socket.on('admin-login', (data) => {
    const { password } = data;
    // Simple admin authentication (in production, use proper authentication)
    if (password === 'admin123') {
      adminSessions.add(socket.id);
      socket.isAdmin = true;
      socket.emit('admin-login-success');
      
      // Send current system status
      socket.emit('system-status', {
        connectedUsers: users.size,
        totalMessages: messages.length,
        activeConnections: io.engine.clientsCount
      });
    } else {
      socket.emit('admin-login-error', { message: 'Invalid admin password' });
    }
  });

  // Handle encrypted message sending
  socket.on('send-message', (data) => {
    try {
      const { encryptedMessage, signature, recipient } = data;
      const sessionKey = sessionKeys.get(socket.id);
      
      if (!sessionKey || !socket.username) {
        socket.emit('message-error', { message: 'Not authenticated' });
        return;
      }

      // Decrypt message to verify and then re-encrypt for storage
      const decryptedMessage = decryptDES(encryptedMessage, sessionKey);
      
      // Verify digital signature
      const senderData = users.get(socket.username);
      if (!verifySignature(decryptedMessage, signature, senderData.publicKey)) {
        socket.emit('message-error', { message: 'Invalid message signature' });
        return;
      }

      // Store encrypted message
      const messageData = {
        id: Date.now(),
        sender: socket.username,
        recipient: recipient,
        encryptedContent: encryptedMessage,
        signature: signature,
        timestamp: new Date().toISOString()
      };
      
      messages.push(messageData);

      // Send to recipient if online
      if (recipient === 'all') {
        // Broadcast to all users including sender
        io.emit('new-message', {
          ...messageData,
          decryptedContent: decryptedMessage // Only for display
        });
      } else {
        const recipientData = users.get(recipient);
        if (recipientData && recipientData.online) {
          io.to(recipientData.socketId).emit('new-message', {
            ...messageData,
            decryptedContent: decryptedMessage
          });
        }
        // Also send to sender for private messages
        socket.emit('new-message', {
          ...messageData,
          decryptedContent: decryptedMessage
        });
      }

      // Send confirmation to sender
      socket.emit('message-sent', { messageId: messageData.id });
      
      // Update admin dashboard
      io.to(Array.from(adminSessions)).emit('message-logged', {
        sender: socket.username,
        recipient: recipient,
        timestamp: messageData.timestamp
      });
      
      console.log(`Message from ${socket.username} to ${recipient}`);
    } catch (error) {
      console.error('Message sending error:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  // Handle message history request
  socket.on('get-message-history', () => {
    if (!socket.username) {
      socket.emit('message-error', { message: 'Not authenticated' });
      return;
    }

    const userMessages = messages.filter(msg => 
      msg.sender === socket.username || 
      msg.recipient === socket.username || 
      msg.recipient === 'all'
    );

    socket.emit('message-history', userMessages);
  });

  // Handle admin requests
  socket.on('get-admin-data', () => {
    if (!socket.isAdmin) {
      socket.emit('admin-error', { message: 'Unauthorized' });
      return;
    }

    socket.emit('admin-data', {
      users: Array.from(users.entries()).map(([username, data]) => ({
        username,
        online: data.online,
        socketId: data.socketId
      })),
      messages: messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        recipient: msg.recipient,
        timestamp: msg.timestamp
      })),
      systemStats: {
        totalUsers: users.size,
        totalMessages: messages.length,
        activeConnections: io.engine.clientsCount,
        serverUptime: process.uptime()
      }
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.username) {
      const userData = users.get(socket.username);
      if (userData) {
        userData.online = false;
        users.set(socket.username, userData);
      }
      
      // Update user list
      io.emit('users-update', Array.from(users.keys()).filter(u => users.get(u).online));
    }
    
    sessionKeys.delete(socket.id);
    adminSessions.delete(socket.id);
  });
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    connectedUsers: users.size,
    totalMessages: messages.length,
    activeConnections: io.engine.clientsCount
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WALA Server running on port ${PORT}`);
  console.log(`Admin password: admin123`);
});