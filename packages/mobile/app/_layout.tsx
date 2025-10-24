import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ApolloProvider } from '@apollo/client/react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { apolloClient } from '../src/graphql/apollo';

// Componente interno que maneja la navegación basada en autenticación
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Usuario no autenticado, redirigir a login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Usuario autenticado, redirigir a tabs
      router.replace('/(tabs)/visitas');
    }
  }, [user, segments, isLoading]);

  return <Slot />;
}

// Layout root con todos los providers
export default function RootLayout() {
  return (
    <PaperProvider>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootLayoutNav />
        </AuthProvider>
      </ApolloProvider>
    </PaperProvider>
  );
}
