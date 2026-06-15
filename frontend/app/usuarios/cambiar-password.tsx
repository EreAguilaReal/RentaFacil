// app/usuarios/cambiar-password.tsx
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { URL_BASE } from "../../services/api";

function CampoPassword({
  label, valor, onChange, mostrar, onToggle, error,
}: {
  label: string; valor: string; onChange: (v: string) => void;
  mostrar: boolean; onToggle: () => void; error?: string;
}) {
  return (
    <View style={styles.campoContainer}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={[styles.campoFila, error ? styles.campoError : null]}>
        <TextInput
          style={styles.campoInput}
          value={valor}
          onChangeText={onChange}
          secureTextEntry={!mostrar}
          placeholder="••••••••"
          placeholderTextColor="#ccc"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"          // ← agregar
          textContentType="none"      // ← agregar (iOS)
          importantForAutofill="no"   // ← agregar (Android)
        />
        <TouchableOpacity onPress={onToggle} style={styles.campoOjo}>
          <Text style={styles.campoOjoTexto}>{mostrar ? "🙈" : "👁"}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.campoErrorTexto}>{error}</Text> : null}
    </View>
  );
}

export default function CambiarPassword() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [actual,        setActual]        = useState("");
  const [nueva,         setNueva]         = useState("");
  const [confirmar,     setConfirmar]     = useState("");
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva,  setMostrarNueva]  = useState(false);
  const [mostrarConf,   setMostrarConf]   = useState(false);
  const [guardando,     setGuardando]     = useState(false);

  const [errores, setErrores] = useState<{
    actual?: string; nueva?: string; confirmar?: string;
  }>({});

  const validar = () => {
    const e: typeof errores = {};
    if (!actual.trim())          e.actual    = "Ingresa tu contraseña actual";
    if (nueva.length < 8)        e.nueva     = "Mínimo 8 caracteres";
    if (nueva === actual)        e.nueva     = "La nueva contraseña debe ser diferente";
    if (nueva !== confirmar)     e.confirmar = "Las contraseñas no coinciden";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar() || !usuario) return;
    setGuardando(true);
    try {
      const res  = await fetch(`${URL_BASE}/usuarios/${usuario.id}/cambiar-password/`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password_actual: actual, password_nueva: nueva }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("actual")) {
          setErrores({ actual: data.error });
        } else {
          setErrores({ nueva: data.error });
        }
        return;
      }

      if (Platform.OS === "web") {
        window.alert("Contraseña actualizada correctamente");
      } else {
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
      }
      router.back();

    } catch {
      if (Platform.OS === "web") {
        window.alert("No se pudo actualizar la contraseña");
      } else {
        Alert.alert("Error", "No se pudo actualizar la contraseña");
      }
    } finally {
      setGuardando(false);
    }
  };

  // Indicador de fortaleza
  const fortaleza = () => {
    if (!nueva) return null;
    if (nueva.length < 8)  return { texto: "Débil",   color: "#e63946" };
    if (nueva.length < 12) return { texto: "Media",   color: "#f4a261" };
    return                        { texto: "Fuerte",  color: "#2a9d8f" };
  };
  const f = fortaleza();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Cambiar contraseña</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        onStartShouldSetResponder={() => true}
      >
        {/* Ícono */}
        <View style={styles.iconoContainer}>
          <View style={styles.iconoCirculo}>
            <Text style={styles.iconoEmoji}>🔒</Text>
          </View>
          <Text style={styles.iconoDesc}>
            Tu contraseña debe tener al menos 8 caracteres
          </Text>
        </View>

        {/* Campos */}
        <View style={styles.seccion}>
          <CampoPassword
            label="Contraseña actual"
            valor={actual}
            onChange={v => { setActual(v); setErrores(e => ({ ...e, actual: undefined })); }}
            mostrar={mostrarActual}
            onToggle={() => setMostrarActual(p => !p)}
            error={errores.actual}
          />

          <View style={styles.divisor} />

          <CampoPassword
            label="Nueva contraseña"
            valor={nueva}
            onChange={v => { setNueva(v); setErrores(e => ({ ...e, nueva: undefined })); }}
            mostrar={mostrarNueva}
            onToggle={() => setMostrarNueva(p => !p)}
            error={errores.nueva}
          />

          {/* Indicador fortaleza */}
          {f && (
            <View style={styles.fortalezaFila}>
              <View style={styles.fortalezaBarras}>
                {["Débil", "Media", "Fuerte"].map((n, i) => (
                  <View
                    key={n}
                    style={[
                      styles.fortalezaBarra,
                      {
                        backgroundColor:
                          (f.texto === "Débil"  && i === 0) ||
                          (f.texto === "Media"  && i <= 1) ||
                          (f.texto === "Fuerte" && i <= 2)
                            ? f.color : "#e0dcd8",
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.fortalezaTexto, { color: f.color }]}>{f.texto}</Text>
            </View>
          )}

          <View style={styles.divisor} />

          <CampoPassword
            label="Confirmar nueva contraseña"
            valor={confirmar}
            onChange={v => { setConfirmar(v); setErrores(e => ({ ...e, confirmar: undefined })); }}
            mostrar={mostrarConf}
            onToggle={() => setMostrarConf(p => !p)}
            error={errores.confirmar}
          />
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={guardando}
        >
          {guardando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnGuardarTexto}>Actualizar contraseña</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f4f0" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  backTexto:     { fontSize: 18 },
  headerTitulo:  { fontSize: 18, fontWeight: "900", color: "#1a1a1a" },
  separador:     { height: 1, backgroundColor: "#e0dcd8" },
  scroll:        { padding: 16, paddingBottom: 40 },

  iconoContainer: { alignItems: "center", paddingVertical: 28, gap: 12 },
  iconoCirculo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#eef1fb", justifyContent: "center", alignItems: "center",
  },
  iconoEmoji: { fontSize: 36 },
  iconoDesc:  { fontSize: 13, color: "#aaa", fontWeight: "600", textAlign: "center" },

  seccion: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    gap: 4,
  },
  divisor: { height: 1, backgroundColor: "#f0ece8", marginVertical: 8 },

  campoContainer: { gap: 6 },
  campoLabel:     { fontSize: 12, fontWeight: "700", color: "#888" },
  campoFila: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f7f4f0", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  campoError:      { borderColor: "#e63946" },
  campoInput:      { flex: 1, padding: 14, fontSize: 15, color: "#1a1a1a" },
  campoOjo:        { paddingHorizontal: 14 },
  campoOjoTexto:   { fontSize: 18 },
  campoErrorTexto: { fontSize: 12, color: "#e63946", fontWeight: "600" },

  fortalezaFila:  { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  fortalezaBarras:{ flex: 1, flexDirection: "row", gap: 4 },
  fortalezaBarra: { flex: 1, height: 4, borderRadius: 2 },
  fortalezaTexto: { fontSize: 12, fontWeight: "700", width: 44, textAlign: "right" },

  btnGuardar: {
    backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    marginTop: 24,
  },
  btnGuardarTexto: { color: "#fff", fontWeight: "900", fontSize: 15 },
});