import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  FormControl,
  FormControlError,
  FormControlErrorText,
} from '@gluestack-ui/themed';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // Validaciones básicas
    if (!email || !password) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // La navegación se maneja automáticamente por el RootLayoutNav
    } catch (err: any) {
      console.error('Error de login:', err);
      setError(err.message || 'Credenciales inválidas');
      Alert.alert('Error de autenticación', err.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Box style={styles.content}>
          <VStack space="xl" width="100%">
            {/* Header */}
            <VStack space="sm" alignItems="center">
              <Heading size="2xl">Devocionales 4.0</Heading>
              <Text size="sm" color="$gray600">
                Inicia sesión para continuar
              </Text>
            </VStack>

            {/* Form */}
            <VStack space="md">
              <FormControl isInvalid={!!error}>
                <VStack space="sm">
                  <Text fontWeight="$medium">Email</Text>
                  <Input>
                    <InputField
                      placeholder="tu@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </Input>
                </VStack>
              </FormControl>

              <FormControl isInvalid={!!error}>
                <VStack space="sm">
                  <Text fontWeight="$medium">Contraseña</Text>
                  <Input>
                    <InputField
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </Input>
                </VStack>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <Button
                onPress={handleLogin}
                isDisabled={isLoading}
                size="lg"
                marginTop="$4"
              >
                <ButtonText>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
});
