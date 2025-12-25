import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { login: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        clearStoredAuth();
      }
    }
    
    setLoading(false);
  }, []);

  const clearStoredAuth = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const saveAuth = (userData: User, authToken: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
  };

  const login = async (loginData: { login: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();

      if (result.success && result.user && result.token) {
        saveAuth(result.user, result.token);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearStoredAuth();
    fetch('/api/auth/logout').catch(console.error)
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}