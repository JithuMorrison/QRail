// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const mockUsers = {
      'vendor@example.com': { 
        id: '1', 
        name: 'Vendor User', 
        role: 'vendor', 
        email: 'vendor@example.com' 
      },
      'depot@example.com': { 
        id: '2', 
        name: 'Depot Staff', 
        role: 'depot_staff', 
        email: 'depot@example.com' 
      },
      'engineer@example.com': { 
        id: '3', 
        name: 'Track Engineer', 
        role: 'engineer', 
        email: 'engineer@example.com' 
      },
      'admin@example.com': { 
        id: '4', 
        name: 'Admin User', 
        role: 'admin', 
        email: 'admin@example.com' 
      },
    };

    if (mockUsers[email] && password === 'password') {
      const userData = mockUsers[email];
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};