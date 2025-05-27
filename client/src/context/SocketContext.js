import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [serverPublicKey, setServerPublicKey] = useState(null);
  const [clientKeyPair, setClientKeyPair] = useState(null);
  const [sessionKey, setSessionKey] = useState(null);
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5001', {
      transports: ['websocket', 'polling']
    });

    // Generate a simple client identifier (mock RSA for demo)
    const clientKey = {
      publicKey: `client-public-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      privateKey: `client-private-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setClientKeyPair(clientKey);

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('server-public-key', (data) => {
      console.log('Received server public key');
      setServerPublicKey(data.publicKey);
    });

    newSocket.on('rsa-key-update', (data) => {
      console.log('RSA keys updated');
      setServerPublicKey(data.publicKey);
      toast.info('Security keys updated');
    });

    newSocket.on('registration-success', (data) => {
      try {
        // For demo purposes, decode the session key from server (in production, implement proper RSA decryption)
        const sessionKey = Buffer.from(data.encryptedSessionKey, 'base64').toString();
        setSessionKey(sessionKey);
        toast.success('Registration successful!');
      } catch (error) {
        console.error('Failed to establish session:', error);
        toast.error('Failed to establish secure connection');
      }
    });

    newSocket.on('registration-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('admin-login-success', () => {
      setIsAdmin(true);
      toast.success('Admin login successful!');
    });

    newSocket.on('admin-login-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('new-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    newSocket.on('message-history', (history) => {
      setMessages(history);
    });

    newSocket.on('message-sent', (data) => {
      toast.success('Message sent successfully');
    });

    newSocket.on('message-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('users-update', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('admin-error', (data) => {
      toast.error(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Encryption utilities
  const encryptMessage = (message) => {
    if (!sessionKey) {
      throw new Error('No session key available');
    }
    return CryptoJS.DES.encrypt(message, sessionKey).toString();
  };

  const decryptMessage = (encryptedMessage) => {
    if (!sessionKey) {
      throw new Error('No session key available');
    }
    const bytes = CryptoJS.DES.decrypt(encryptedMessage, sessionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  // Digital signature utilities (simplified for demo)
  const signMessage = (message) => {
    if (!clientKeyPair) {
      throw new Error('No key pair available');
    }
    // Simple hash-based signature for demo (in production, use proper RSA signing)
    return CryptoJS.SHA256(message + clientKeyPair.privateKey).toString();
  };

  // User registration
  const registerUser = (username) => {
    if (!socket || !clientKeyPair) {
      toast.error('Connection not ready');
      return;
    }

    setUsername(username);
    socket.emit('register', {
      username,
      clientPublicKey: clientKeyPair.publicKey
    });
  };

  // Admin login
  const adminLogin = (password) => {
    if (!socket) {
      toast.error('Connection not ready');
      return;
    }

    socket.emit('admin-login', { password });
  };

  // Send encrypted message
  const sendMessage = (message, recipient = 'all') => {
    if (!socket || !sessionKey) {
      toast.error('Not connected or authenticated');
      return;
    }

    try {
      const encryptedMessage = encryptMessage(message);
      const signature = signMessage(message);

      socket.emit('send-message', {
        encryptedMessage,
        signature,
        recipient
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  // Get message history
  const getMessageHistory = () => {
    if (!socket) {
      toast.error('Not connected');
      return;
    }
    socket.emit('get-message-history');
  };

  // Get admin data
  const getAdminData = () => {
    if (!socket || !isAdmin) {
      toast.error('Unauthorized');
      return;
    }
    socket.emit('get-admin-data');
  };

  const value = {
    socket,
    connected,
    username,
    isAdmin,
    messages,
    onlineUsers,
    sessionKey,
    registerUser,
    adminLogin,
    sendMessage,
    getMessageHistory,
    getAdminData,
    encryptMessage,
    decryptMessage,
    signMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};