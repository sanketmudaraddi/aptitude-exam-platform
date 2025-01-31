import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'student';
  college?: string;
  last_login?: Date;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setError: (error: string | null) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  college?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate it
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          college: userData.college,
          last_login: userData.last_login,
          is_verified: userData.is_verified
        });
      } catch (err) {
        console.error('Error parsing token:', err);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          role: response.data.user.role,
          college: response.data.user.college,
          last_login: response.data.user.last_login,
          is_verified: response.data.user.is_verified
        });
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setError(null);
      console.log('Sending registration request:', userData);
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          role: response.data.user.role,
          college: response.data.user.college,
          last_login: response.data.user.last_login,
          is_verified: response.data.user.is_verified
        });
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        error,
        loading,
        login,
        register,
        logout,
        clearError,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 