import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ApolloProvider } from '@apollo/client/react';
import apolloClient from '../src/config/apollo';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <PaperProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </ApolloProvider>
  );
}
