// app/departamento/[id]/reporte.tsx
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

const CATEGORIAS = [
  { clave: "mantenimiento", emoji: "🔧", label: "Mantenimiento" },
  { clave: "ruido",         emoji: "🔊", label: "Ruido excesivo" },
  { clave: "seguridad",     emoji: "🔐", label: "Seguridad" },
  { clave: "limpieza",      emoji: "🧹", label: "Limpieza" },
  { clave: "servicios",     emoji: "💡", label: "Servicios (agua, luz…)" },
  { clave: "otro",          emoji: "📋", label: "Otro" },
];

export default function ReportePantalla() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();

  const [categoria, setCategoria]   = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando]     = useState(false);
  const [modalOk, setModalOk]       = useState(false);
  const [error, setError]           = useState("");

  const puedeEnviar = categoria !== "" && descripcion.trim().length >= 10;

  const handleEnviar = async () => {
    if (!usuario || !puedeEnviar) return;
    setEnviando(true);
    setError("");
    try {
      const r = await fetch(`${URL_BASE}/departamentos/${id}/reportes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrendatario: usuario.id,
          departamento: Number(id),
          categoria,
          descripcion: descripcion.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      setModalOk(true);
    } catch {
      setError("No se pudo enviar el reporte. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Modal éxito */}
      <Modal visible={modalOk} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalEmoji}>✅</Text>
            <Text style={styles.modalTitulo}>Reporte enviado</Text>
            <Text style={styles.modalTexto}>
              Tu reporte fue enviado correctamente. El administrador lo revisará pronto.
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
        <Text style={styles.topTitulo}>Reportar problema</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Categoría */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>¿Qué tipo de problema es?</Text>
          <View style={styles.categoriasGrid}>
            {CATEGORIAS.map((c) => (
              <TouchableOpacity
                key={c.clave}
                style={[styles.categoriaChip, categoria === c.clave && styles.categoriaChipActivo]}
                onPress={() => setCategoria(c.clave)}
              >
                <Text style={styles.categoriaEmoji}>{c.emoji}</Text>
                <Text style={[styles.categoriaTexto, categoria === c.clave && styles.categoriaTextoActivo]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Descripción del problema</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe con detalle el problema que estás experimentando..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={5}
            value={descripcion}
            onChangeText={setDescripcion}
            textAlignVertical="top"
          />
          <Text style={[styles.contadorTexto, descripcion.trim().length < 10 && { color: "#e63946" }]}>
            {descripcion.trim().length} / mín. 10 caracteres
          </Text>
        </View>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTexto}>⚠ {error}</Text>
          </View>
        )}

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.btnEnviar, !puedeEnviar && styles.btnEnviarDeshabilitado]}
          onPress={handleEnviar}
          disabled={!puedeEnviar || enviando}
        >
          {enviando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnEnviarTexto}>⚠ Enviar reporte</Text>
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

  categoriasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoriaChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#e0dcd8", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#f7f4f0", minWidth: "47%", flex: 1,
  },
  categoriaChipActivo: { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  categoriaEmoji:       { fontSize: 18 },
  categoriaTexto:       { fontSize: 13, fontWeight: "700", color: "#333" },
  categoriaTextoActivo: { color: "#fff" },

  textArea:       { borderWidth: 1, borderColor: "#e0dcd8", borderRadius: 12, padding: 12, fontSize: 14, color: "#1a1a1a", minHeight: 120, backgroundColor: "#f7f4f0" },
  contadorTexto:  { fontSize: 11, color: "#aaa", marginTop: 6, textAlign: "right" },

  errorBox:   { backgroundColor: "#fde8ea", borderRadius: 12, padding: 12 },
  errorTexto: { color: "#e63946", fontWeight: "700", fontSize: 13 },

  btnEnviar:              { backgroundColor: "#e63946", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 40 },
  btnEnviarDeshabilitado: { backgroundColor: "#f0aaae" },
  btnEnviarTexto:         { color: "#fff", fontWeight: "900", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  modalBox:     { backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center", width: "100%", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalEmoji:   { fontSize: 40, marginBottom: 12 },
  modalTitulo:  { fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 8 },
  modalTexto:   { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalBtn:     { backgroundColor: "#1a3a8f", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  modalBtnTexto:{ color: "#fff", fontWeight: "800", fontSize: 14 },
});