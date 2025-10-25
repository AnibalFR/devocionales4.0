import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface DashboardHeaderProps {
  nombre: string;
  apellidos?: string;
}

export default function DashboardHeader({ nombre, apellidos }: DashboardHeaderProps) {
  const nombreCompleto = apellidos ? `${nombre} ${apellidos}` : nombre;
  const saludo = getSaludo();

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <MaterialIcons name="account-circle" size={56} color="#6200EE" />
      </View>
      <View style={styles.textContainer}>
        <Text variant="bodyMedium" style={styles.greeting}>
          {saludo}
        </Text>
        <Text variant="headlineSmall" style={styles.name}>
          {nombreCompleto}
        </Text>
      </View>
    </View>
  );
}

function getSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return '¡Buenos días!';
  if (hora < 19) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    padding: 16,
    paddingTop: 48,
    gap: 12,
  },
  avatarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 0,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    color: '#E1BEE7',
  },
  name: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
