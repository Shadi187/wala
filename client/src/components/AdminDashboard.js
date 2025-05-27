import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaUsers, 
  FaComments, 
  FaServer, 
  FaClock, 
  FaShieldAlt, 
  FaKey,
  FaEye,
  FaSync
} from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import moment from 'moment';
import { toast } from 'react-toastify';

const DashboardContainer = styled.div`
  padding: 2rem;
  min-height: calc(100vh - 80px);
  background: rgba(255, 255, 255, 0.1);
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background: ${props => props.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.2rem;
`;

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid ${props => props.online ? '#4CAF50' : '#f44336'};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OnlineStatus = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.online ? '#4CAF50' : '#f44336'};
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const MessageItem = styled.div`
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
`;

const MessageContent = styled.div`
  color: #333;
  font-size: 0.95rem;
`;

const SecurityPanel = styled(Panel)`
  grid-column: 1 / -1;
`;

const SecurityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const SecurityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #e8f5e8;
  border-radius: 10px;
  color: #2e7d32;
`;

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState({
    users: [],
    messages: [],
    systemStats: {
      totalUsers: 0,
      totalMessages: 0,
      activeConnections: 0,
      serverUptime: 0
    }
  });
  const [realtimeStats, setRealtimeStats] = useState({
    messagesPerMinute: 0,
    peakConnections: 0
  });
  
  const { socket, connected, getAdminData } = useSocket();

  useEffect(() => {
    if (connected && socket) {
      // Get initial admin data
      getAdminData();
      
      // Set up real-time listeners
      socket.on('admin-data', (data) => {
        setAdminData(data);
      });

      socket.on('system-status', (status) => {
        setAdminData(prev => ({
          ...prev,
          systemStats: { ...prev.systemStats, ...status }
        }));
      });

      socket.on('message-logged', (messageInfo) => {
        setAdminData(prev => ({
          ...prev,
          messages: [messageInfo, ...prev.messages.slice(0, 49)] // Keep last 50
        }));
      });

      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        getAdminData();
      }, 30000);

      return () => {
        clearInterval(interval);
        socket.off('admin-data');
        socket.off('system-status');
        socket.off('message-logged');
      };
    }
  }, [connected, socket]);

  const handleRefresh = () => {
    getAdminData();
    toast.success('Dashboard refreshed');
  };

  const formatUptime = (seconds) => {
    const duration = moment.duration(seconds, 'seconds');
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const onlineUsers = adminData.users.filter(user => user.online);
  const recentMessages = adminData.messages.slice(0, 10);

  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>
          <FaServer />
          WALA Admin Dashboard
        </Title>
        <RefreshButton onClick={handleRefresh}>
          <FaSync />
          Refresh
        </RefreshButton>
      </DashboardHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon color="linear-gradient(135deg, #4CAF50 0%, #45a049 100%)">
            <FaUsers />
          </StatIcon>
          <StatInfo>
            <StatValue>{onlineUsers.length}</StatValue>
            <StatLabel>Online Users</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon color="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)">
            <FaComments />
          </StatIcon>
          <StatInfo>
            <StatValue>{adminData.systemStats.totalMessages}</StatValue>
            <StatLabel>Total Messages</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon color="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)">
            <FaServer />
          </StatIcon>
          <StatInfo>
            <StatValue>{adminData.systemStats.activeConnections}</StatValue>
            <StatLabel>Active Connections</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon color="linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)">
            <FaClock />
          </StatIcon>
          <StatInfo>
            <StatValue>{formatUptime(adminData.systemStats.serverUptime)}</StatValue>
            <StatLabel>Server Uptime</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <SecurityPanel>
        <PanelHeader>
          <FaShieldAlt />
          <PanelTitle>Security Status</PanelTitle>
        </PanelHeader>
        <SecurityGrid>
          <SecurityItem>
            <FaKey />
            <div>
              <div style={{ fontWeight: 'bold' }}>RSA Encryption</div>
              <div style={{ fontSize: '0.9rem' }}>2048-bit keys, auto-rotation</div>
            </div>
          </SecurityItem>
          <SecurityItem>
            <FaShieldAlt />
            <div>
              <div style={{ fontWeight: 'bold' }}>DES Encryption</div>
              <div style={{ fontSize: '0.9rem' }}>Session-based message encryption</div>
            </div>
          </SecurityItem>
          <SecurityItem>
            <FaEye />
            <div>
              <div style={{ fontWeight: 'bold' }}>Digital Signatures</div>
              <div style={{ fontSize: '0.9rem' }}>Message authenticity verified</div>
            </div>
          </SecurityItem>
          <SecurityItem>
            <FaServer />
            <div>
              <div style={{ fontWeight: 'bold' }}>Secure Storage</div>
              <div style={{ fontSize: '0.9rem' }}>All messages stored encrypted</div>
            </div>
          </SecurityItem>
        </SecurityGrid>
      </SecurityPanel>

      <ContentGrid>
        <Panel>
          <PanelHeader>
            <FaUsers />
            <PanelTitle>Connected Users ({onlineUsers.length})</PanelTitle>
          </PanelHeader>
          <UsersList>
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, index) => (
                <UserItem key={index} online={user.online}>
                  <UserInfo>
                    <OnlineStatus online={user.online} />
                    <span style={{ fontWeight: 'bold' }}>{user.username}</span>
                  </UserInfo>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    ID: {user.socketId?.substring(0, 8)}...
                  </span>
                </UserItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                No users currently online
              </div>
            )}
          </UsersList>
        </Panel>

        <Panel>
          <PanelHeader>
            <FaComments />
            <PanelTitle>Recent Messages</PanelTitle>
          </PanelHeader>
          <MessagesList>
            {recentMessages.length > 0 ? (
              recentMessages.map((message, index) => (
                <MessageItem key={index}>
                  <MessageHeader>
                    <span>
                      <strong>{message.sender}</strong> → {message.recipient}
                    </span>
                    <span>{moment(message.timestamp).format('HH:mm:ss')}</span>
                  </MessageHeader>
                  <MessageContent>
                    Message ID: {message.id}
                  </MessageContent>
                </MessageItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                No recent messages
              </div>
            )}
          </MessagesList>
        </Panel>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default AdminDashboard;