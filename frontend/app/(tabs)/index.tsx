import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { obtenerDepartamentos } from "../../services/api";
import { useFiltros } from "../context/FiltrosContext";
import BusquedaBar from "../components/BusquedaBar";
import ChipsFiltro from "../components/ChipsFiltro";
import ModalFiltros from "../components/ModalFiltros";

const { width } = Dimensions.get("window");

// ── Tipos ─────────────────────────────────────────────────────────
interface Departamento {
  id: string;
  titulo: string;
  precio: number;
  colonia: string;
  metro_cercano: string;
  imagen: string;
  tipo_renta: "solo_mujeres" | "solo_hombres" | "mixto";
  amueblado: boolean;
  pet_friendly: boolean;
  internet: boolean;
  estacionamiento: boolean;
  cocina: boolean;
}

// ── Mapa simulado ─────────────────────────────────────────────────
const MapaSimulado = ({ depas }: { depas: Departamento[] }) => (
  <View style={styles.mapaContainer}>
    <Text style={styles.seccionTitulo}>📍 Mapa de departamentos</Text>
    <View style={styles.mapaFondo}>
      {depas.map((d, i) => (
        <TouchableOpacity
          key={d.id}
          style={[
            styles.mapaPin,
            {
              top: 30 + (i % 3) * 55,
              left: 20 + (i * 70) % (width - 120),
            },
          ]}
        >
          <Text style={styles.mapaPinTexto}>
            ${(d.precio / 1000).toFixed(1)}k
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.mapaNotaTexto}>
        * Mapa ilustrativo — se conectará a Google Maps
      </Text>
    </View>
  </View>
);

// ── Tarjeta de departamento ───────────────────────────────────────
const TarjetaDepa = ({ item }: { item: Departamento }) => (
  <TouchableOpacity
    style={styles.tarjeta}
    activeOpacity={0.85}
    onPress={() => router.push(`/departamento/${item.id}`)}
  >
    <Image source={{ uri: item.imagen }} style={styles.tarjetaImagen} />
    <View style={styles.tarjetaBadgeContainer}>
      {item.tipo_renta === "solo_mujeres" && (
        <View style={[styles.badge, { backgroundColor: "#ff6b9d" }]}>
          <Text style={styles.badgeTexto}>Solo mujeres</Text>
        </View>
      )}
      {item.pet_friendly && (
        <View style={[styles.badge, { backgroundColor: "#4caf50" }]}>
          <Text style={styles.badgeTexto}>Pet friendly</Text>
        </View>
      )}
    </View>
    <View style={styles.tarjetaInfo}>
      <Text style={styles.tarjetaTitulo} numberOfLines={1}>
        {item.titulo}
      </Text>
      <Text style={styles.tarjetaColonia} numberOfLines={1}>
        📍 {item.colonia}
      </Text>
      <Text style={styles.tarjetaMetro}>🚇 {item.metro_cercano}</Text>
      <View style={styles.tarjetaFooter}>
        <Text style={styles.tarjetaPrecio}>
          ${item.precio.toLocaleString()}/mes
        </Text>
        <View style={styles.tarjetaIconos}>
          {item.amueblado       && <Text style={styles.iconoSmall}>🛋</Text>}
          {item.internet        && <Text style={styles.iconoSmall}>📶</Text>}
          {item.estacionamiento && <Text style={styles.iconoSmall}>🚗</Text>}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function HomeScreen() {
  const [depas, setDepas] = useState<Departamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const carouselRef = useRef<FlatList>(null);

  const { busqueda, chipActivo } = useFiltros();

  useEffect(() => {
    obtenerDepartamentos()
      .then(setDepas)
      .finally(() => setCargando(false));
  }, []);

  // Navega a search cuando el usuario escribe o activa un chip
  useEffect(() => {
    if (busqueda.trim().length > 0 || chipActivo !== null) {
      router.push("/search" as any);
    }
  }, [busqueda, chipActivo]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola, estudiante 👋</Text>
            <Text style={styles.subtitulo}>Encuentra tu depa en CDMX</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push("/usuarios/perfil")}>
            <Text style={styles.avatarTexto}>RF</Text>
          </TouchableOpacity>
        </View>

        {/* Búsqueda + filtros */}
        <BusquedaBar onPressFiltros={() => setModalVisible(true)} />

        {/* Chips */}
        <ChipsFiltro />

        {/* Carrusel destacados */}
        <Text style={styles.seccionTitulo}>✨ Destacados</Text>
        {cargando ? (
          <View style={styles.cargandoBox}>
            <Text style={styles.cargandoTexto}>Cargando departamentos...</Text>
          </View>
        ) : (
          <FlatList
            ref={carouselRef}
            data={depas}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.carouselCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/departamento/${item.id}`)}
              >
                <Image
                  source={{ uri: item.imagen }}
                  style={styles.carouselImagen}
                />
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselTitulo}>{item.titulo}</Text>
                  <Text style={styles.carouselPrecio}>
                    ${item.precio.toLocaleString()}/mes
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            snapToInterval={width - 56}
            decelerationRate="fast"
          />
        )}

        {/* Mapa simulado */}
        <MapaSimulado depas={depas} />

        {/* Ver todos */}
        <TouchableOpacity
          style={styles.verTodosBtn}
          onPress={() => router.push("/search" as any)}
        >
          <Text style={styles.verTodosTexto}>Ver todos los departamentos →</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <ModalFiltros
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  saludo: { fontSize: 13, color: "#888", fontWeight: "500" },
  subtitulo: { fontSize: 20, fontWeight: "800", color: "#1a1a1a", marginTop: 2 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e63946",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTexto: { color: "#fff", fontWeight: "800", fontSize: 14 },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a1a",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  cargandoBox: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
  },
  cargandoTexto: { color: "#aaa", fontSize: 14 },

  carouselCard: {
    width: width - 56,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  carouselImagen: { width: "100%", height: 180 },
  carouselOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 14,
  },
  carouselTitulo: { color: "#fff", fontWeight: "700", fontSize: 15 },
  carouselPrecio: { color: "#ffd166", fontWeight: "800", fontSize: 14, marginTop: 2 },

  mapaContainer: { marginHorizontal: 20, marginTop: 8 },
  mapaFondo: {
    height: 180,
    backgroundColor: "#d4e8c2",
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#b5d49a",
  },
  mapaPin: {
    position: "absolute",
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 4,
  },
  mapaPinTexto: { color: "#fff", fontWeight: "800", fontSize: 12 },
  mapaNotaTexto: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontSize: 10,
    color: "#666",
  },

  verTodosBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e63946",
  },
  verTodosTexto: {
    color: "#e63946",
    fontWeight: "700",
    fontSize: 15,
  },

  tarjeta: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  tarjetaImagen: { width: "100%", height: 160 },
  tarjetaBadgeContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 6,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "700" },
  tarjetaInfo: { padding: 14 },
  tarjetaTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  tarjetaColonia: { fontSize: 13, color: "#777", marginTop: 4 },
  tarjetaMetro: { fontSize: 12, color: "#555", marginTop: 4 },
  tarjetaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  tarjetaPrecio: { fontSize: 17, fontWeight: "900", color: "#e63946" },
  tarjetaIconos: { flexDirection: "row", gap: 4 },
  iconoSmall: { fontSize: 16 },
});