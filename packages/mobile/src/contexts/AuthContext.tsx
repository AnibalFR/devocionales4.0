import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMutation } from '@apollo/client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '../graphql/apollo';
import { LOGIN_MUTATION } from '../graphql/mutations';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loginMutation] = useMutation(LOGIN_MUTATION);

  useEffect(() => {
    // Cargar usuario y token al montar
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUserJson = await AsyncStorage.getItem('user');

      if (storedToken && storedUserJson) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserJson));
      }
    } catch (error) {
      console.error('Error al cargar autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const { data } = await loginMutation({
        variables: {
          input: { email, password },
        },
      });

      const { token: newToken, user: newUser } = data.login;

      // Guardar en SecureStore y AsyncStorage
      await SecureStore.setItemAsync('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return newUser;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Limpiar storage
      await SecureStore.deleteItemAsync('token');
      await AsyncStorage.removeItem('user');

      // Limpiar cache de Apollo
      await apolloClient.clearStore();

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
