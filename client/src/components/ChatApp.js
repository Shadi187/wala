import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaPaperPlane, FaUsers, FaLock, FaKey, FaShieldAlt } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import { toast } from 'react-toastify';

const ChatContainer = styled.div`
  display: flex;
  height: calc(100vh - 80px);
  background: rgba(255, 255, 255, 0.1);
`;

const Sidebar = styled.div`
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const SecurityStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const OnlineUsers = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`;

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const UserItem = styled.div`
  padding: 0.75rem;
  border-radius: 8px;
  background: ${props => props.active ? '#667eea' : 'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.active ? 'white' : '#333'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.active ? '#5a6fd8' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const OnlineIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4CAF50;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
`;

const ChatHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.h3`
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EncryptionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
`;

const EncryptionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.8rem;
  background: #e8f5e8;
  color: #2e7d32;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.own ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 1rem 1.5rem;
  border-radius: 20px;
  background: ${props => props.own ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0'};
  color: ${props => props.own ? 'white' : '#333'};
  word-wrap: break-word;
  position: relative;
`;

const MessageInfo = styled.div`
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MessageInput = styled.div`
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  min-height: 50px;
  max-height: 120px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;

  &:hover {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ChatApp = () => {
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const messagesEndRef = useRef(null);
  
  const { 
    connected, 
    username, 
    messages, 
    onlineUsers, 
    sessionKey,
    sendMessage, 
    getMessageHistory 
  } = useSocket();
  
  const { user } = useAuth();

  useEffect(() => {
    if (connected && username) {
      getMessageHistory();
    }
  }, [connected, username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !connected) {
      return;
    }

    sendMessage(message.trim(), selectedUser);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getRecipientName = () => {
    if (selectedUser === 'all') return 'Everyone';
    return selectedUser;
  };

  const filteredMessages = messages.filter(msg => {
    if (selectedUser === 'all') {
      return msg.recipient === 'all' || msg.sender === username;
    }
    return (msg.sender === username && msg.recipient === selectedUser) ||
           (msg.sender === selectedUser && msg.recipient === username) ||
           (msg.recipient === 'all');
  });

  return (
    <ChatContainer>
      <Sidebar>
        <SidebarHeader>
          <UserInfo>
            <FaUsers />
            <div>
              <div style={{ fontWeight: 'bold' }}>{username}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Client</div>
            </div>
          </UserInfo>
          <SecurityStatus>
            <FaShieldAlt />
            <span>End-to-End Encrypted</span>
          </SecurityStatus>
        </SidebarHeader>
        
        <OnlineUsers>
          <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Active Chats</h4>
          <UsersList>
            <UserItem 
              active={selectedUser === 'all'}
              onClick={() => setSelectedUser('all')}
            >
              <OnlineIndicator />
              <span>Everyone ({onlineUsers.length})</span>
            </UserItem>
            {onlineUsers.filter(user => user !== username).map(user => (
              <UserItem
                key={user}
                active={selectedUser === user}
                onClick={() => setSelectedUser(user)}
              >
                <OnlineIndicator />
                <span>{user}</span>
              </UserItem>
            ))}
          </UsersList>
        </OnlineUsers>
      </Sidebar>

      <ChatArea>
        <ChatHeader>
          <ChatTitle>
            <FaLock />
            Chat with {getRecipientName()}
          </ChatTitle>
          <EncryptionInfo>
            <EncryptionBadge>
              <FaKey />
              DES Encrypted
            </EncryptionBadge>
            <EncryptionBadge>
              <FaShieldAlt />
              RSA Signed
            </EncryptionBadge>
            {sessionKey && (
              <span style={{ fontSize: '0.8rem' }}>Session Active</span>
            )}
          </EncryptionInfo>
        </ChatHeader>

        <MessagesContainer>
          {filteredMessages.map((msg, index) => {
            const isOwn = msg.sender === username;
            const displayContent = msg.decryptedContent || msg.content || '[Encrypted Message]';
            
            return (
              <Message key={index} own={isOwn}>
                <MessageBubble own={isOwn}>
                  {displayContent}
                </MessageBubble>
                <MessageInfo>
                  <span>{isOwn ? 'You' : msg.sender}</span>
                  <span>•</span>
                  <span>{moment(msg.timestamp).format('HH:mm')}</span>
                  {msg.signature && (
                    <>
                      <span>•</span>
                      <FaShieldAlt title="Digitally Signed" />
                    </>
                  )}
                </MessageInfo>
              </Message>
            );
          })}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <MessageInput>
          <form onSubmit={handleSendMessage}>
            <InputContainer>
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Send a message to ${getRecipientName()}...`}
                disabled={!connected}
              />
              <SendButton 
                type="submit" 
                disabled={!message.trim() || !connected}
              >
                <FaPaperPlane />
              </SendButton>
            </InputContainer>
          </form>
        </MessageInput>
      </ChatArea>
    </ChatContainer>
  );
};

export default ChatApp;