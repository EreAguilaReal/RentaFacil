import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { obtenerDepartamento, Departamento } from "../../services/api";

// Y borra el type Depa local

const { width } = Dimensions.get("window");

// ── Íconos top bar ────────────────────────────────────────────────
const TOP_ICONS = [
  { key: "perfil",    emoji: "👤" },
  { key: "favoritos", emoji: "🤍" },
  { key: "chat",      emoji: "💬" },
  { key: "ajustes",   emoji: "⚙️" },
];

// ── Amenidades ────────────────────────────────────────────────────
const AMENIDADES = [
  { key: "amueblado",       label: "Amueblado",                  emoji: "🛋" },
  { key: "internet",        label: "Internet",                   emoji: "📶" },
  { key: "estacionamiento", label: "Estacionamiento",            emoji: "🚗" },
  { key: "pet_friendly",    label: "Pet friendly",               emoji: "🐾" },
  { key: "cocina",          label: "Cocina",                     emoji: "🍳" },
];

export default function DetalleDepa() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [depa, setDepa]               = useState<Departamento | null>(null);
  const [cargando, setCargando]       = useState(true);
  const [modalOcupado, setModalOcupado] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [iconActivo, setIconActivo]   = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      obtenerDepartamento(Number(id))
        .then((data) => {
          setDepa(data);
          setCargando(false);
        })
        .catch(() => setCargando(false));
    }
  }, [id]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <Text style={styles.cargandoTexto}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!depa) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <Text style={styles.cargandoTexto}>No se encontró el departamento.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const amenidadesActivas = AMENIDADES.filter((a) => (depa as any)[a.key]);
  const amenidadesMostradas = mostrarTodas
    ? amenidadesActivas
    : amenidadesActivas.slice(0, 3);

  const handleApartar = () => {
    if (!depa.disponible) {
      setModalOcupado(true);
    } else {
      // TODO: navegar a pantalla de apartado
      alert("¡Departamento apartado!");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topIconsLeft}>
          {TOP_ICONS.map((ic) => (
            <TouchableOpacity
              key={ic.key}
              style={[
                styles.topIconBtn,
                iconActivo === ic.key && styles.topIconBtnActivo,
              ]}
              onPress={() => setIconActivo(ic.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.topIconEmoji}>{ic.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.topLogos}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoTexto}>IPN</Text>
          </View>
          <View style={[styles.logoBadge, { backgroundColor: "#003366" }]}>
            <Text style={styles.logoTexto}>ESCOM</Text>
          </View>
        </View>
      </View>

      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Barra de acciones ── */}
        <View style={styles.accionesBar}>
          <TouchableOpacity style={styles.accionBtn} onPress={() => router.back()}>
            <Text style={styles.accionEmoji}>←</Text>
          </TouchableOpacity>
          <View style={styles.accionesRight}>
            <TouchableOpacity style={styles.accionBtn}>
              <Text style={styles.accionEmoji}>⬆️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.accionBtn}>
              <Text style={styles.accionEmoji}>🔖</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Imagen principal ── */}
        <View style={styles.imagenContainer}>
          <Image
            source={{ uri: depa.imagen || "https://via.placeholder.com/400x250" }}
            style={styles.imagen}
          />
          <TouchableOpacity style={styles.fotosBtn}>
            <Text style={styles.fotosBtnTexto}>Toca para ver más fotos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoBtn}>
            <Text style={styles.infoBtnTexto}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info principal ── */}
        <View style={styles.infoContainer}>

          {/* Título + stats */}
          <View style={styles.tituloRow}>
            <TouchableOpacity>
              <Text style={styles.favEmoji}>🤍</Text>
            </TouchableOpacity>
            <Text style={styles.titulo} numberOfLines={2}>
              {depa.titulo}
            </Text>
            <Text style={styles.vistasEmoji}>👁</Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statTexto}>50 Favoritos</Text>
            <Text style={styles.statTexto}>1000 Vistas</Text>
          </View>

          {/* Descripción */}
          <Text style={styles.descripcion}>
            {depa.descripcion ||
              `${depa.cuartos} recámara(s), cocina, sala, comedor. Ubicación cercana a puntos clave de la CDMX.\nLa estación de metro más cercana es ${depa.metro_cercano}.`}
          </Text>

          {/* Tipo de renta */}
          {depa.tipo_renta && (
            <View style={styles.tipoBadge}>
              <Text style={styles.tipoTexto}>
                {depa.tipo_renta === "solo_mujeres"
                  ? "👩 Solo mujeres"
                  : depa.tipo_renta === "solo_hombres"
                  ? "👨 Solo hombres"
                  : "👥 Mixto"}
              </Text>
            </View>
          )}

          {/* Amenidades */}
          <Text style={styles.amenidadesTitulo}>Este departamento ofrece</Text>

          {amenidadesMostradas.map((a) => (
            <View key={a.key} style={styles.amenidadRow}>
              <Text style={styles.amenidadEmoji}>{a.emoji}</Text>
              <Text style={styles.amenidadLabel}>{a.label}</Text>
            </View>
          ))}

          {/* Botones */}
          <View style={styles.botonesRow}>
            {amenidadesActivas.length > 3 && (
              <TouchableOpacity
                style={styles.btnSecundario}
                onPress={() => setMostrarTodas(!mostrarTodas)}
              >
                <Text style={styles.btnSecundarioTexto}>
                  {mostrarTodas ? "Ver menos" : "Mostrar todas las amenidades"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnPrimario} onPress={handleApartar}>
              <Text style={styles.btnPrimarioTexto}>Apartar ahora</Text>
            </TouchableOpacity>
          </View>

          {/* Flecha más */}
          <TouchableOpacity style={styles.masBtn}>
            <Text style={styles.masBtnTexto}>˅</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Precio fijo abajo ── */}
      <View style={styles.precioBar}>
        <Text style={styles.precioTexto}>
          ${depa.precio.toLocaleString()} MXN/mes
        </Text>
      </View>

      {/* ── Modal: Departamento ocupado ── */}
      <Modal visible={modalOcupado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>
              Este departamento{"\n"}ya está ocupado
            </Text>
            <Text style={styles.modalEmoji}>⚠️</Text>
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalBtnSecundario}
                onPress={() => setModalOcupado(false)}
              >
                <Text style={styles.modalBtnTexto}>Regresar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimario}
                onPress={() => {
                  setModalOcupado(false);
                  router.back();
                }}
              >
                <Text style={styles.modalBtnTexto}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },

  cargandoContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  cargandoTexto: { fontSize: 16, color: "#888" },

  // Top Bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f7f4f0",
  },
  topIconsLeft: { flexDirection: "row", gap: 6 },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
  },
  topIconBtnActivo: { backgroundColor: "#e63946", borderColor: "#e63946" },
  topIconEmoji: { fontSize: 18 },
  topLogos: { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge: {
    backgroundColor: "#8B0000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoTexto: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },

  separador: { height: 1, backgroundColor: "#e0dcd8" },

  // Acciones
  accionesBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accionesRight: { flexDirection: "row", gap: 8 },
  accionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0dcd8",
  },
  accionEmoji: { fontSize: 17 },

  // Imagen
  imagenContainer: { position: "relative", marginHorizontal: 16, borderRadius: 18, overflow: "hidden" },
  imagen: { width: "100%", height: 220, backgroundColor: "#c0cfff" },
  fotosBtn: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  fotosBtnTexto: { color: "#fff", fontSize: 13, fontWeight: "600" },
  infoBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBtnTexto: { fontSize: 16 },

  // Info
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  favEmoji: { fontSize: 22 },
  titulo: { flex: 1, fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  vistasEmoji: { fontSize: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 12,
  },
  statTexto: { fontSize: 12, color: "#888", fontWeight: "600" },

  descripcion: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 12,
  },

  tipoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fde8ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  tipoTexto: { fontSize: 13, fontWeight: "700", color: "#e63946" },

  amenidadesTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 12,
  },
  amenidadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ece8",
  },
  amenidadEmoji: { fontSize: 22, width: 32 },
  amenidadLabel: { fontSize: 15, color: "#333", fontWeight: "500" },

  botonesRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    flexWrap: "wrap",
  },
  btnSecundario: {
    flex: 1,
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    minWidth: 140,
  },
  btnSecundarioTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },
  btnPrimario: {
    flex: 1,
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    minWidth: 120,
  },
  btnPrimarioTexto: { color: "#fff", fontWeight: "800", fontSize: 14 },

  masBtn: { alignItems: "center", marginTop: 16 },
  masBtnTexto: { fontSize: 28, color: "#888" },

  // Precio fijo
  precioBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d0d8e8",
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#c0c8d8",
  },
  precioTexto: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },

  // Modal ocupado
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalContenido: {
    backgroundColor: "#3a5fcf",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 28,
  },
  modalEmoji: { fontSize: 48, marginBottom: 20 },
  modalBotones: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnSecundario: {
    flex: 1,
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnPrimario: {
    flex: 1,
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
});