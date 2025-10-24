import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Perfil</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text variant="bodyLarge">Nombre: {user.nombre}</Text>
          <Text variant="bodyMedium">Email: {user.email}</Text>
          <Text variant="bodyMedium">Rol: {user.rol}</Text>
        </View>
      )}
      <Button mode="contained" onPress={logout} style={styles.button}>
        Cerrar Sesión
      </Button>
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
  userInfo: {
    marginVertical: 20,
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
  },
});
