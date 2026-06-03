// app/departamento/[id]/calificar.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "./../context/AuthContext";
import { URL_BASE } from "./../../services/api";

const ASPECTOS = [
  { clave: "limpieza",     emoji: "🧹", label: "Limpieza" },
  { clave: "seguridad",    emoji: "🔐", label: "Seguridad" },
  { clave: "ubicacion",    emoji: "📍", label: "Ubicación" },
  { clave: "arrendador",   emoji: "🤝", label: "Trato del arrendador" },
  { clave: "precio",       emoji: "💰", label: "Precio justo" },
  { clave: "infraestructura", emoji: "🏗️", label: "Infraestructura" },
];

function Estrella({ llena, onPress }: { llena: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 4 }}>
      <Text style={{ fontSize: 36, color: llena ? "#f4a500" : "#ddd" }}>★</Text>
    </TouchableOpacity>
  );
}

export default function CalificarPantalla() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();

  const [calificacion, setCalificacion] = useState(0);
  const [aspectos, setAspectos]         = useState<string[]>([]);
  const [comentario, setComentario]     = useState("");
  const [enviando, setEnviando]         = useState(false);
  const [modalOk, setModalOk]           = useState(false);
  const [error, setError]               = useState("");

  const toggleAspecto = (clave: string) =>
    setAspectos(prev =>
      prev.includes(clave) ? prev.filter(a => a !== clave) : [...prev, clave]
    );

  const puedeEnviar = calificacion >= 1;

  const handleEnviar = async () => {
    if (!usuario || !puedeEnviar) return;
    setEnviando(true);
    setError("");
    try {
      const r = await fetch(`${URL_BASE}/departamentos/${id}/calificaciones/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrendatario: usuario.id,
          departamento: Number(id),
          calificacion,
          aspectos_positivos: aspectos,
          comentario: comentario.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      setModalOk(true);
    } catch {
      setError("No se pudo enviar la calificación. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const etiquetaEstrellas = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Modal éxito */}
      <Modal visible={modalOk} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalEmoji}>⭐</Text>
            <Text style={styles.modalTitulo}>¡Gracias por calificar!</Text>
            <Text style={styles.modalTexto}>
              Tu calificación ayuda a otros estudiantes a elegir mejor.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setModalOk(false); router.back(); }}
            >
              <Text style={styles.modalBtnTexto}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
          <Text style={styles.btnBackTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Calificar departamento</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Estrellas */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>¿Cómo calificarías tu experiencia?</Text>
          <View style={styles.estrellasRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <Estrella key={n} llena={n <= calificacion} onPress={() => setCalificacion(n)} />
            ))}
          </View>
          {calificacion > 0 && (
            <Text style={styles.etiquetaEstrellas}>{etiquetaEstrellas[calificacion]}</Text>
          )}
        </View>

        {/* Aspectos positivos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>¿Qué destacarías? (opcional)</Text>
          <View style={styles.aspectosGrid}>
            {ASPECTOS.map((a) => (
              <TouchableOpacity
                key={a.clave}
                style={[styles.aspectoChip, aspectos.includes(a.clave) && styles.aspectoChipActivo]}
                onPress={() => toggleAspecto(a.clave)}
              >
                <Text style={styles.aspectoEmoji}>{a.emoji}</Text>
                <Text style={[styles.aspectoTexto, aspectos.includes(a.clave) && styles.aspectoTextoActivo]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comentario */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Comentario (opcional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Comparte tu experiencia para ayudar a otros estudiantes..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={4}
            value={comentario}
            onChangeText={setComentario}
            textAlignVertical="top"
          />
        </View>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTexto}>⚠ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnEnviar, !puedeEnviar && styles.btnEnviarDeshabilitado]}
          onPress={handleEnviar}
          disabled={!puedeEnviar || enviando}
        >
          {enviando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnEnviarTexto}>★ Enviar calificación</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f7f4f0" },
  topBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  btnBack:      { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e0dcd8", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  btnBackTexto: { fontSize: 17 },
  topTitulo:    { fontSize: 17, fontWeight: "900", color: "#1a1a1a" },
  separador:    { height: 1, backgroundColor: "#e0dcd8" },

  seccion:       { backgroundColor: "#fff", borderRadius: 18, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  seccionTitulo: { fontSize: 15, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },

  estrellasRow:     { flexDirection: "row", justifyContent: "center", gap: 4, marginVertical: 8 },
  etiquetaEstrellas:{ textAlign: "center", fontSize: 15, fontWeight: "700", color: "#f4a500", marginTop: 4 },

  aspectosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  aspectoChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#e0dcd8", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#f7f4f0", minWidth: "47%", flex: 1,
  },
  aspectoChipActivo: { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  aspectoEmoji:       { fontSize: 18 },
  aspectoTexto:       { fontSize: 12, fontWeight: "700", color: "#333" },
  aspectoTextoActivo: { color: "#fff" },

  textArea:    { borderWidth: 1, borderColor: "#e0dcd8", borderRadius: 12, padding: 12, fontSize: 14, color: "#1a1a1a", minHeight: 100, backgroundColor: "#f7f4f0" },

  errorBox:   { backgroundColor: "#fde8ea", borderRadius: 12, padding: 12 },
  errorTexto: { color: "#e63946", fontWeight: "700", fontSize: 13 },

  btnEnviar:              { backgroundColor: "#1a3a8f", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 40 },
  btnEnviarDeshabilitado: { backgroundColor: "#9baed4" },
  btnEnviarTexto:         { color: "#fff", fontWeight: "900", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  modalBox:     { backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center", width: "100%", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalEmoji:   { fontSize: 40, marginBottom: 12 },
  modalTitulo:  { fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 8 },
  modalTexto:   { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalBtn:     { backgroundColor: "#1a3a8f", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  modalBtnTexto:{ color: "#fff", fontWeight: "800", fontSize: 14 },
});