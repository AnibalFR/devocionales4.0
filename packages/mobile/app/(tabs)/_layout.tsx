import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="visitas"
        options={{
          title: 'Visitas',
          headerShown: true
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerShown: true
        }}
      />
    </Tabs>
  );
}
