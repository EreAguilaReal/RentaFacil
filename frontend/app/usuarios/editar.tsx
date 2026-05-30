import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { URL_BASE } from "../../services/api";
import { styles } from "./perfil";

// ── Tipos ─────────────────────────────────────────────────────────
type Errores = {
  nombres?: string;
  apellidos?: string;
  nombre_usuario?: string;
  fecha_nacimiento?: string;
  genero?: string;
};

// ── Opciones ──────────────────────────────────────────────────────
const GENEROS = [
  { key: "M", label: "Masculino",           emoji: "👨" },
  { key: "F", label: "Femenino",            emoji: "👩" },
  { key: "O", label: "Otro",                emoji: "🧑" },
  { key: "P", label: "Prefiero no decirlo", emoji: "🤐" },
];

// ── Validaciones ──────────────────────────────────────────────────
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validarForm(data: typeof FORM_VACIO): Errores {
  const e: Errores = {};

  if (!data.nombres.trim())
    e.nombres = "El nombre es obligatorio";

  if (!data.apellidos.trim())
    e.apellidos = "Los apellidos son obligatorios";

  if (!data.nombre_usuario.trim())
    e.nombre_usuario = "El nombre de usuario es obligatorio";
  else if (data.nombre_usuario.length < 4)
    e.nombre_usuario = "Mínimo 4 caracteres";
  else if (!/^[a-zA-Z0-9_]+$/.test(data.nombre_usuario))
    e.nombre_usuario = "Solo letras, números y guión bajo";

  if (!data.fecha_nacimiento)
    e.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
  else if (!FECHA_REGEX.test(data.fecha_nacimiento))
    e.fecha_nacimiento = "Formato: AAAA-MM-DD";
  else {
    const fecha = new Date(data.fecha_nacimiento);
    const edad  = new Date().getFullYear() - fecha.getFullYear();
    if (isNaN(fecha.getTime()))
      e.fecha_nacimiento = "Fecha no válida";
    else if (edad < 18)
      e.fecha_nacimiento = "Debes tener al menos 18 años";
    else if (edad > 100)
      e.fecha_nacimiento = "Fecha no válida";
  }

  if (!data.genero)
    e.genero = "Selecciona un género";

  return e;
}

// ── Subcomponente Campo ───────────────────────────────────────────
function Campo({
  label, emoji, placeholder, value, onChangeText, error, autoCapitalize,
}: {
  label: string; emoji: string; placeholder: string;
  value: string; onChangeText: (t: string) => void;
  error?: string; autoCapitalize?: "none" | "sentences" | "words";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={cs.campoWrapper}>
      <Text style={cs.campoLabel}>{emoji}  {label}</Text>
      <TextInput
        style={[cs.input, focused && cs.inputFocused, !!error && cs.inputError]}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? "sentences"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!error && <Text style={cs.errorTexto}>{error}</Text>}
    </View>
  );
}

// ── Valor vacío (se usa solo para inferir el tipo) ────────────────
const FORM_VACIO = {
  nombres: "",
  apellidos: "",
  nombre_usuario: "",
  fecha_nacimiento: "",
  genero: "",
};

