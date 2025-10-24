import { ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Divider,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { useAuth } from '../../src/contexts/AuthContext';

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  const getRolColor = (rol: string) => {
    const colors: Record<string, string> = {
      ADMIN: '#DC2626',
      CEA: '#3B82F6',
      MCA: '#10B981',
      COLABORADOR: '#F59E0B',
      VISITANTE: '#6B7280',
    };
    return colors[rol] || '#6B7280';
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      CEA: 'CEA',
      MCA: 'MCA',
      COLABORADOR: 'Colaborador',
      VISITANTE: 'Visitante',
    };
    return labels[rol] || rol;
  };

  return (
    <ScrollView style={styles.container}>
      <Box padding="$4">
        <VStack space="lg">
          {/* Avatar y nombre */}
          <VStack space="md" alignItems="center" paddingVertical="$6">
            <Box
              width={100}
              height={100}
              borderRadius="$full"
              backgroundColor="$blue500"
              alignItems="center"
              justifyContent="center"
            >
              <Text size="4xl" color="$white">
                {user.nombre.charAt(0).toUpperCase()}
              </Text>
            </Box>
            <VStack space="xs" alignItems="center">
              <Text size="2xl" fontWeight="$bold">
                {user.nombre} {user.apellidos || ''}
              </Text>
              <Badge
                size="md"
                variant="solid"
                backgroundColor={getRolColor(user.rol)}
                borderRadius="$full"
              >
                <BadgeText color="$white">{getRolLabel(user.rol)}</BadgeText>
              </Badge>
            </VStack>
          </VStack>

          <Divider />

          {/* Información del usuario */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              Información
            </Text>

            <InfoItem label="Email" value={user.email} icon="📧" />

            {user.comunidad && (
              <InfoItem
                label="Comunidad"
                value={user.comunidad.nombre}
                icon="⛪"
              />
            )}

            {user.comunidad?.descripcion && (
              <InfoItem
                label="Descripción"
                value={user.comunidad.descripcion}
                icon="📝"
              />
            )}
          </VStack>

          <Divider />

          {/* Botón de logout */}
          <Button
            onPress={handleLogout}
            variant="solid"
            backgroundColor="$red600"
            size="lg"
            marginTop="$4"
          >
            <ButtonText>Cerrar Sesión</ButtonText>
          </Button>
        </VStack>
      </Box>
    </ScrollView>
  );
}

// Componente para mostrar información
function InfoItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Box
      backgroundColor="$gray100"
      borderRadius="$lg"
      padding="$4"
    >
      <HStack space="sm" alignItems="center">
        <Text size="xl">{icon}</Text>
        <VStack flex={1}>
          <Text size="sm" color="$gray600" fontWeight="$medium">
            {label}
          </Text>
          <Text size="md" fontWeight="$semibold">
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
