import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// ── Opciones de día y horario ─────────────────────────────────────
const DIAS = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];

const HORARIOS = [
  "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00",
];

// ── Íconos top bar ────────────────────────────────────────────────
const TOP_ICONS = [
  { key: "perfil",    emoji: "👤" },
  { key: "favoritos", emoji: "🤍" },
  { key: "chat",      emoji: "💬" },
  { key: "ajustes",   emoji: "⚙️" },
];

// ── Dropdown simple ───────────────────────────────────────────────
const Dropdown = ({
  placeholder,
  opciones,
  seleccionado,
  onSeleccionar,
}: {
  placeholder: string;
  opciones: string[];
  seleccionado: string | null;
  onSeleccionar: (v: string) => void;
}) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <View style={dropStyles.container}>
      <TouchableOpacity
        style={dropStyles.selector}
        onPress={() => setAbierto(!abierto)}
        activeOpacity={0.8}
      >
        <Text style={dropStyles.flecha}>▼</Text>
        <Text style={[dropStyles.texto, !seleccionado && dropStyles.placeholder]}>
          {seleccionado || placeholder}
        </Text>
      </TouchableOpacity>

      {abierto && (
        <View style={dropStyles.lista}>
          {opciones.map((op) => (
            <TouchableOpacity
              key={op}
              style={[dropStyles.opcion, seleccionado === op && dropStyles.opcionActiva]}
              onPress={() => { onSeleccionar(op); setAbierto(false); }}
            >
              <Text style={[dropStyles.opcionTexto, seleccionado === op && dropStyles.opcionTextoActivo]}>
                {op}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const dropStyles = StyleSheet.create({
  container: { marginBottom: 14, zIndex: 10 },
  selector: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#1a3a8f",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "#fff",
  },
  flecha: { color: "#1a3a8f", fontWeight: "900", fontSize: 14, marginRight: 10 },
  texto: { fontSize: 15, color: "#1a1a1a", flex: 1, textAlign: "center" },
  placeholder: { color: "#aaa" },
  lista: {
    borderWidth: 1.5, borderColor: "#1a3a8f", borderTopWidth: 0,
    borderRadius: 10, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    backgroundColor: "#fff", overflow: "hidden",
  },
  opcion: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0ece8" },
  opcionActiva: { backgroundColor: "#1a3a8f" },
  opcionTexto: { fontSize: 14, color: "#333", textAlign: "center" },
  opcionTextoActivo: { color: "#fff", fontWeight: "700" },
});

// ── Pantalla principal ────────────────────────────────────────────
export default function AgendarScreen() {
  const router = useRouter();

  const [iconActivo, setIconActivo]   = useState<string | null>(null);
  const [diaSeleccionado, setDia]     = useState<string | null>(null);
  const [horarioSeleccionado, setHorario] = useState<string | null>(null);
  const [modalExito, setModalExito]   = useState(false);
  const [modalError, setModalError]   = useState(false);
  const [errores, setErrores]         = useState<string[]>([]);

  const handleSiguiente = () => {
    const nuevosErrores: string[] = [];
    if (!diaSeleccionado)     nuevosErrores.push("Fecha no disponible");
    if (!horarioSeleccionado) nuevosErrores.push("Horario no disponible");

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      setModalError(true);
    } else {
      setModalExito(true);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

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

        {/* ── Título ── */}
        <View style={styles.tituloContainer}>
          <Text style={styles.titulo}>Agendar visita al{"\n"}departamento</Text>
        </View>

        {/* ── Dropdowns ── */}
        <View style={styles.formContainer}>
          <Dropdown
            placeholder="Dia"
            opciones={DIAS}
            seleccionado={diaSeleccionado}
            onSeleccionar={setDia}
          />
          <Dropdown
            placeholder="Horario"
            opciones={HORARIOS}
            seleccionado={horarioSeleccionado}
            onSeleccionar={setHorario}
          />
        </View>

        {/* ── Botón siguiente ── */}
        <TouchableOpacity style={styles.btnSiguiente} onPress={handleSiguiente} activeOpacity={0.85}>
          <Text style={styles.btnSiguienteTexto}>Siguiente</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ══ Modal éxito ══ */}
      <Modal visible={modalExito} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Visita agendada{"\n"}correctamente</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setModalExito(false); router.back(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnTexto}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ Modal error ══ */}
      <Modal visible={modalError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Error al agendar cita</Text>
            {errores.map((e, i) => (
              <View key={i} style={styles.errorItem}>
                <Text style={styles.errorBullet}>•</Text>
                <Text style={styles.errorTexto}>{e}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setModalError(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnTexto}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },

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

  scroll: { paddingBottom: 40 },

  tituloContainer: {
    marginHorizontal: 20, marginTop: 20, marginBottom: 32,
    backgroundColor: "#f0e8c8", borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 18,
    alignItems: "center",
  },
  titulo: {
    fontSize: 20, fontWeight: "900", color: "#1a1a1a",
    textAlign: "center", lineHeight: 28,
  },

  formContainer: { paddingHorizontal: 20, marginBottom: 20 },

  btnSiguiente: {
    marginHorizontal: 20, backgroundColor: "#1a3a8f",
    borderRadius: 30, paddingVertical: 16, alignItems: "center",
    shadowColor: "#1a3a8f", shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  btnSiguienteTexto: { color: "#fff", fontWeight: "900", fontSize: 17 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 32,
  },
  modalContenido: {
    backgroundColor: "#8a8a8a", borderRadius: 20,
    padding: 28, width: "100%", alignItems: "center",
  },
  modalTitulo: {
    fontSize: 18, fontWeight: "900", color: "#fff",
    textAlign: "center", marginBottom: 20, lineHeight: 26,
  },
  errorItem: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 8, marginBottom: 8, alignSelf: "flex-start",
  },
  errorBullet: { color: "#fff", fontSize: 16, fontWeight: "900" },
  errorTexto: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  modalBtn: {
    backgroundColor: "#1a3a8f", borderRadius: 30,
    paddingVertical: 14, paddingHorizontal: 40,
    marginTop: 16,
  },
  modalBtnTexto: { color: "#fff", fontWeight: "900", fontSize: 16 },
});