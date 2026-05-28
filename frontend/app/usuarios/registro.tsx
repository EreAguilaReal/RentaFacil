import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// ── Tipos ─────────────────────────────────────────────────────────
type TipoUsuario = "arrendatario" | "arrendador" | "";
type Errores = Partial<Record<keyof FormData, string>>;

interface FormData {
  correo_electronico: string;
  password: string;
  confirmar_password: string;
  nombre_usuario: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  tipo_usuario: TipoUsuario;
}

// ── Opciones ──────────────────────────────────────────────────────
const GENEROS = [
  { key: "M", label: "Masculino",          emoji: "👨" },
  { key: "F", label: "Femenino",           emoji: "👩" },
  { key: "O", label: "Otro",               emoji: "🧑" },
  { key: "P", label: "Prefiero no decirlo",emoji: "🤐" },
];

const TIPOS_USUARIO = [
  { key: "arrendatario", label: "Arrendatario", emoji: "🎓", desc: "Busco un departamento" },
  { key: "arrendador",   label: "Arrendador",   emoji: "🏠", desc: "Tengo un departamento" },
];

const DOCS_ARRENDATARIO = [
  { key: "credencial",    label: "Credencial",               emoji: "🪪" },
  { key: "inscripcion",   label: "Comprobante de inscripción",emoji: "📋" },
  { key: "constancia",    label: "Constancia de estudios",    emoji: "📜" },
];

// ── Validaciones ──────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validarForm(data: FormData): Errores {
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

  if (!data.correo_electronico.trim())
    e.correo_electronico = "El correo es obligatorio";
  else if (!EMAIL_REGEX.test(data.correo_electronico))
    e.correo_electronico = "Correo no válido";

  if (!data.password)
    e.password = "La contraseña es obligatoria";
  else if (data.password.length < 8)
    e.password = "Mínimo 8 caracteres";
  else if (!/[A-Z]/.test(data.password))
    e.password = "Debe incluir al menos una mayúscula";
  else if (!/[0-9]/.test(data.password))
    e.password = "Debe incluir al menos un número";

  if (!data.confirmar_password)
    e.confirmar_password = "Confirma tu contraseña";
  else if (data.password !== data.confirmar_password)
    e.confirmar_password = "Las contraseñas no coinciden";

  if (!data.fecha_nacimiento)
    e.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
  else if (!FECHA_REGEX.test(data.fecha_nacimiento))
    e.fecha_nacimiento = "Formato: AAAA-MM-DD";
  else {
    const fecha = new Date(data.fecha_nacimiento);
    const hoy   = new Date();
    const edad  = hoy.getFullYear() - fecha.getFullYear();
    if (isNaN(fecha.getTime()))
      e.fecha_nacimiento = "Fecha no válida";
    else if (edad < 18)
      e.fecha_nacimiento = "Debes tener al menos 18 años";
    else if (edad > 100)
      e.fecha_nacimiento = "Fecha no válida";
  }

  if (!data.genero)
    e.genero = "Selecciona un género";

  if (!data.tipo_usuario)
    e.tipo_usuario = "Selecciona un tipo de usuario";

  return e;
}

