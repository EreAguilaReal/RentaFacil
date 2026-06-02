import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { URL_BASE } from "../../services/api";

const { height } = Dimensions.get("window");

// ── Íconos top bar ────────────────────────────────────────────────
const TOP_ICONS = [
  { key: "perfil",    emoji: "👤" },
  { key: "chat",      emoji: "💬" },
  { key: "ajustes",   emoji: "⚙️" },
];

export default function FotosScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [departamento, setDepartamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [iconActivo, setIconActivo]       = useState<string | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const imagenes =
  departamento
    ? [
        ...(departamento.imagen_principal
          ? [
              {
                id: "principal",
                imagen: departamento.imagen_principal,
              },
            ]
          : []),
        ...(departamento.galeria || []),
      ]
    : [];
  useEffect(() => {
    const cargarDepartamento = async () => {
      try {
        const response = await fetch(`${URL_BASE}/departamentos/${id}/`);

        if (!response.ok) {
          throw new Error("Error al cargar departamento");
        }

        const data = await response.json();

        console.log("Departamento:", data);

        setDepartamento(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarDepartamento();
    }
  }, [id]);
  // ── Animación bottom sheet ────────────────────────────────────
  const translateY = useRef(new Animated.Value(height)).current;

  const abrirSheet = () => {
    setBottomSheetVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const cerrarSheet = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setBottomSheetVisible(false));
  };

  // ── PanResponder para swipe arriba ────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy < -20 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) abrirSheet();
      },
    })
  ).current;

  // ── PanResponder para cerrar el sheet con swipe abajo ─────────
  const sheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60) cerrarSheet();
      },
    })
  ).current;
    if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Cargando...</Text>
      </SafeAreaView>
    );
  }
  const amenidades = departamento
  ? [
      {
        label: "Recámaras",
        valor: String(departamento.cuartos),
      },
      {
        label: "Internet",
        valor: departamento.internet ? "✓" : "✗",
      },
      {
        label: "Amueblado",
        valor: departamento.amueblado ? "✓" : "✗",
      },
      {
        label: "Estacionamiento",
        valor: departamento.estacionamiento ? "✓" : "✗",
      },
      {
        label: "Pet Friendly",
        valor: departamento.pet_friendly ? "✓" : "✗",
      },
      {
        label: "Cocina",
        valor: departamento.cocina ? "✓" : "✗",
      },
      {
        label: "Tipo de renta",
        valor: departamento.tipo_renta,
      },
    ]
  : [];
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topIconsLeft}>
          {TOP_ICONS.map((ic) => (
            <TouchableOpacity
              key={ic.key}
              style={[styles.topIconBtn, iconActivo === ic.key && styles.topIconBtnActivo]}
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

      {/* ── Galería ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <Text style={styles.titulo}>Fotos del{"\n"}departamento</Text>

        {imagenes.map((foto: any, index: number) => (
          <View
            key={foto.id ?? index}
            style={styles.fotoContainer}
          >
            <Image
              source={{
                uri: foto.imagen,
              }}
              style={styles.foto}
              resizeMode="cover"
            />

            <View style={styles.fotoLabelContainer}>
              <Text style={styles.fotoLabel}>
                {index === 0 ? "Imagen principal" : `Foto ${index}`}
              </Text>
            </View>
          </View>
        ))}

        {/* Indicador de swipe */}
        <TouchableOpacity style={styles.swipeHint} onPress={abrirSheet}>
          <Text style={styles.swipeHintTexto}>↑ Desliza para ver detalles</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Bottom Sheet: Detalles ── */}
      {bottomSheetVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={cerrarSheet}
        />
      )}

      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        {...sheetPan.panHandlers}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetTitulo}>Este departamento ofrece</Text>

          {amenidades.map((a, i) => (
            <View key={i} style={styles.amenidadRow}>
            <Text style={styles.amenidadValor}>
              {a.valor}
            </Text>

            <Text style={styles.amenidadLabel}>
              {a.label}
            </Text>
          </View>
          ))}

          <TouchableOpacity style={styles.sheetCerrarBtn} onPress={cerrarSheet}>
            <Text style={styles.sheetCerrarTexto}>Cerrar</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>

    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },

  // Top Bar
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#f7f4f0",
  },
  topIconsLeft: { flexDirection: "row", gap: 6 },
  topIconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  topIconBtnActivo: { backgroundColor: "#e63946", borderColor: "#e63946" },
  topIconEmoji: { fontSize: 18 },
  topLogos: { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge: { backgroundColor: "#8B0000", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  logoTexto: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  separador: { height: 1, backgroundColor: "#e0dcd8" },

  // Acciones
  accionesBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  accionesRight: { flexDirection: "row", gap: 8 },
  accionBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  accionEmoji: { fontSize: 17 },

  // Galería
  titulo: {
    fontSize: 22, fontWeight: "900", color: "#1a1a1a",
    textAlign: "center", marginVertical: 16, lineHeight: 30,
  },
  fotoContainer: {
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  foto: { width: "100%", height: 220, backgroundColor: "#ddd" },
  fotoLabelContainer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 14, paddingVertical: 8,
  },
  fotoLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Swipe hint
  swipeHint: {
    alignItems: "center", paddingVertical: 16,
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#1a3a8f",
  },
  swipeHintTexto: { color: "#1a3a8f", fontWeight: "700", fontSize: 14 },

  // Overlay
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  // Bottom Sheet
  bottomSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#1a3a8f",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12,
    maxHeight: height * 0.75,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignSelf: "center", marginBottom: 16,
  },
  sheetTitulo: {
    fontSize: 17, fontWeight: "900", color: "#fff",
    textAlign: "center", marginBottom: 20,
  },
  amenidadRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)",
  },
  amenidadValor: {
    fontSize: 16, fontWeight: "900", color: "#fff",
    width: 120, textAlign: "center",
  },
  amenidadEmoji: { fontSize: 22, width: 28, textAlign: "center" },
  amenidadLabel: { fontSize: 15, color: "#fff", fontWeight: "500", flex: 1 },
  sheetCerrarBtn: {
    marginTop: 20, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  sheetCerrarTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
});