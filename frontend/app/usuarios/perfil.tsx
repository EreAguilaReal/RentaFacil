import React, { useState } from "react";
import { useAuth } from "./../context/AuthContext";
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { URL_BASE } from "../../services/api";

const MEDIA_BASE = Platform.OS === "web"
  ? "http://localhost:8000/media/"
  : "http://192.168.1.84:8000/media/";

// ── Etiquetas ─────────────────────────────────────────────────────
const GENERO_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
  P: "Prefiero no decirlo",
};

const TIPO_LABEL: Record<string, string> = {
  admin:        "Administrador",
  arrendatario: "Arrendatario",
  arrendador:   "Arrendador",
};

// ── Componente fila de dato ───────────────────────────────────────
function FilaDato({ emoji, label, valor }: { emoji: string; label: string; valor: string }) {
  return (
    <View style={styles.filaRow}>
      <Text style={styles.filaEmoji}>{emoji}</Text>
      <View style={styles.filaTextos}>
        <Text style={styles.filaLabel}>{label}</Text>
        <Text style={styles.filaValor}>{valor}</Text>
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function Perfil() {
  const router = useRouter();
  const { logout, usuario, actualizarUsuario } = useAuth();
  const [iconActivo, setIconActivo] = useState<string>("perfil");

  if (!usuario) return null;

  const refrescarUsuario = async () => {
    try {
      const response = await fetch(`${URL_BASE}/usuarios/${usuario.id}/`);
      const data = await response.json();
      await actualizarUsuario(data);
    } catch (error) {
      console.log("Error al refrescar usuario:", error);
    }
  };

  const handleSubirDocumento = async () => {
    if (!usuario) return;
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (resultado.canceled) return;

      const archivo = resultado.assets[0];
      const formData = new FormData();
      formData.append("documento_verificacion", {
        uri:  archivo.uri,
        name: archivo.name,
        type: "application/pdf",
      } as any);

      const response = await fetch(
        `${URL_BASE}/usuarios/${usuario.id}/subir-documento/`,
        { method: "PATCH", body: formData }
      );

      if (!response.ok) {
        alert("Error al subir el documento");
        return;
      }

      await refrescarUsuario();
      alert("Documento subido. En espera de verificación.");

    } catch (error) {
      alert("No se pudo subir el documento");
    }
  };

  const handleEliminarDocumento = async () => {
    if (!usuario) return;
    try {
      const response = await fetch(
        `${URL_BASE}/usuarios/${usuario.id}/subir-documento/`,
        {
          method: "PATCH",
          body: JSON.stringify({ documento_verificacion: null }),
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        alert("Error al eliminar el documento");
        return;
      }
      await refrescarUsuario();
    } catch (error) {
      alert("No se pudo eliminar el documento");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topLogos}>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.ipn.mx")}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoTexto}>IPN</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.escom.ipn.mx")}>
            <View style={[styles.logoBadge, { backgroundColor: "#003366" }]}>
              <Text style={styles.logoTexto}>ESCOM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Barra de acciones ── */}
        <View style={styles.accionesBar}>
          <TouchableOpacity style={styles.accionBtn} onPress={() => router.back()}>
            <Text style={styles.accionEmoji}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accionBtn}>
            <Text style={styles.accionEmoji}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar y nombre ── */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCirculo}>
            <Text style={styles.avatarLetra}>
              {usuario.nombres.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nombreCompleto}>
            {usuario.nombres} {usuario.apellidos}
          </Text>
          <Text style={styles.nombreUsuario}>@{usuario.nombre_usuario}</Text>
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoTexto}>
              {TIPO_LABEL[usuario.tipo_usuario] ?? usuario.tipo_usuario}
            </Text>
          </View>
        </View>

        {/* ── Datos personales ── */}
        <View style={styles.seccionContainer}>
          <Text style={styles.seccionTitulo}>Información personal</Text>
          <FilaDato emoji="📧" label="Correo electrónico"   valor={usuario.correo_electronico} />
          <FilaDato emoji="🎂" label="Fecha de nacimiento"  valor={usuario.fecha_nacimiento} />
          <FilaDato emoji="⚧"  label="Género"               valor={GENERO_LABEL[usuario.genero] ?? usuario.genero} />
        </View>

        {/* ── Documento de verificación ── */}
        <View style={styles.seccionContainer}>
          <Text style={styles.seccionTitulo}>Verificación</Text>
          <View style={styles.docContainer}>
            {usuario.documento_verificacion ? (
              <View style={styles.docPendiente}>
                <Text style={styles.docEmoji}>⏳</Text>
                <Text style={styles.docTexto}>Documento en espera de verificación</Text>
                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={() => Linking.openURL(`${MEDIA_BASE}${usuario.documento_verificacion}`)}
                >
                  <Text style={styles.docBtnTexto}>📥 Ver documento</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.docBtn, { backgroundColor: "#e63946", marginTop: 8 }]}
                  onPress={handleEliminarDocumento}
                >
                  <Text style={styles.docBtnTexto}>🗑 Eliminar y subir nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.docPendiente}>
                <Text style={styles.docEmoji}>📄</Text>
                <Text style={styles.docTexto}>Sin documento cargado</Text>
                <TouchableOpacity style={styles.docBtn} onPress={handleSubirDocumento}>
                  <Text style={styles.docBtnTexto}>Subir documento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── Botón cerrar sesión ── */}
        <TouchableOpacity
          style={styles.cerrarSesionBtn}
          onPress={async () => {
            await logout();
            router.replace("/usuarios/login");
          }}
        >
          <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },

  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f7f4f0",
  },
  topLogos:  { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge: {
    backgroundColor: "#8B0000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoTexto: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  separador: { height: 1, backgroundColor: "#e0dcd8" },

  accionesBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accionBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  accionEmoji: { fontSize: 17 },

  avatarContainer: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  avatarCirculo: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#1a3a8f", justifyContent: "center", alignItems: "center",
    marginBottom: 12, shadowColor: "#1a3a8f", shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  avatarLetra:    { fontSize: 40, fontWeight: "900", color: "#fff" },
  nombreCompleto: { fontSize: 22, fontWeight: "900", color: "#1a1a1a" },
  nombreUsuario:  { fontSize: 14, color: "#888", fontWeight: "600", marginTop: 2 },
  tipoBadge: {
    backgroundColor: "#fde8ea", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 10,
  },
  tipoTexto: { fontSize: 13, fontWeight: "700", color: "#e63946" },

  seccionContainer: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  seccionTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },

  filaRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ece8",
  },
  filaEmoji:  { fontSize: 20, width: 28 },
  filaTextos: { flex: 1 },
  filaLabel:  { fontSize: 12, color: "#aaa", fontWeight: "600" },
  filaValor:  { fontSize: 15, color: "#333", fontWeight: "600", marginTop: 2 },

  docContainer: { paddingVertical: 8 },
  docPendiente: { alignItems: "center", gap: 8, paddingVertical: 8 },
  docEmoji: { fontSize: 28 },
  docTexto: { fontSize: 14, color: "#555", fontWeight: "600" },
  docBtn: {
    backgroundColor: "#1a3a8f", borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  docBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },

  cerrarSesionBtn: {
    backgroundColor: "#e63946", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    marginHorizontal: 16, marginBottom: 40, marginTop: 8,
  },
  cerrarSesionTexto: { color: "#fff", fontWeight: "900", fontSize: 15 },
});