// ── Subcomponentes ────────────────────────────────────────────────
function Campo({
  label, emoji, placeholder, value, onChangeText, error,
  secureTextEntry, keyboardType, autoCapitalize,
}: {
  label: string; emoji: string; placeholder: string;
  value: string; onChangeText: (t: string) => void;
  error?: string; secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
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
        autoCapitalize={autoCapitalize ?? "sentences"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!error && <Text style={cs.errorTexto}>{error}</Text>}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
const FORM_INICIAL: FormData = {
  correo_electronico: "",
  password: "",
  confirmar_password: "",
  nombre_usuario: "",
  nombres: "",
  apellidos: "",
  fecha_nacimiento: "",
  genero: "",
  tipo_usuario: "",
};

export default function Registro() {
  const router = useRouter();

  const [form, setForm]           = useState<FormData>(FORM_INICIAL);
  const [errores, setErrores]     = useState<Errores>({});
  const [modalDoc, setModalDoc]   = useState(false);
  const [docElegido, setDocElegido] = useState<string>("");
  const [enviando, setEnviando]   = useState(false);

  const set = (campo: keyof FormData) => (valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const handleRegistrar = () => {
    const e = validarForm(form);
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return;
    }
    // Abrir modal de documento
    setDocElegido("");
    setModalDoc(true);
  };

  const handleConfirmarDoc = () => {
    if (!docElegido) return;
    setModalDoc(false);
    setEnviando(true);

    // TODO: llamar a la API con { ...form, documento_tipo: docElegido }
    setTimeout(() => {
      setEnviando(false);
      alert("¡Registro exitoso!");
      router.replace("/usuarios/perfil");
    }, 1500);
  };

  return (
    <SafeAreaView style={cs.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={cs.topBar}>
        <TouchableOpacity style={cs.accionBtn} onPress={() => router.back()}>
          <Text style={cs.accionEmoji}>←</Text>
        </TouchableOpacity>
        <View style={cs.topLogos}>
          <View style={cs.logoBadge}>
            <Text style={cs.logoTexto}>IPN</Text>
          </View>
          <View style={[cs.logoBadge, { backgroundColor: "#003366" }]}>
            <Text style={cs.logoTexto}>ESCOM</Text>
          </View>
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
        >
          {/* Título */}
          <Text style={cs.titulo}>Crear cuenta</Text>
          <Text style={cs.subtitulo}>Completa todos los campos para registrarte</Text>

          {/* ── Sección: datos personales ── */}
          <View style={cs.seccion}>
            <Text style={cs.seccionTitulo}>Datos personales</Text>

            <Campo label="Nombres"   emoji="👤" placeholder="Ej. Juan Carlos"
              value={form.nombres}   onChangeText={set("nombres")}
              error={errores.nombres} autoCapitalize="words" />

            <Campo label="Apellidos" emoji="👤" placeholder="Ej. García López"
              value={form.apellidos} onChangeText={set("apellidos")}
              error={errores.apellidos} autoCapitalize="words" />

            <Campo label="Fecha de nacimiento" emoji="🎂" placeholder="AAAA-MM-DD"
              value={form.fecha_nacimiento} onChangeText={set("fecha_nacimiento")}
              error={errores.fecha_nacimiento} keyboardType="numeric" autoCapitalize="none" />

            {/* Género */}
            <View style={cs.campoWrapper}>
              <Text style={cs.campoLabel}>⚧  Género</Text>
              <View style={cs.opcionesGrid}>
                {GENEROS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[cs.opcionBtn, form.genero === g.key && cs.opcionBtnActivo]}
                    onPress={() => { set("genero")(g.key); }}
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

          {/* ── Sección: cuenta ── */}
          <View style={cs.seccion}>
            <Text style={cs.seccionTitulo}>Datos de cuenta</Text>

            <Campo label="Nombre de usuario" emoji="🪪" placeholder="Ej. juan_garcia"
              value={form.nombre_usuario} onChangeText={set("nombre_usuario")}
              error={errores.nombre_usuario} autoCapitalize="none" />

            <Campo label="Correo electrónico" emoji="📧" placeholder="correo@ejemplo.com"
              value={form.correo_electronico} onChangeText={set("correo_electronico")}
              error={errores.correo_electronico} keyboardType="email-address" autoCapitalize="none" />

            <Campo label="Contraseña" emoji="🔑" placeholder="Mínimo 8 caracteres"
              value={form.password} onChangeText={set("password")}
              error={errores.password} secureTextEntry autoCapitalize="none" />

            <Campo label="Confirmar contraseña" emoji="🔒" placeholder="Repite tu contraseña"
              value={form.confirmar_password} onChangeText={set("confirmar_password")}
              error={errores.confirmar_password} secureTextEntry autoCapitalize="none" />
          </View>

          {/* ── Sección: tipo de usuario ── */}
          <View style={cs.seccion}>
            <Text style={cs.seccionTitulo}>Tipo de usuario</Text>
            <View style={cs.tiposRow}>
              {TIPOS_USUARIO.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[cs.tipoBtn, form.tipo_usuario === t.key && cs.tipoBtnActivo]}
                  onPress={() => set("tipo_usuario")(t.key as TipoUsuario)}
                >
                  <Text style={cs.tipoEmoji}>{t.emoji}</Text>
                  <Text style={[cs.tipoLabel, form.tipo_usuario === t.key && cs.tipoLabelActivo]}>
                    {t.label}
                  </Text>
                  <Text style={cs.tipoDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!!errores.tipo_usuario && <Text style={cs.errorTexto}>{errores.tipo_usuario}</Text>}
          </View>

          {/* ── Botón registrar ── */}
          <TouchableOpacity
            style={[cs.btnPrimario, enviando && { opacity: 0.6 }]}
            onPress={handleRegistrar}
            disabled={enviando}
          >
            <Text style={cs.btnPrimarioTexto}>
              {enviando ? "Registrando..." : "Continuar →"}
            </Text>
          </TouchableOpacity>

        <TouchableOpacity style={cs.linkLogin} onPress={() => router.push("/usuarios/login")}>
            <Text style={cs.linkLoginTexto}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal: documento arrendador ── */}
      <Modal
        visible={modalDoc && form.tipo_usuario === "arrendador"}
        transparent
        animationType="slide"
      >
        <View style={cs.modalOverlay}>
          <View style={cs.modalContenido}>
            <Text style={cs.modalTitulo}>Documento requerido</Text>
            <Text style={cs.modalSubtitulo}>
              Como arrendador debes subir el siguiente documento:
            </Text>

            <TouchableOpacity
              style={[cs.docOpcion, docElegido === "escrituras" && cs.docOpcionActiva]}
              onPress={() => setDocElegido("escrituras")}
            >
              <Text style={cs.docEmoji}>📑</Text>
              <View style={{ flex: 1 }}>
                <Text style={[cs.docLabel, docElegido === "escrituras" && cs.docLabelActivo]}>
                  Primera y última página de las escrituras
                </Text>
              </View>
              {docElegido === "escrituras" && <Text style={cs.checkEmoji}>✅</Text>}
            </TouchableOpacity>

            <View style={cs.modalBotones}>
              <TouchableOpacity
                style={cs.modalBtnSecundario}
                onPress={() => setModalDoc(false)}
              >
                <Text style={cs.modalBtnTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cs.modalBtnPrimario, !docElegido && { opacity: 0.4 }]}
                onPress={handleConfirmarDoc}
                disabled={!docElegido}
              >
                <Text style={cs.modalBtnTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: documento arrendatario ── */}
      <Modal
        visible={modalDoc && form.tipo_usuario === "arrendatario"}
        transparent
        animationType="slide"
      >
        <View style={cs.modalOverlay}>
          <View style={cs.modalContenido}>
            <Text style={cs.modalTitulo}>Documento de verificación</Text>
            <Text style={cs.modalSubtitulo}>
              Selecciona el documento con el que deseas verificarte:
            </Text>

            {DOCS_ARRENDATARIO.map((doc) => (
              <TouchableOpacity
                key={doc.key}
                style={[cs.docOpcion, docElegido === doc.key && cs.docOpcionActiva]}
                onPress={() => setDocElegido(doc.key)}
              >
                <Text style={cs.docEmoji}>{doc.emoji}</Text>
                <Text style={[cs.docLabel, docElegido === doc.key && cs.docLabelActivo]}>
                  {doc.label}
                </Text>
                {docElegido === doc.key && <Text style={cs.checkEmoji}>✅</Text>}
              </TouchableOpacity>
            ))}

            <View style={cs.modalBotones}>
              <TouchableOpacity
                style={cs.modalBtnSecundario}
                onPress={() => setModalDoc(false)}
              >
                <Text style={cs.modalBtnTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cs.modalBtnPrimario, !docElegido && { opacity: 0.4 }]}
                onPress={handleConfirmarDoc}
                disabled={!docElegido}
              >
                <Text style={cs.modalBtnTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const cs = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f4f0" },
  scroll:     { paddingHorizontal: 16, paddingBottom: 48 },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  topLogos:   { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge:  {
    backgroundColor: "#8B0000", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  logoTexto:  { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  separador:  { height: 1, backgroundColor: "#e0dcd8" },

  // Encabezado
  titulo:    { fontSize: 26, fontWeight: "900", color: "#1a1a1a", marginTop: 24, marginBottom: 4 },
  subtitulo: { fontSize: 14, color: "#888", marginBottom: 20 },

  // Secciones
  seccion: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  seccionTitulo: { fontSize: 15, fontWeight: "800", color: "#1a1a1a", marginBottom: 14 },

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

  // Opciones género
  opcionesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opcionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#f7f4f0", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  opcionBtnActivo: { backgroundColor: "#eef1fb", borderColor: "#1a3a8f" },
  opcionEmoji:     { fontSize: 16 },
  opcionLabel:     { fontSize: 13, fontWeight: "600", color: "#555" },
  opcionLabelActivo: { color: "#1a3a8f" },

  // Tipo de usuario
  tiposRow: { flexDirection: "row", gap: 10 },
  tipoBtn: {
    flex: 1, alignItems: "center", padding: 16,
    backgroundColor: "#f7f4f0", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  tipoBtnActivo: { backgroundColor: "#eef1fb", borderColor: "#1a3a8f" },
  tipoEmoji:     { fontSize: 28, marginBottom: 6 },
  tipoLabel:     { fontSize: 14, fontWeight: "800", color: "#555" },
  tipoLabelActivo: { color: "#1a3a8f" },
  tipoDesc:      { fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 4 },

  // Botones
  btnPrimario: {
    backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  btnPrimarioTexto: { color: "#fff", fontWeight: "900", fontSize: 15 },
  linkLogin:        { alignItems: "center", marginTop: 16 },
  linkLoginTexto:   { fontSize: 13, color: "#1a3a8f", fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContenido: {
    backgroundColor: "#1a3a8f", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  modalTitulo:    { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 6 },
  modalSubtitulo: { fontSize: 13, color: "#c0cadf", marginBottom: 20, lineHeight: 20 },

  docOpcion: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: "transparent",
  },
  docOpcionActiva: { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.2)" },
  docEmoji:        { fontSize: 24 },
  docLabel:        { flex: 1, fontSize: 14, fontWeight: "600", color: "#c0cadf" },
  docLabelActivo:  { color: "#fff" },
  checkEmoji:      { fontSize: 18 },

  modalBotones:      { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtnSecundario: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  modalBtnPrimario: {
    flex: 1, backgroundColor: "#e63946",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  modalBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
});