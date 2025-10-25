import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Chip } from 'react-native-paper';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { VISITAS_QUERY } from '../../src/graphql/visitas';
import { ME_DETAILED_QUERY } from '../../src/graphql/auth';
import VisitaCard from '../../src/components/VisitaCard';
import type { Visita } from '../../src/types/visita';
import { colors } from '../../src/constants/colors';

type FilterType = 'all' | 'mine' | 'nucleo' | 'completed' | 'scheduled';

export default function VisitasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const { data, loading, error, refetch } = useQuery(VISITAS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: userData } = useQuery(ME_DETAILED_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  // Get user's miembro data to find their núcleo
  const miembro = useMemo(() => {
    if (!userData?.miembros || !user?.id) return null;
    return userData.miembros.find((m: any) => m.usuarioId === user.id);
  }, [userData, user]);

  const handleVisitaPress = (visitaId: string) => {
    router.push(`/visita-detalle?id=${visitaId}`);
  };

  // Filter visitas based on active filter
  const filteredVisitas = useMemo(() => {
    const allVisitas: Visita[] = data?.visitas || [];

    switch (activeFilter) {
      case 'mine':
        // Show only visitas where user is a visitor
        return allVisitas.filter((v) =>
          v.visitorUserIds?.includes(user?.id || '')
        );
      case 'nucleo':
        // Show only visitas from user's núcleo
        return allVisitas.filter((v) =>
          v.nucleo?.id === miembro?.nucleoId
        );
      case 'completed':
        // Show only completed visitas
        return allVisitas.filter((v) => v.visitStatus === 'realizada');
      case 'scheduled':
        // Show only scheduled visitas
        return allVisitas.filter((v) => v.visitStatus === 'programada');
      default:
        return allVisitas;
    }
  }, [data, activeFilter, user, miembro]);

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando visitas...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Error al cargar visitas
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (filteredVisitas.length === 0 && activeFilter === 'all' && !loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#999" />
        <Text variant="headlineMedium" style={styles.emptyTitle}>
          No hay visitas
        </Text>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Aún no se han registrado visitas
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialCommunityIcons name="calendar-check" size={32} color={colors.primary} />
          <View style={styles.headerText}>
            <Text variant="headlineMedium" style={styles.title}>
              Visitas
            </Text>
            <Text variant="bodyMedium" style={styles.count}>
              {filteredVisitas.length} {filteredVisitas.length === 1 ? 'visita' : 'visitas'}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          <Chip
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            style={styles.filterChip}
            icon={() => <MaterialIcons name="view-list" size={18} color={activeFilter === 'all' ? colors.primary : '#666'} />}
          >
            Todas
          </Chip>
          <Chip
            selected={activeFilter === 'mine'}
            onPress={() => setActiveFilter('mine')}
            style={styles.filterChip}
            icon={() => <MaterialIcons name="person" size={18} color={activeFilter === 'mine' ? colors.primary : '#666'} />}
          >
            Mis Visitas
          </Chip>
          {miembro?.nucleoId && (
            <Chip
              selected={activeFilter === 'nucleo'}
              onPress={() => setActiveFilter('nucleo')}
              style={styles.filterChip}
              icon={() => <MaterialIcons name="location-on" size={18} color={activeFilter === 'nucleo' ? colors.primary : '#666'} />}
            >
              Mi Núcleo
            </Chip>
          )}
          <Chip
            selected={activeFilter === 'completed'}
            onPress={() => setActiveFilter('completed')}
            style={styles.filterChip}
            icon={() => <MaterialIcons name="check-circle" size={18} color={activeFilter === 'completed' ? colors.primary : '#666'} />}
          >
            Completadas
          </Chip>
          <Chip
            selected={activeFilter === 'scheduled'}
            onPress={() => setActiveFilter('scheduled')}
            style={styles.filterChip}
            icon={() => <MaterialIcons name="schedule" size={18} color={activeFilter === 'scheduled' ? colors.primary : '#666'} />}
          >
            Programadas
          </Chip>
        </ScrollView>
      </View>

      {filteredVisitas.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="filter-remove-outline" size={64} color="#999" />
          <Text variant="headlineMedium" style={styles.emptyTitle}>
            No hay resultados
          </Text>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No hay visitas que coincidan con el filtro seleccionado
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVisitas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VisitaCard visita={item} onPress={() => handleVisitaPress(item.id)} />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: '#212121',
  },
  count: {
    color: '#666',
    marginTop: 2,
  },
  filtersScroll: {
    marginBottom: 4,
  },
  filtersContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    height: 36,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#666',
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
});
