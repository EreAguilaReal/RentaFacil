import { URL_BASE } from "../../services/api";
import { useAuth } from "../context/AuthContext";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { Linking, Image } from "react-native";

// ── Tipos ─────────────────────────────────────────────────────────
type Errores = { correo?: string; password?: string };

// ── Validaciones ──────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarForm(correo: string, password: string): Errores {
  const e: Errores = {};
  if (!correo.trim())
    e.correo = "El correo es obligatorio";
  else if (!EMAIL_REGEX.test(correo))
    e.correo = "Correo no válido";
  if (!password)
    e.password = "La contraseña es obligatoria";
  else if (password.length < 8)
    e.password = "Mínimo 8 caracteres";
  return e;
}

// ── Campo reutilizable ────────────────────────────────────────────
function Campo({
  label, emoji, placeholder, value, onChangeText, error,
  secureTextEntry, keyboardType,
}: {
  label: string; emoji: string; placeholder: string;
  value: string; onChangeText: (t: string) => void;
  error?: string; secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
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
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!error && <Text style={cs.errorTexto}>{error}</Text>}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [correo, setCorreo]     = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores]   = useState<Errores>({});
  const [cargando, setCargando] = useState(false);

  const limpiarError = (campo: keyof Errores) =>
    setErrores((e) => ({ ...e, [campo]: undefined }));

  const handleLogin = async () => {
  const e = validarForm(correo, password);
  if (Object.keys(e).length > 0) {
    setErrores(e);
    return;
  }
  setCargando(true);

  try {
    const response = await fetch(`${URL_BASE}/usuarios/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correo_electronico: correo,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrores({ correo: data.error ?? "Credenciales incorrectas" });
      return;
    }
    login(data);
    router.replace("/(tabs)");

    } catch (error) {
        setErrores({ correo: "No se pudo conectar con el servidor" });
    } finally {
        setCargando(false);
    }
};

  return (
    <SafeAreaView style={cs.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={cs.topBar}>
        <View style={cs.topLogos}>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.ipn.mx")}>
            <View style={cs.logoBadge}>
              <Text style={cs.logoTexto}>IPN</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.escom.ipn.mx")}>
            <View style={[cs.logoBadge, { backgroundColor: "#003366" }]}>
              <Text style={cs.logoTexto}>ESCOM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={cs.separador} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={cs.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Encabezado ── */}
          <View style={cs.encabezado}>
            <Image
              source={require("../assets/logoRentaFacil.png")}
              style={cs.logo}
              resizeMode="contain"
            />

            <Text style={cs.titulo}>Bienvenido</Text>
            <Text style={cs.subtitulo}>Inicia sesión para continuar</Text>
          </View>

          {/* ── Formulario ── */}
          <View style={cs.seccion}>
            <Campo
              label="Correo electrónico" emoji="📧"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChangeText={(t) => { setCorreo(t); limpiarError("correo"); }}
              keyboardType="email-address"
              error={errores.correo}
            />
            <Campo
              label="Contraseña" emoji="🔑"
              placeholder="Tu contraseña"
              value={password}
              onChangeText={(t) => { setPassword(t); limpiarError("password"); }}
              secureTextEntry
              error={errores.password}
            />
          </View>

          {/* ── Botón ingresar ── */}
          <TouchableOpacity
            style={[cs.btnPrimario, cargando && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={cargando}
          >
            <Text style={cs.btnPrimarioTexto}>
              {cargando ? "Ingresando..." : "Ingresar →"}
            </Text>
          </TouchableOpacity>

          {/* ── Crear cuenta ── */}
          <View style={cs.crearCuentaRow}>
            <Text style={cs.crearCuentaTexto}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push("/usuarios/registro")}>
              <Text style={cs.crearCuentaLink}> Regístrate</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  scroll:    { paddingHorizontal: 16, paddingBottom: 48 },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
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

  // Encabezado
  encabezado: { alignItems: "center", paddingVertical: 36 },
  avatarCirculo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#1a3a8f",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    shadowColor: "#1a3a8f", shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  avatarEmoji: { fontSize: 36 },
  titulo:    { fontSize: 28, fontWeight: "900", color: "#1a1a1a" },
  subtitulo: { fontSize: 14, color: "#888", marginTop: 4 },

  // Sección
  seccion: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Campos
  campoWrapper: { marginBottom: 14 },
  campoLabel:   { fontSize: 12, fontWeight: "700", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#f7f4f0",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a1a",
  },
  inputFocused: { borderColor: "#1a3a8f" },
  inputError:   { borderColor: "#e63946" },
  errorTexto:   { fontSize: 12, color: "#e63946", marginTop: 4, fontWeight: "600" },

  olvidaste:      { alignItems: "flex-end", marginTop: 4 },
  olvidasteTexto: { fontSize: 12, color: "#1a3a8f", fontWeight: "700" },

  // Botones
  btnPrimario: {
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  btnPrimarioTexto: { color: "#fff", fontWeight: "900", fontSize: 15 },

  crearCuentaRow:   { flexDirection: "row", justifyContent: "center" },
  crearCuentaTexto: { fontSize: 14, color: "#888" },
  crearCuentaLink:  { fontSize: 14, color: "#1a3a8f", fontWeight: "800" },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
    alignSelf: "center",
  },
});