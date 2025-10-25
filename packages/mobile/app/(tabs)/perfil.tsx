import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '../../src/contexts/AuthContext';
import { ME_DETAILED_QUERY } from '../../src/graphql/auth';
import { getRolLabel } from '../../src/utils/formatters';
import { colors } from '../../src/constants/colors';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: userData } = useQuery(ME_DETAILED_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const miembro = useMemo(() => {
    if (!userData?.miembros || !user?.id) return null;
    return userData.miembros.find((m: any) => m.usuarioId === user.id);
  }, [userData, user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const nombreCompleto = userData?.me?.apellidos
    ? `${userData.me.nombre} ${userData.me.apellidos}`
    : userData?.me?.nombre || user?.nombre || '';

  return (
    <ScrollView style={styles.container}>
      {/* Header Profile Card */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color="#FFF" />
        </View>
        <Text variant="headlineMedium" style={styles.headerName}>
          {nombreCompleto}
        </Text>
        <View style={styles.rolBadge}>
          <FontAwesome5 name="user-tag" size={14} color="#FFF" />
          <Text variant="bodyMedium" style={styles.rolText}>
            {getRolLabel(userData?.me?.rol || user?.rol || '')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Información Personal */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={24} color={colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Información Personal
              </Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Correo Electrónico
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {userData?.me?.email || user?.email || 'No disponible'}
                </Text>
              </View>
            </View>

            {userData?.me?.comunidad && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="church" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Comunidad
                  </Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>
                    {userData.me.comunidad.nombre}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Información de Pertenencia */}
        {miembro && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialIcons name="location-on" size={24} color="#03DAC6" />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Mi Pertenencia
                </Text>
              </View>
              <Divider style={styles.divider} />

              {miembro.nucleo && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker-circle" size={20} color="#666" />
                  <View style={styles.infoText}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      Núcleo
                    </Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {miembro.nucleo.nombre}
                    </Text>
                  </View>
                </View>
              )}

              {miembro.nucleo?.barrio && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="home-group" size={20} color="#666" />
                  <View style={styles.infoText}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      Barrio
                    </Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {miembro.nucleo.barrio.nombre}
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Información de la App */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialIcons name="info-outline" size={24} color="#FF9800" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Acerca de
              </Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="application" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Aplicación
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  Devocionales 4.0
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="code" size={20} color="#666" />
              <View style={styles.infoText}>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Versión
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  1.0.0
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon={() => <MaterialIcons name="logout" size={20} color="#FFF" />}
          buttonColor="#F44336"
        >
          Cerrar Sesión
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 8,
    marginBottom: 16,
  },
  headerName: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rolText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    color: '#212121',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
