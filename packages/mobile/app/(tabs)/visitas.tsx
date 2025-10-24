import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { useRouter } from 'expo-router';
import { VISITAS_QUERY } from '../../src/graphql/visitas';
import VisitaCard from '../../src/components/VisitaCard';
import type { Visita } from '../../src/types/visita';

export default function VisitasScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery(VISITAS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const handleVisitaPress = (visitaId: string) => {
    router.push(`/visita-detalle?id=${visitaId}`);
  };

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

  const visitas: Visita[] = data?.visitas || [];

  if (visitas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineMedium">📋 No hay visitas</Text>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Aún no se han registrado visitas
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Visitas
        </Text>
        <Text variant="bodyMedium" style={styles.count}>
          {visitas.length} {visitas.length === 1 ? 'visita' : 'visitas'}
        </Text>
      </View>
      <FlatList
        data={visitas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VisitaCard visita={item} onPress={() => handleVisitaPress(item.id)} />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContent}
      />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  count: {
    color: '#666',
    marginTop: 4,
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
  emptyText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
});
