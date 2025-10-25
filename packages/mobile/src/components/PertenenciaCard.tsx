import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { getRolLabel } from '../utils/formatters';
import { colors } from '../constants/colors';

interface PertenenciaCardProps {
  nucleoNombre?: string;
  barrioNombre?: string;
  rol: string;
}

export default function PertenenciaCard({ nucleoNombre, barrioNombre, rol }: PertenenciaCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Mi Información
        </Text>

        {nucleoNombre && (
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={colors.primary} />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.label}>
                Núcleo
              </Text>
              <Text variant="bodyLarge" style={styles.value}>
                {nucleoNombre}
              </Text>
            </View>
          </View>
        )}

        {barrioNombre && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="home-group" size={20} color="#03DAC6" />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.label}>
                Barrio
              </Text>
              <Text variant="bodyLarge" style={styles.value}>
                {barrioNombre}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <FontAwesome5 name="user-tag" size={18} color="#FF9800" />
          <View style={styles.infoText}>
            <Text variant="bodySmall" style={styles.label}>
              Rol
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {getRolLabel(rol)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212121',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  label: {
    color: '#999',
    marginBottom: 2,
  },
  value: {
    color: '#212121',
    fontWeight: '500',
  },
});
