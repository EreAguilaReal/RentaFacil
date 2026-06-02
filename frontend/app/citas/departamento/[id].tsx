import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { URL_BASE } from "../../../services/api";

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

export default function CitasPorDepartamento() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const departamentoId = Number(Array.isArray(id) ? id[0] : id);
  const esIdValido = Number.isInteger(departamentoId) && departamentoId > 0;

  const [citas, setCitas]       = useState<Cita[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const { usuario } = useAuth();
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!esIdValido) {
      setCargando(false);
      return;
    }

    fetch(`${URL_BASE}/citas/departamento/${departamentoId}/`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => { setCitas(Array.isArray(data) ? data : []); setCargando(false); })
      .catch(() => setCargando(false));
  }, [departamentoId, esIdValido]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#1a3a8f" size="large" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!esIdValido) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.vaciBox}>
          <Text style={styles.vaciEmoji}>⚠️</Text>
          <Text style={styles.vaciTitulo}>ID de departamento inválido</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!citas || citas.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backEmoji}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topTitulo}>Citas del departamento</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.separador} />
        <View style={styles.vaciBox}>
          <Text style={styles.vaciEmoji}>📭</Text>
          <Text style={styles.vaciTitulo}>No hay citas para este departamento.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Citas del departamento</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {citas.map((cita) => {
          const cfg = ESTADO_CONFIG[cita.estado] ?? ESTADO_CONFIG.pendiente;
          const esArrendador = usuario?.tipo_usuario === "arrendador";

          const responder = async (accion: "aceptar" | "rechazar") => {
            if (processingId) return;
            setProcessingId(cita.id);
            try {
              const r = await fetch(`${URL_BASE}/citas/${cita.id}/responder/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accion }),
              });
              if (!r.ok) throw new Error();
              const data = await r.json();
              setCitas(prev => prev ? prev.map(c => c.id === data.id ? data : c) : prev);
            } catch {
              // ignore for now
            } finally {
              setProcessingId(null);
            }
          };

          return (
            <View key={cita.id} style={styles.citaCard}>
              <View style={[styles.estadoCard, { backgroundColor: cfg.bg }]}> 
                <Text style={[styles.estadoLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text style={styles.citaTitulo}>{cita.arrendatario_nombre}</Text>
              <Text style={styles.citaSub}>{cita.dia} · {cita.horario}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/citas/${cita.id}` as any)}
                >
                  <Text style={styles.btnVerDepaTexto}>Ver cita →</Text>
                </TouchableOpacity>

                {esArrendador && cita.estado === "pendiente" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionAccept]}
                      onPress={() => responder("aceptar")}
                      disabled={processingId === cita.id}
                    >
                      <Text style={styles.actionAcceptText}>{processingId === cita.id ? "..." : "Aceptar"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionReject]}
                      onPress={() => responder("rechazar")}
                      disabled={processingId === cita.id}
                    >
                      <Text style={styles.actionRejectText}>{processingId === cita.id ? "..." : "Rechazar"}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
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

  estadoCard:  { borderRadius: 16, padding: 14, marginBottom: 10, alignItems: "center" },
  estadoLabel: { fontSize: 13, fontWeight: "800", textAlign: "center" },

  citaCard: { marginBottom: 14, padding: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0dcd8", elevation: 2 },
  citaTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 6 },
  citaSub:   { fontSize: 14, color: "#555", marginBottom: 10 },
  btnVerDepaTexto: { fontSize: 13, fontWeight: "700", color: "#1a3a8f" },

  actionsRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "transparent" },
  actionAccept: { backgroundColor: "#e6f8ec", borderWidth: 1, borderColor: "#c6efd1" },
  actionReject: { backgroundColor: "#fff5f5", borderWidth: 1, borderColor: "#f5c6c6" },
  actionAcceptText: { color: "#14532d", fontWeight: "800" },
  actionRejectText: { color: "#7a0000", fontWeight: "800" },

  vaciBox:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  vaciEmoji: { fontSize: 48, marginBottom: 12 },
  vaciTitulo:{ fontSize: 18, fontWeight: "800", color: "#333", textAlign: "center" },
});