'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/lib/types';
import {api} from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshProfile = async () => {
    try {
      const userData = await api.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('获取用户资料失败:', error);
      api.clearToken();
      setUser(null);
    }
  };

  const login = async (data: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.login(data);
      // 登录成功
      if (response.data && response.data.user) {
        setUser(response.data.user);
        toast.success('登录成功');
        return true;
      } else {
        toast.error('登录失败：用户信息无效');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || '登录失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.register(data);
      // 注册成功
      toast.success('注册成功，请登录');
      return true;
    } catch (error: any) {
      toast.error(error.message || '注册失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      setUser(null);
      toast.success('已登出');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          api.setToken(token);
          await refreshProfile();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // If profile fetch fails, clear token as it might be expired
        localStorage.removeItem('token');
        api.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
  }), [user, isLoading, isAuthenticated]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
 
 
 