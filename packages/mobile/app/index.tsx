import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Center, Spinner } from '@gluestack-ui/themed';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center flex={1}>
        <Spinner size="large" />
      </Center>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/visitas" />;
  }

  return <Redirect href="/(auth)/login" />;
}
