import React, { useRef, useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { obtenerDepartamentos } from '../../services/api';

const { width } = Dimensions.get("window");

// ── Chips de filtro rápido ────────────────────────────────────────
const FILTROS_RAPIDOS = [
  { key: "amueblado", label: "🛋 Amueblado" },
  { key: "petfriendly", label: "🐾 Pet friendly" },
  { key: "soloMujeres", label: "👩 Solo mujeres" },
  { key: "internet", label: "📶 Internet" },
  { key: "estacionamiento", label: "🚗 Estacionamiento" },
  { key: "cocina", label: "🍳 Cocina" },
];

// ── Mapa simulado ─────────────────────────────────────────────────
const MapaSimulado = ({ depas }: { depas: any[] }) => (
  <View style={styles.mapaContainer}>
    <Text style={styles.mapaTitulo}>📍 Mapa de departamentos</Text>
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
          <Text style={styles.mapaPinTexto}>${(d.precio / 1000).toFixed(1)}k</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.mapaNotaTexto}>
        * Mapa ilustrativo — se conectará a Google Maps
      </Text>
    </View>
  </View>
);

// ── Tarjeta de departamento ───────────────────────────────────────
const TarjetaDepa = ({ item }: { item: any }) => (
  <TouchableOpacity style={styles.tarjeta} activeOpacity={0.85}>
    <Image source={{ uri: item.imagen }} style={styles.tarjetaImagen} />
    <View style={styles.tarjetaBadgeContainer}>
      {item.tipo_renta === 'solo_mujeres' && (
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
      <View style={styles.tarjetaMetro}>
        <Text style={styles.tarjetaMetroTexto}>
          🚇 {item.metro_cercano}
        </Text>
      </View>
      <View style={styles.tarjetaFooter}>
        <Text style={styles.tarjetaPrecio}>
          ${item.precio.toLocaleString()}/mes
        </Text>
        <View style={styles.tarjetaIconos}>
          {item.amueblado && <Text style={styles.iconoSmall}>🛋</Text>}
          {item.internet && <Text style={styles.iconoSmall}>📶</Text>}
          {item.estacionamiento && <Text style={styles.iconoSmall}>🚗</Text>}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ── Modal de filtros avanzados ────────────────────────────────────
const ModalFiltros = ({
  visible,
  onClose,
  filtros,
  setFiltros,
  rango,
  setRango,
}: any) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContenido}>
        <Text style={styles.modalTitulo}>Filtros</Text>

        <Text style={styles.modalSeccion}>Rango de precio</Text>
        <Text style={styles.modalRangoTexto}>
          $3,000 — ${rango.toLocaleString()}
        </Text>
        <View style={styles.rangoSliderFake}>
          {[3000, 4500, 6000, 7500, 9000, 10000].map((val) => (
            <TouchableOpacity
              key={val}
              onPress={() => setRango(val)}
              style={[
                styles.rangoBtn,
                rango === val && styles.rangoBtnActivo,
              ]}
            >
              <Text
                style={[
                  styles.rangoBtnTexto,
                  rango === val && styles.rangoBtnTextoActivo,
                ]}
              >
                ${(val / 1000).toFixed(1)}k
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.modalSeccion}>Tipo de renta</Text>
        {[
          { key: "soloMujeres", label: "Solo mujeres" },
          { key: "soloHombres", label: "Solo hombres" },
          { key: "mixto", label: "Mixto" },
        ].map((op) => (
          <View key={op.key} style={styles.switchRow}>
            <Text style={styles.switchLabel}>{op.label}</Text>
            <Switch
              value={filtros[op.key] || false}
              onValueChange={(v) => setFiltros({ ...filtros, [op.key]: v })}
              trackColor={{ true: "#e63946" }}
            />
          </View>
        ))}

        <Text style={styles.modalSeccion}>Características</Text>
        {[
          { key: "amueblado", label: "🛋 Amueblado" },
          { key: "petfriendly", label: "🐾 Pet friendly" },
          { key: "internet", label: "📶 Internet incluido" },
          { key: "estacionamiento", label: "🚗 Estacionamiento" },
          { key: "cocina", label: "🍳 Cocina" },
        ].map((op) => (
          <View key={op.key} style={styles.switchRow}>
            <Text style={styles.switchLabel}>{op.label}</Text>
            <Switch
              value={filtros[op.key] || false}
              onValueChange={(v) => setFiltros({ ...filtros, [op.key]: v })}
              trackColor={{ true: "#e63946" }}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.modalBoton} onPress={onClose}>
          <Text style={styles.modalBotonTexto}>Aplicar filtros</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function HomeScreen() {
  const [depas, setDepas] = useState<any[]>([]);

  useEffect(() => {
    obtenerDepartamentos().then(setDepas);
  }, []);
  
  const [busqueda, setBusqueda] = useState("");
  const [chipActivo, setChipActivo] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filtros, setFiltros] = useState<Record<string, boolean>>({});
  const [rangoMax, setRangoMax] = useState(10000);
  const carouselRef = useRef<FlatList>(null);

  const depasFiltrados = depas.filter((d) => {
    const matchBusqueda =
      busqueda === "" ||
      d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.colonia.toLowerCase().includes(busqueda.toLowerCase());
    const matchChip = chipActivo ? (d as any)[chipActivo] === true : true;
    const matchPrecio = d.precio <= rangoMax;
    const matchFiltros = Object.entries(filtros).every(
      ([k, v]) => !v || (d as any)[k] === true
    );
    return matchBusqueda && matchChip && matchPrecio && matchFiltros;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola, estudiante 👋</Text>
            <Text style={styles.subtitulo}>Encuentra tu depa en CDMX</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <Text style={styles.avatarTexto}>RF</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Colonia, alcaldía o metro..."
              placeholderTextColor="#aaa"
              style={styles.searchInput}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <TouchableOpacity
            style={styles.filtroBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.filtroBtnTexto}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Chips de filtro rápido */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTROS_RAPIDOS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                chipActivo === f.key && styles.chipActivo,
              ]}
              onPress={() =>
                setChipActivo(chipActivo === f.key ? null : f.key)
              }
            >
              <Text
                style={[
                  styles.chipTexto,
                  chipActivo === f.key && styles.chipTextoActivo,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Carrusel de anuncios destacados */}
        <Text style={styles.seccionTitulo}>✨ Destacados</Text>
        <FlatList
          ref={carouselRef}
          data={depas}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.carouselCard} activeOpacity={0.9}>
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
          snapToInterval={width - 32}
          decelerationRate="fast"
        />

        {/* Mapa simulado */}
        <MapaSimulado depas={depasFiltrados} />

        {/* Lista de departamentos */}
        <View style={styles.listaHeader}>
          <Text style={styles.seccionTitulo}>🏠 Departamentos</Text>
          <Text style={styles.listaConteo}>
            {depasFiltrados.length} resultados
          </Text>
        </View>

        {depasFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>
              😕 No hay resultados con esos filtros
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
        filtros={filtros}
        setFiltros={setFiltros}
        rango={rangoMax}
        setRango={setRangoMax}
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

  // Búsqueda
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  filtroBtn: {
    backgroundColor: "#e63946",
    borderRadius: 14,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e63946",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  filtroBtnTexto: { fontSize: 20 },

  // Chips
  chipsScroll: { marginTop: 14 },
  chipsContent: { paddingHorizontal: 20, gap: 8 },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
  },
  chipActivo: { backgroundColor: "#e63946", borderColor: "#e63946" },
  chipTexto: { fontSize: 13, color: "#555", fontWeight: "600" },
  chipTextoActivo: { color: "#fff" },

  // Sección
  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a1a",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  // Carrusel
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

  // Mapa
  mapaContainer: { marginHorizontal: 20, marginTop: 20 },
  mapaTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a1a", marginBottom: 10 },
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
    shadowColor: "#e63946",
    shadowOpacity: 0.5,
    shadowRadius: 6,
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

  // Lista
  listaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },
  listaConteo: { fontSize: 13, color: "#888", fontWeight: "600" },

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
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "700" },
  tarjetaInfo: { padding: 14 },
  tarjetaTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  tarjetaColonia: { fontSize: 13, color: "#777", marginTop: 4 },
  tarjetaMetro: { marginTop: 4 },
  tarjetaMetroTexto: { fontSize: 12, color: "#555" },
  tarjetaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  tarjetaPrecio: { fontSize: 17, fontWeight: "900", color: "#e63946" },
  tarjetaIconos: { flexDirection: "row", gap: 4 },
  iconoSmall: { fontSize: 16 },

  // Vacío
  vacio: { alignItems: "center", padding: 40 },
  vacioTexto: { fontSize: 15, color: "#aaa" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContenido: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitulo: { fontSize: 20, fontWeight: "900", color: "#1a1a1a", marginBottom: 20 },
  modalSeccion: {
    fontSize: 14,
    fontWeight: "800",
    color: "#888",
    marginTop: 16,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalRangoTexto: { fontSize: 22, fontWeight: "900", color: "#e63946", marginBottom: 10 },
  rangoSliderFake: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rangoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
  },
  rangoBtnActivo: { backgroundColor: "#e63946", borderColor: "#e63946" },
  rangoBtnTexto: { fontSize: 13, color: "#555", fontWeight: "600" },
  rangoBtnTextoActivo: { color: "#fff" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ece8",
  },
  switchLabel: { fontSize: 15, color: "#333" },
  modalBoton: {
    backgroundColor: "#e63946",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  modalBotonTexto: { color: "#fff", fontWeight: "800", fontSize: 16 },
});