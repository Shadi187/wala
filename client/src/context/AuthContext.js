import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 'client' or 'admin'
  const [loading, setLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('wala_user');
    const savedUserType = localStorage.getItem('wala_user_type');
    
    if (savedUser && savedUserType) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData, type) => {
    setLoading(true);
    
    try {
      setUser(userData);
      setUserType(type);
      setIsAuthenticated(true);
      
      // Save to localStorage for persistence
      localStorage.setItem('wala_user', JSON.stringify(userData));
      localStorage.setItem('wala_user_type', type);
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('wala_user');
    localStorage.removeItem('wala_user_type');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('wala_user', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    userType,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};