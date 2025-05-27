import React, { useState } from 'react';
import styled from 'styled-components';
import { FaUser, FaLock, FaUserShield, FaComments } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
`;

const UserTypeSelector = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
`;

const UserTypeButton = styled.button`
  flex: 1;
  padding: 1rem;
  border: none;
  background: ${props => props.active === 'true' ? '#667eea' : 'white'};
  color: ${props => props.active === 'true' ? 'white' : '#666'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.active === 'true' ? '#5a6fd8' : '#f5f5f5'};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.1rem;
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ConnectionStatus = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 5px;
  font-size: 0.9rem;
  background: ${props => props.connected === 'true' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.connected === 'true' ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.connected === 'true' ? '#c3e6cb' : '#f5c6cb'};
`;

const InfoText = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
  line-height: 1.4;
`;

const Login = () => {
  const [userType, setUserType] = useState('client');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { connected, registerUser, adminLogin } = useSocket();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error('Not connected to server');
      return;
    }

    setLoading(true);

    try {
      if (userType === 'client') {
        if (!username.trim()) {
          toast.error('Please enter a username');
          setLoading(false);
          return;
        }
        
        // Register user and wait for response
        registerUser(username.trim());
        
        // Simulate waiting for registration response
        setTimeout(() => {
          login({ username: username.trim() }, 'client');
          setLoading(false);
        }, 1000);
        
      } else {
        if (!password) {
          toast.error('Please enter admin password');
          setLoading(false);
          return;
        }
        
        // Admin login
        adminLogin(password);
        
        // Simulate waiting for admin login response
        setTimeout(() => {
          login({ username: 'Admin' }, 'admin');
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Welcome to WALA</Title>
        
        <UserTypeSelector>
          <UserTypeButton
            type="button"
            active={(userType === 'client').toString()}
            onClick={() => setUserType('client')}
          >
            <FaComments />
            Client
          </UserTypeButton>
          <UserTypeButton
            type="button"
            active={(userType === 'admin').toString()}
            onClick={() => setUserType('admin')}
          >
            <FaUserShield />
            Admin
          </UserTypeButton>
        </UserTypeSelector>

        <Form onSubmit={handleSubmit}>
          {userType === 'client' ? (
            <InputGroup>
              <InputIcon>
                <FaUser />
              </InputIcon>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </InputGroup>
          ) : (
            <InputGroup>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </InputGroup>
          )}

          <LoginButton type="submit" disabled={loading || !connected}>
            {loading ? 'Connecting...' : userType === 'client' ? 'Join Chat' : 'Admin Login'}
          </LoginButton>
        </Form>

        <ConnectionStatus connected={connected.toString()}>
          {connected ? '🟢 Connected to server' : '🔴 Connecting to server...'}
        </ConnectionStatus>

        {userType === 'client' ? (
          <InfoText>
            Enter a unique username to join the secure chat.
            All messages are encrypted with DES and digitally signed.
          </InfoText>
        ) : (
          <InfoText>
            Admin access allows monitoring of the WALA server,
            user connections, and message statistics.
            <br /><br />
            <strong>Demo password: admin123</strong>
          </InfoText>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;