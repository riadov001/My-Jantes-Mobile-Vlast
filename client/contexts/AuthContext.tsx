import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User } from '@/types';
import { getApiUrl } from '@/lib/query-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@myjantes_auth';
const TOKEN_STORAGE_KEY = '@myjantes_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStoredToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const storeToken = async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  };

  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  };

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const baseUrl = getApiUrl();
      const token = await getStoredToken();
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}api/auth/user`, {
        credentials: 'include',
        headers,
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const userData = await response.json();
          if (userData && userData.id) {
            return userData;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const userData = await fetchUser();
    setUser(userData);
    if (userData) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [fetchUser]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        } else {
          setUser(null);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          await clearToken();
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [fetchUser]);

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        setUser(data);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        if (data.token) {
          await storeToken(data.token);
        }
        return { success: true };
      }
      return { success: false, error: data.message || 'Erreur de connexion' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        setUser(data);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        if (data.token) {
          await storeToken(data.token);
        }
        return { success: true };
      }
      return { success: false, error: data.message || "Erreur lors de l'inscription" };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: "Erreur lors de l'inscription" };
    }
  };

  const loginWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS === 'web') {
        return { success: false, error: 'Apple Sign-In non disponible sur web' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/oauth`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'apple',
          providerId: credential.user,
          email: credential.email || `${credential.user}@privaterelay.appleid.com`,
          name: credential.fullName?.givenName 
            ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
            : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        setUser(data);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        if (data.token) {
          await storeToken(data.token);
        }
        return { success: true };
      }
      return { success: false, error: data.message || 'Erreur Apple Sign-In' };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Connexion annulée' };
      }
      console.error('Apple login error:', error);
      return { success: false, error: 'Erreur Apple Sign-In' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Google Sign-In nécessite une configuration supplémentaire' };
  };

  const loginWithFacebook = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Facebook Sign-In nécessite une configuration supplémentaire' };
  };

  const logout = async () => {
    try {
      const baseUrl = getApiUrl();
      await fetch(`${baseUrl}api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await clearToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithEmail,
        register,
        loginWithApple,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        refreshUser,
      }}
    >
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
