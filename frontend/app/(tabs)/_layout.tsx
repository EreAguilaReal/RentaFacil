import { Tabs } from "expo-router";
import { FiltrosProvider } from "../context/FiltrosContext";
import { Text } from "react-native";

export default function RootLayout() {
  return (
    <FiltrosProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#f0ece8",
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: "#e63946",
          tabBarInactiveTintColor: "#aaa",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>🏠</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="favoritos"
          options={{
            title: "Favoritos",
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>❤️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="mensajes"
          options={{
            title: "Mensajes",
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>💬</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>👤</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            href: null,  // ← oculta del tab bar, solo se accede por navegación
          }}
        />
      </Tabs>
    </FiltrosProvider>
  );
}