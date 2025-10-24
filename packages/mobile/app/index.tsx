import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/visitas" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
