import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'student';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

interface ApiError {
  message: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    token: localStorage.getItem('token'),
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await axios.get<{ user: User }>('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuthState({
        user: response.data.user,
        isAuthenticated: true,
        token,
      });
    } catch (error) {
      logout();
    }
  };

  const login = async (email: string, password: string, role: 'admin' | 'student') => {
    try {
      const response = await axios.post<{ token: string; user: User }>(`/api/auth/${role}/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setAuthState({
        user,
        isAuthenticated: true,
        token,
      });

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      return {
        success: false,
        error: axiosError.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      token: null,
    });
  }, []);

  const register = async (
    username: string,
    email: string,
    password: string,
    registrationCode?: string
  ) => {
    try {
      await axios.post('/api/auth/student/register', {
        username,
        email,
        password,
        registrationCode,
      });

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      return {
        success: false,
        error: axiosError.response?.data?.message || 'Registration failed',
      };
    }
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    register,
  };
}; 