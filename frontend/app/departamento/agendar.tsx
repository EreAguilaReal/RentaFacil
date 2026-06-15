import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "./../context/AuthContext";
import { URL_BASE } from "./../../services/api";

// ── Opciones de día y horario ─────────────────────────────────────
const HORARIOS = [
  "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00",
];

// ── Íconos top bar ────────────────────────────────────────────────
const TOP_ICONS = [
  { key: "perfil",    emoji: "👤", route: "/usuarios/perfil" },
  { key: "favoritos", emoji: "🤍", route: "/favoritos" },
  { key: "chat",      emoji: "💬", route: "/mensajes" },
  { key: "ajustes",   emoji: "⚙️", route: "/configuracion" },
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
  const { id } = useLocalSearchParams();           // id del departamento
  const { usuario } = useAuth();
  const [arrendadorId, setArrendadorId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const [iconActivo, setIconActivo]   = useState<string | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horarioSeleccionado, setHorario] = useState<string | null>(null);
  const [modalExito, setModalExito]   = useState(false);
  const [modalError, setModalError]   = useState(false);
  const [errores, setErrores]         = useState<string[]>([]);

  const handleSiguiente = async () => {
    const nuevosErrores: string[] = [];
    if (!fechaSeleccionada)     nuevosErrores.push("Selecciona una fecha");
    if (!horarioSeleccionado) nuevosErrores.push("Selecciona un horario");
    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      setModalError(true);
      return;
    }

    if (!usuario || !id) return;
    // Evitar que el arrendador agende visita a su propio depto
    if (arrendadorId && usuario.id === arrendadorId) {
      alert('Lo sentimos pero no es posible agendar una visita a tu propio departamento');
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch(`${URL_BASE}/citas/agendar/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departamento: Number(id),
          arrendatario: usuario.id,
          dia:     fechaSeleccionada ? fechaSeleccionada.toISOString().split("T")[0] : "",
          horario: horarioSeleccionado,
        }),
      });
      if (!r.ok) throw new Error();
      setModalExito(true);
    } catch {
      setErrores(["Error al conectar con el servidor"]);
      setModalError(true);
    } finally {
      setEnviando(false);
    }
  };

  // Cargar arrendador del departamento para evitar que se agende a sí mismo
  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`${URL_BASE}/departamentos/${id}/`);
        if (!r.ok) return;
        const data = await r.json();
        const arr = data.arrendador;
        const aid = typeof arr === 'object' ? arr.id : Number(arr);
        if (!Number.isNaN(aid)) setArrendadorId(aid);
      } catch (_) {}
    })();
  }, [id]);

  const handleIconPress = (route: string, key: string) => {
    setIconActivo(key);
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.accionBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.accionEmoji}>←</Text>
          </TouchableOpacity>
          <View style={styles.topIconsLeft}>
            {TOP_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic.key}
                style={[styles.topIconBtn, iconActivo === ic.key && styles.topIconBtnActivo]}
                onPress={() => handleIconPress(ic.route, ic.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.topIconEmoji}>{ic.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
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

        {/* ── Título ── */}
        <View style={styles.tituloContainer}>
          <Text style={styles.titulo}>Agendar visita al{"\n"}departamento</Text>
        </View>

        {/* ── Dropdowns ── */}
        <View style={styles.formContainer}>
          {Platform.OS === "web" ? (
            <input
              type="date"
              value={fechaSeleccionada ? fechaSeleccionada.toISOString().split("T")[0] : ""}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setFechaSeleccionada(null);
                  return;
                }
                setFechaSeleccionada(new Date(value));
              }}
              style={{
                backgroundColor: "#f7f4f0",
                borderRadius: 12,
                border: "1.5px solid #e0dcd8",
                paddingInline: 14,
                paddingBlock: 12,
                fontSize: 15,
                color: "#1a1a1a",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "inherit",
                marginBottom: 14,
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateSelectorText, !fechaSeleccionada && styles.placeholder]}>
                  {fechaSeleccionada
                    ? fechaSeleccionada.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
                    : "Selecciona una fecha"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={fechaSeleccionada ?? new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) setFechaSeleccionada(selectedDate);
                  }}
                />
              )}
            </>
          )}
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
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  dateSelector: {
    borderWidth: 1.5,
    borderColor: "#1a3a8f",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    marginBottom: 14,
    alignItems: "center",
  },
  dateSelectorText: {
    fontSize: 15,
    color: "#1a1a1a",
  },
  placeholder: {
    color: "#aaa",
  },
  btnSiguienteTexto: { color: "#fff", fontWeight: "900", fontSize: 17 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 32,
  },
  modalContenido: {
    backgroundColor: "#3a4a8f", borderRadius: 20,
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
    backgroundColor: "#1a233d", borderRadius: 30,
    paddingVertical: 14, paddingHorizontal: 40,
    marginTop: 16,
  },
  modalBtnTexto: { color: "#fff", fontWeight: "900", fontSize: 16 },
});