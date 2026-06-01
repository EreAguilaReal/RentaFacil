import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { obtenerDepartamentos, Departamento } from "../../services/api";
import { useFiltros } from "../context/FiltrosContext";
import BusquedaBar from "../components/BusquedaBar";
import ChipsFiltro from "../components/ChipsFiltro";
import ModalFiltros from "../components/ModalFiltros";

const CHIPS_TIPO_RENTA = ["solo_mujeres", "solo_hombres", "mixto"];
// ── Tarjeta de departamento ───────────────────────────────────────
const TarjetaDepa = ({ item }: { item: Departamento }) => {

  const badges = [];

  if (item.tipo_renta === "solo_mujeres") {
    badges.push({
      texto: "Solo mujeres",
      color: "#ff6b9d",
    });
  }

  if (item.tipo_renta === "solo_hombres") {
    badges.push({
      texto: "Solo hombres",
      color: "#4a90e2",
    });
  }

  if (item.pet_friendly) {
    badges.push({
      texto: "Pet friendly",
      color: "#4caf50",
    });
  }

  if (item.amueblado) {
    badges.push({
      texto: "Amueblado",
      color: "#ff9800",
    });
  }

  if (item.internet) {
    badges.push({
      texto: "Internet",
      color: "#7b61ff",
    });
  }

  if (item.estacionamiento) {
    badges.push({
      texto: "Parking",
      color: "#607d8b",
    });
  }

  const visibles = badges.slice(0, 2);
  const extras = Math.max(0, badges.length - 2);

  return (
    <TouchableOpacity
      style={styles.tarjeta}
      activeOpacity={0.85}
      onPress={() => router.push(`/departamento/${item.id}`)}
    >
      <Image
        source={{ uri: item.imagen }}
        style={styles.tarjetaImagen}
      />

      <View style={styles.tarjetaBadgeContainer}>
        {visibles.map((b, i) => (
          <View
            key={i}
            style={[
              styles.badge,
              { backgroundColor: b.color },
            ]}
          >
            <Text style={styles.badgeTexto}>
              {b.texto}
            </Text>
          </View>
        ))}

        {extras > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: "#444" },
            ]}
          >
            <Text style={styles.badgeTexto}>
              +{extras}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tarjetaInfo}>
        <Text
          style={styles.tarjetaTitulo}
          numberOfLines={1}
        >
          {item.titulo}
        </Text>

        <Text
          style={styles.tarjetaColonia}
          numberOfLines={1}
        >
          📍 {item.colonia}
        </Text>

        <Text style={styles.tarjetaMetro}>
          🚇 {item.metro_cercano}
        </Text>

        <View style={styles.tarjetaFooter}>
          <Text style={styles.tarjetaPrecio}>
            ${item.precio.toLocaleString()}/mes
          </Text>

          <View style={styles.tarjetaIconos}>
            {item.amueblado && (
              <Text style={styles.iconoSmall}>🛋</Text>
            )}

            {item.internet && (
              <Text style={styles.iconoSmall}>📶</Text>
            )}

            {item.estacionamiento && (
              <Text style={styles.iconoSmall}>🚗</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Pantalla de resultados ────────────────────────────────────────
export default function SearchScreen() {
  const [depas, setDepas] = useState<Departamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const { busqueda, chipActivo, filtros, rangoMax, filtrosActivos } = useFiltros();

  useEffect(() => {
    obtenerDepartamentos()
      .then(setDepas)
      .finally(() => setCargando(false));
  }, []);

  const depasFiltrados = depas.filter((d) => {
    const matchBusqueda =
      busqueda === "" ||
      d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.colonia.toLowerCase().includes(busqueda.toLowerCase());

    const matchChip = chipActivo
    ? CHIPS_TIPO_RENTA.includes(chipActivo)
      ? d.tipo_renta === chipActivo                        // ← compara string
      : (d as Record<string, any>)[chipActivo] === true   // ← compara booleano
    : true;

    const matchPrecio = d.precio <= rangoMax;

    const matchFiltros = Object.entries(filtros).every(
      ([k, v]) => !v || (d as Record<string, any>)[k] === true
    );

    return matchBusqueda && matchChip && matchPrecio && matchFiltros;
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* Header con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.volverIcono}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Resultados</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Búsqueda + filtros */}
      <BusquedaBar onPressFiltros={() => setModalVisible(true)} />

      {/* Chips */}
      <ChipsFiltro />

      {/* Conteo */}
      <View style={styles.conteoRow}>
        <Text style={styles.conteoTexto}>
          {cargando
            ? "Buscando..."
            : `${depasFiltrados.length} resultado${depasFiltrados.length !== 1 ? "s" : ""}`}
        </Text>
        {filtrosActivos > 0 && (
          <Text style={styles.filtrosActivosTexto}>
            {filtrosActivos} filtro{filtrosActivos !== 1 ? "s" : ""} activo{filtrosActivos !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Lista */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {cargando ? (
          <View style={styles.cargandoBox}>
            <ActivityIndicator size="large" color="#e63946" />
            <Text style={styles.cargandoTexto}>Buscando departamentos...</Text>
          </View>
        ) : depasFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>😕</Text>
            <Text style={styles.vacioTitulo}>Sin resultados</Text>
            <Text style={styles.vacioSubtitulo}>
              Intenta con otra búsqueda o ajusta los filtros
            </Text>
          </View>
        ) : (
          depasFiltrados.map((item) => (
            <TarjetaDepa key={item.id} item={item} />
          ))
        )}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  volverBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  volverIcono: { fontSize: 20, color: "#1a1a1a" },
  headerTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },

  // Conteo
  conteoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
  },
  conteoTexto: { marginTop:10, fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  filtrosActivosTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e63946",
  },

  // Cargando
  cargandoBox: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  cargandoTexto: { fontSize: 14, color: "#aaa" },

  // Vacío
  vacio: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  vacioIcono: { fontSize: 48, marginBottom: 12 },
  vacioTitulo: { fontSize: 17, fontWeight: "800", color: "#333", marginBottom: 6 },
  vacioSubtitulo: { fontSize: 14, color: "#aaa", textAlign: "center", lineHeight: 20 },

  // Tarjeta
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
    alignItems: "center",
    flexWrap: "nowrap",
    zIndex: 10,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
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