import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ChatApp from './components/ChatApp';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import GlobalStyles from './styles/GlobalStyles';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const NavButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-left: 1rem;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(255, 255, 255, 0.4);
  }
`;

const AppContent = () => {
  const { isAuthenticated, userType, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login');

  // Update view based on authentication state
  useEffect(() => {
    if (isAuthenticated && userType) {
      if (userType === 'client') {
        setCurrentView('chat');
      } else if (userType === 'admin') {
        setCurrentView('admin');
      }
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated, userType]);



  const handleLogout = () => {
    logout();
    setCurrentView('login');
  };

  return (
    <AppContainer>
      <GlobalStyles />
      <Header>
        <Logo>WALA - Secure Chat Application</Logo>
        <div>
          {isAuthenticated && (
            <>
              {userType === 'client' && (
                <NavButton 
                  className={currentView === 'chat' ? 'active' : ''}
                  onClick={() => setCurrentView('chat')}
                >
                  Chat
                </NavButton>
              )}
              {userType === 'admin' && (
                <NavButton 
                  className={currentView === 'admin' ? 'active' : ''}
                  onClick={() => setCurrentView('admin')}
                >
                  Dashboard
                </NavButton>
              )}
              <NavButton onClick={handleLogout}>
                Logout
              </NavButton>
            </>
          )}
        </div>
      </Header>
      
      <main>
        {!isAuthenticated && (
          <Login />
        )}
        {isAuthenticated && currentView === 'chat' && userType === 'client' && (
          <ChatApp />
        )}
        {isAuthenticated && currentView === 'admin' && userType === 'admin' && (
          <AdminDashboard />
        )}
      </main>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AppContainer>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;