// ── Pantalla principal ────────────────────────────────────────────
export default function Editar() {
  const router = useRouter();
  const { usuario, actualizarUsuario } = useAuth();

  const [form, setForm] = useState({
    nombres:          usuario?.nombres          ?? "",
    apellidos:        usuario?.apellidos        ?? "",
    nombre_usuario:   usuario?.nombre_usuario   ?? "",
    fecha_nacimiento: usuario?.fecha_nacimiento ?? "",
    genero:           usuario?.genero           ?? "",
  });

  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

  if (!usuario) return null;

  const set = (campo: keyof typeof form) => (valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const handleGuardar = async () => {
    const e = validarForm(form);
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return;
    }
    setGuardando(true);
    try {
      const response = await fetch(`${URL_BASE}/usuarios/${usuario.id}/editar/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error ?? "Error al guardar");
        return;
      }

      await actualizarUsuario(form);
      alert("Datos actualizados correctamente");
      router.back();

    } catch (error) {
      alert("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={cs.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={cs.topBar}>
        <TouchableOpacity style={cs.accionBtn} onPress={() => router.push("/usuarios/perfil")}>
          <Text style={cs.accionEmoji}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={cs.separador} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={cs.scroll}
        >
          <Text style={cs.titulo}>Editar datos</Text>
          <Text style={cs.subtitulo}>Modifica tu información personal</Text>

          {/* ── Datos personales ── */}
          <View style={cs.seccion}>
            <Text style={cs.seccionTitulo}>Datos personales</Text>

            <Campo label="Nombres" emoji="👤" placeholder="Ej. Juan Carlos"
              value={form.nombres} onChangeText={set("nombres")}
              error={errores.nombres} autoCapitalize="words" />

            <Campo label="Apellidos" emoji="👤" placeholder="Ej. García López"
              value={form.apellidos} onChangeText={set("apellidos")}
              error={errores.apellidos} autoCapitalize="words" />

            {/* ── Fecha de nacimiento ── */}
            <View style={cs.campoWrapper}>
              <Text style={cs.campoLabel}>🎂  Fecha de nacimiento</Text>
              <View style={[cs.input, cs.inputDeshabilitado]}>
                <Text style={cs.inputDeshabilitadoTexto}>{usuario.fecha_nacimiento}</Text>
              </View>
              <Text style={cs.ayudaTexto}>La fecha de nacimiento no puede modificarse</Text>
            </View>

            {/* ── Género ── */}
            <View style={cs.campoWrapper}>
              <Text style={cs.campoLabel}>⚧  Género</Text>
              <View style={cs.opcionesGrid}>
                {GENEROS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[cs.opcionBtn, form.genero === g.key && cs.opcionBtnActivo]}
                    onPress={() => set("genero")(g.key)}
                  >
                    <Text style={cs.opcionEmoji}>{g.emoji}</Text>
                    <Text style={[cs.opcionLabel, form.genero === g.key && cs.opcionLabelActivo]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errores.genero && <Text style={cs.errorTexto}>{errores.genero}</Text>}
            </View>
          </View>

          {/* ── Datos de cuenta ── */}
          <View style={cs.seccion}>
            <Text style={cs.seccionTitulo}>Datos de cuenta</Text>

            <Campo label="Nombre de usuario" emoji="🪪" placeholder="Ej. juan_garcia"
              value={form.nombre_usuario} onChangeText={set("nombre_usuario")}
              error={errores.nombre_usuario} autoCapitalize="none" />

            {/* Correo y tipo no son editables */}
            <View style={cs.campoWrapper}>
              <Text style={cs.campoLabel}>📧  Correo electrónico</Text>
              <View style={[cs.input, cs.inputDeshabilitado]}>
                <Text style={cs.inputDeshabilitadoTexto}>{usuario.correo_electronico}</Text>
              </View>
              <Text style={cs.ayudaTexto}>El correo no puede modificarse</Text>
            </View>

            <View style={cs.campoWrapper}>
              <Text style={cs.campoLabel}>🏷  Tipo de usuario</Text>
              <View style={[cs.input, cs.inputDeshabilitado]}>
                <Text style={cs.inputDeshabilitadoTexto}>{usuario.tipo_usuario}</Text>
              </View>
              <Text style={cs.ayudaTexto}>El tipo de usuario no puede modificarse</Text>
            </View>
          </View>

          {/* ── Botón guardar ── */}
          <TouchableOpacity
            style={[cs.btnPrimario, guardando && { opacity: 0.6 }]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            <Text style={cs.btnPrimarioTexto}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={cs.linkCancelar} onPress={() => router.back()}>
            <Text style={cs.linkCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  scroll:    { paddingHorizontal: 16, paddingBottom: 48 },

  topBar: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 10,
  },
  accionBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  accionEmoji: { fontSize: 17 },
  topLogos:    { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge:   { backgroundColor: "#8B0000", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  logoTexto:   { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  separador:   { height: 1, backgroundColor: "#e0dcd8" },

  titulo:    { fontSize: 26, fontWeight: "900", color: "#1a1a1a", marginTop: 24, marginBottom: 4 },
  subtitulo: { fontSize: 14, color: "#888", marginBottom: 20 },

  seccion: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  seccionTitulo: { fontSize: 15, fontWeight: "800", color: "#1a1a1a", marginBottom: 14 },

  campoWrapper: { marginBottom: 14 },
  campoLabel:   { fontSize: 12, fontWeight: "700", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#f7f4f0", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e0dcd8",
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1a1a1a",
  },
  inputFocused: { borderColor: "#1a3a8f" },
  inputError:   { borderColor: "#e63946" },
  errorTexto:   { fontSize: 12, color: "#e63946", marginTop: 4, fontWeight: "600" },
  ayudaTexto:   { fontSize: 11, color: "#aaa", marginTop: 4 },

  inputDeshabilitado:      { backgroundColor: "#ece9e6", borderColor: "#ddd" },
  inputDeshabilitadoTexto: { fontSize: 15, color: "#aaa" },

  opcionesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opcionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#f7f4f0", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  opcionBtnActivo:   { backgroundColor: "#eef1fb", borderColor: "#1a3a8f" },
  opcionEmoji:       { fontSize: 16 },
  opcionLabel:       { fontSize: 13, fontWeight: "600", color: "#555" },
  opcionLabelActivo: { color: "#1a3a8f" },

  btnPrimario: {
    backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  btnPrimarioTexto: { color: "#fff", fontWeight: "900", fontSize: 15 },
  linkCancelar:     { alignItems: "center", marginTop: 16, marginBottom: 8 },
  linkCancelarTexto:{ fontSize: 13, color: "#e63946", fontWeight: "700" },
});