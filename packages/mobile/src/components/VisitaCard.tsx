import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Visita } from '../types';

interface VisitaCardProps {
  visita: Visita;
  onPress: () => void;
}

export function VisitaCard({ visita, onPress }: VisitaCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View>
        <Text style={styles.title}>{visita.familia.nombre}</Text>
        <Text style={styles.subtitle}>Card placeholder</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
