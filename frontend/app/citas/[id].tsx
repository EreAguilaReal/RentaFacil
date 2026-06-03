import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { URL_BASE } from "../../services/api";

type EstadoCita = "pendiente" | "aceptada" | "rechazada" | "cancelada";

type Cita = {
  id: number;
  departamento: number;
  departamento_titulo: string;
  departamento_colonia: string;
  arrendatario: number;
  arrendatario_nombre: string;
  dia: string;
  horario: string;
  estado: EstadoCita;
  fecha_creacion: string;
};

const ESTADO_CONFIG: Record<EstadoCita, { emoji: string; label: string; color: string; bg: string }> = {
  pendiente:  { emoji: "⏳", label: "Pendiente de confirmación", color: "#633806", bg: "#FAEEDA" },
  aceptada:   { emoji: "✅", label: "Cita confirmada",           color: "#27500A", bg: "#EAF3DE" },
  rechazada:  { emoji: "❌", label: "Cita rechazada",            color: "#7a0000", bg: "#fde8ea" },
  cancelada:  { emoji: "🚫", label: "Cita cancelada",            color: "#666",    bg: "#f0ece8" },
};

export default function DetalleCita() {
  const { id } = useLocalSearchParams();
  const router  = useRouter();
  const citaId  = Number(Array.isArray(id) ? id[0] : id);
  const esIdValido = Number.isInteger(citaId) && citaId > 0;

  const { usuario } = useAuth();
  const esArrendador = usuario?.tipo_usuario === "arrendador";

  const [cita, setCita]         = useState<Cita | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [mostrarModalRenta, setMostrarModalRenta] = useState(false);
  const [duracionMeses, setDuracionMeses] = useState("1");
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [iniciandoRenta, setIniciandoRenta] = useState(false);

  useEffect(() => {
    if (!esIdValido) {
      setCargando(false);
      return;
    }

    fetch(`${URL_BASE}/citas/${citaId}/`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setCita(data?.id ? data : null);
        if (data?.fecha_creacion) {
          setFechaInicio(new Date(data.fecha_creacion));
        }
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [citaId, esIdValido]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#1a3a8f" size="large" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!esIdValido || !cita) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.vaciBox}>
          <Text style={styles.vaciEmoji}>😕</Text>
          <Text style={styles.vaciTitulo}>Cita no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = ESTADO_CONFIG[cita.estado] ?? ESTADO_CONFIG.pendiente;

  const formatearFecha = (valor: string) => {
    const fecha = new Date(valor);
    const esFechaValida = !isNaN(fecha.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(valor);
    return esFechaValida
      ? fecha.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
      : valor;
  };

  const handleCancelarCita = () => {
    if (cancelando) return;
    setConfirmCancelar(true);
  };

  const performCancelarCita = async () => {
    if (cancelando || !cita) return;
    setCancelando(true);
    try {
      const r = await fetch(`${URL_BASE}/citas/${cita.id}/cancelar/`, { method: "PATCH" });
      if (!r.ok) throw new Error();
      await r.json();
      router.replace("/usuarios/perfil");
    } catch {
      setConfirmCancelar(false);
      setCancelando(false);
      Alert.alert("Error", "No se pudo cancelar la cita.");
    }
  };

  const handleIniciarRenta = () => {
    setMostrarModalRenta(true);
  };

  const handleFechaInicioChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setFechaInicio(selectedDate);
    }
    if (Platform.OS !== "ios") {
      setMostrarDatePicker(false);
    }
  };

  const performIniciarRenta = async () => {
    if (iniciandoRenta || !cita) return;
    setIniciandoRenta(true);

    try {
      const r = await fetch(`${URL_BASE}/citas/${cita.id}/cerrar-trato/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_inicio: fechaInicio.toISOString().slice(0, 10),
          duracion_meses: Number(duracionMeses),
        }),
      });

      if (!r.ok) {
        const errorData = await r.json().catch(() => null);
        throw new Error(errorData?.error || "Error al iniciar la renta.");
      }

      setMostrarModalRenta(false);
      router.replace("/usuarios/perfil");
    } catch (error: any) {
      setIniciandoRenta(false);
      Alert.alert("Error", error.message || "No se pudo iniciar la renta.");
    }
  };

  const fechaInicioTexto = fechaInicio
    ? fechaInicio.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Selecciona una fecha";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Detalle de cita</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Estado */}
        <View style={[styles.estadoCard, { backgroundColor: cfg.bg }]}>
          <Text style={styles.estadoEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.estadoLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Departamento */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🏢 Departamento</Text>
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Nombre</Text>
            <Text style={styles.filaValor}>{cita.departamento_titulo}</Text>
          </View>
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Colonia</Text>
            <Text style={styles.filaValor}>{cita.departamento_colonia}</Text>
          </View>
          <TouchableOpacity
            style={styles.btnVerDepa}
            onPress={() => router.push(`/departamento/${cita.departamento}` as any)}
          >
            <Text style={styles.btnVerDepaTexto}>Ver departamento →</Text>
          </TouchableOpacity>
          {(cita.estado === "pendiente" || cita.estado === "aceptada") && (
            <TouchableOpacity
              style={[styles.btnVerDepa, styles.btnCancelar]}
              onPress={handleCancelarCita}
              disabled={cancelando}
            >
              <Text style={[styles.btnVerDepaTexto, styles.btnCancelarTexto]}>
                {cancelando ? "Cancelando..." : "Cancelar cita"}
              </Text>
            </TouchableOpacity>
          )}

          {esArrendador && cita.estado === "aceptada" && (
            <TouchableOpacity
              style={[styles.btnVerDepa, styles.btnIniciar]}
              onPress={handleIniciarRenta}
              disabled={iniciandoRenta}
            >
              <Text style={[styles.btnVerDepaTexto, styles.btnIniciarTexto]}>
                {iniciandoRenta ? "Iniciando renta..." : "Iniciar renta"}
              </Text>
            </TouchableOpacity>
          )}

          <Modal
            visible={confirmCancelar}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmCancelar(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalEmoji}>⚠️</Text>
                <Text style={styles.modalTitulo}>Confirmar cancelación</Text>
                <Text style={styles.modalTexto}>
                  ¿Seguro que deseas cancelar esta cita?
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setConfirmCancelar(false)}
                    disabled={cancelando}
                  >
                    <Text style={[styles.modalBtnTexto, styles.modalBtnCancelText]}>No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnDanger]}
                    onPress={performCancelarCita}
                    disabled={cancelando}
                  >
                    <Text style={styles.modalBtnTexto}>{cancelando ? "Cancelando..." : "Sí, cancelar"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={mostrarModalRenta}
            transparent
            animationType="fade"
            onRequestClose={() => setMostrarModalRenta(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalEmoji}>🏁</Text>
                <Text style={styles.modalTitulo}>Iniciar renta</Text>
                <Text style={styles.modalTexto}>
                  Registra este departamento como rentado para el solicitante.
                </Text>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Duración (meses)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={duracionMeses}
                    onChangeText={setDuracionMeses}
                    placeholder="1"
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Fecha de inicio</Text>
                  {Platform.OS === "web" ? (
                    <input
                      type="date"
                      value={fechaInicio.toISOString().slice(0, 10)}
                      onChange={(e: any) => {
                        if (e?.target?.value) {
                          setFechaInicio(new Date(e.target.value));
                        }
                      }}
                      style={{
                        backgroundColor: "#fafafa",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#d0d0d0",
                        borderStyle: "solid",
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        fontSize: 15,
                        color: "#1a1a1a",
                        width: "100%",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.modalInput}
                        onPress={() => setMostrarDatePicker(true)}
                      >
                        <Text style={styles.modalInputText}>{fechaInicioTexto}</Text>
                      </TouchableOpacity>

                      {mostrarDatePicker && (
                        <DateTimePicker
                          mode="date"
                          value={fechaInicio}
                          display="calendar"
                          onChange={handleFechaInicioChange}
                        />
                      )}
                    </>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setMostrarModalRenta(false)}
                    disabled={iniciandoRenta}
                  >
                    <Text style={[styles.modalBtnTexto, styles.modalBtnCancelText]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnDanger]}
                    onPress={performIniciarRenta}
                    disabled={iniciandoRenta}
                  >
                    <Text style={styles.modalBtnTexto}>
                      {iniciandoRenta ? "Iniciando..." : "Iniciar renta"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* Fecha y hora */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>📅 Fecha y hora</Text>
          <View style={styles.fechaGrid}>
            <View style={styles.fechaCard}>
              <Text style={styles.fechaIcono}>📆</Text>
              <Text style={styles.fechaLabel}>Fecha</Text>
              <Text style={styles.fechaValor}>{formatearFecha(cita.dia)}</Text>
            </View>
            <View style={styles.fechaCard}>
              <Text style={styles.fechaIcono}>🕐</Text>
              <Text style={styles.fechaLabel}>Horario</Text>
              <Text style={styles.fechaValor}>{cita.horario}</Text>
            </View>
          </View>
        </View>

        {/* Arrendatario */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>👤 Solicitante</Text>
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Nombre</Text>
            <Text style={styles.filaValor}>{cita.arrendatario_nombre}</Text>
          </View>
        </View>

        {/* Fecha de solicitud */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🗓 Solicitud</Text>
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Agendada el</Text>
            <Text style={styles.filaValor}>
              {new Date(cita.fecha_creacion).toLocaleDateString("es-MX", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  topBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e0dcd8", elevation: 2 },
  backEmoji: { fontSize: 17 },
  topTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  separador: { height: 1, backgroundColor: "#e0dcd8" },
  scroll:    { padding: 16 },

  estadoCard:  { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16, gap: 8 },
  estadoEmoji: { fontSize: 36 },
  estadoLabel: { fontSize: 16, fontWeight: "800", textAlign: "center" },

  seccion:      { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: "#e0dcd8" },
  seccionTitulo:{ fontSize: 15, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },

  filaInfo:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0ece8" },
  filaLabel: { fontSize: 13, color: "#aaa", fontWeight: "600" },
  filaValor: { fontSize: 13, color: "#1a1a1a", fontWeight: "700", flex: 1, textAlign: "right" },

  fechaGrid: { flexDirection: "row", gap: 10 },
  fechaCard: { flex: 1, backgroundColor: "#f0f4ff", borderRadius: 12, padding: 14, alignItems: "center", gap: 4 },
  fechaIcono:{ fontSize: 24 },
  fechaLabel:{ fontSize: 11, color: "#888", fontWeight: "600" },
  fechaValor:{ fontSize: 14, fontWeight: "800", color: "#1a3a8f", textAlign: "center" },

  btnVerDepa:     { marginTop: 12, backgroundColor: "#f0f4ff", borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "#1a3a8f" },
  btnVerDepaTexto:{ fontSize: 13, fontWeight: "700", color: "#1a3a8f" },
  btnCancelar:     { marginTop: 10, backgroundColor: "#fff1f1", borderColor: "#e63946" },
  btnCancelarTexto:{ color: "#e63946" },
  btnIniciar:      { marginTop: 10, backgroundColor: "#eaf8ed", borderColor: "#2f8a3a" },
  btnIniciarTexto: { color: "#1f5f21" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  modalField: { width: "100%", marginBottom: 14 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#444", marginBottom: 6 },
  modalInput: { width: "100%", borderWidth: 1, borderColor: "#d0d0d0", borderRadius: 12, backgroundColor: "#fafafa", paddingVertical: 12, paddingHorizontal: 14 },
  modalInputText: { fontSize: 14, color: "#1a1a1a" },
  modalBox: { width: "100%", maxWidth: 360, backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  modalEmoji: { fontSize: 34, marginBottom: 10 },
  modalTitulo: { fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 8, textAlign: "center" },
  modalTexto: { fontSize: 14, color: "#444", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  modalBtnDanger: { backgroundColor: "#e63946", borderColor: "#e63946" },
  modalBtnCancel: { backgroundColor: "#f0f0f0", borderColor: "#d0d0d0" },
  modalBtnTexto: { fontSize: 14, fontWeight: "800", color: "#fff" },
  modalBtnCancelText: { color: "#333" },

  vaciBox:   { flex: 1, alignItems: "center", justifyContent: "center" },
  vaciEmoji: { fontSize: 48, marginBottom: 12 },
  vaciTitulo:{ fontSize: 18, fontWeight: "800", color: "#333" },
});