import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function VisitasScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Visitas</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Lista de visitas pendiente
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#666',
  },
});
