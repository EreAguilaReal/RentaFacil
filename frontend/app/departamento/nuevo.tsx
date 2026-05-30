import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { URL_BASE } from "../../services/api";

// ── Tipos ─────────────────────────────────────────────────────────
type TipoRenta = "solo_mujeres" | "solo_hombres" | "mixto";

type FormData = {
  titulo:          string;
  descripcion:     string;
  precio:          string;
  colonia:         string;
  alcaldia:        string;
  direccion:       string;
  metro_cercano:   string;
  cuartos:         string;
  tipo_renta:      TipoRenta;
  amueblado:       boolean;
  internet:        boolean;
  estacionamiento: boolean;
  pet_friendly:    boolean;
  cocina:          boolean;
};

const FORM_INICIAL: FormData = {
  titulo:          "",
  descripcion:     "",
  precio:          "",
  colonia:         "",
  alcaldia:        "",
  direccion:       "",
  metro_cercano:   "",
  cuartos:         "1",
  tipo_renta:      "mixto",
  amueblado:       false,
  internet:        false,
  estacionamiento: false,
  pet_friendly:    false,
  cocina:          false,
};

const TIPOS_RENTA: { value: TipoRenta; label: string; emoji: string }[] = [
  { value: "mixto",        label: "Mixto",        emoji: "👥" },
  { value: "solo_mujeres", label: "Solo mujeres", emoji: "👩" },
  { value: "solo_hombres", label: "Solo hombres", emoji: "👨" },
];

const AMENIDADES: { key: keyof FormData; label: string; emoji: string }[] = [
  { key: "amueblado",       label: "Amueblado",       emoji: "🛋" },
  { key: "internet",        label: "Internet",         emoji: "📶" },
  { key: "estacionamiento", label: "Estacionamiento",  emoji: "🚗" },
  { key: "pet_friendly",    label: "Pet friendly",     emoji: "🐾" },
  { key: "cocina",          label: "Cocina equipada",  emoji: "🍳" },
];

// ── Subcomponentes ────────────────────────────────────────────────
function Campo({
  label, value, onChange, placeholder, keyboardType, multiline, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={styles.campoWrapper}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        maxLength={maxLength}
      />
    </View>
  );
}

function FilaSwitch({
  emoji, label, value, onChange,
}: {
  emoji: string; label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchEmoji}>{emoji}</Text>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#e0dcd8", true: "#1a3a8f" }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function NuevoDepartamento() {
  const router        = useRouter();
  const { usuario }   = useAuth();
  const [form, setForm]         = useState<FormData>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores]   = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (campo: keyof FormData) => (valor: any) =>
    setForm(prev => ({ ...prev, [campo]: valor }));

  // ── Validación ────────────────────────────────────────────────
  const validar = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.titulo.trim())        e.titulo        = "El título es obligatorio";
    if (!form.precio.trim())        e.precio        = "El precio es obligatorio";
    else if (isNaN(Number(form.precio)) || Number(form.precio) <= 0)
                                    e.precio        = "Ingresa un precio válido";
    if (!form.colonia.trim())       e.colonia       = "La colonia es obligatoria";
    if (!form.alcaldia.trim())      e.alcaldia      = "La alcaldía es obligatoria";
    if (!form.direccion.trim())     e.direccion     = "La dirección es obligatoria";
    if (!form.cuartos.trim())       e.cuartos       = "Indica el número de cuartos";
    else if (isNaN(Number(form.cuartos)) || Number(form.cuartos) < 1)
                                    e.cuartos       = "Mínimo 1 cuarto";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Enviar ────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!validar()) return;
    if (!usuario)   return;

    setGuardando(true);
    try {
      const body = {
        titulo:          form.titulo.trim(),
        descripcion:     form.descripcion.trim(),
        precio:          Number(form.precio),
        colonia:         form.colonia.trim(),
        alcaldia:        form.alcaldia.trim(),
        direccion:       form.direccion.trim(),
        metro_cercano:   form.metro_cercano.trim(),
        cuartos:         Number(form.cuartos),
        tipo_renta:      form.tipo_renta,
        amueblado:       form.amueblado,
        internet:        form.internet,
        estacionamiento: form.estacionamiento,
        pet_friendly:    form.pet_friendly,
        cocina:          form.cocina,
        arrendador:      usuario.id,
      };

      const r = await fetch(`${URL_BASE}/departamentos/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${usuario.token}` },
        body:    JSON.stringify(body),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        Alert.alert("Error", err.detail ?? "No se pudo guardar el departamento");
        return;
      }

      if (usuario.estado_verificacion !== "aprobado") {
        Alert.alert(
            "Cuenta no verificada",
            "Debes completar la verificación para publicar."
        );

        return;
    }

      Alert.alert("¡Listo!", "Departamento registrado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Ocurrió un problema de conexión");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Nuevo departamento</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Información básica ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>📋 Información básica</Text>

          <Campo
            label="Título del anuncio *"
            value={form.titulo}
            onChange={set("titulo")}
            placeholder="Ej. Depa amueblado cerca del metro"
            maxLength={200}
          />
          {errores.titulo && <Text style={styles.error}>{errores.titulo}</Text>}

          <Campo
            label="Descripción"
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Describe tu departamento..."
            multiline
          />

          <Campo
            label="Precio mensual (MXN) *"
            value={form.precio}
            onChange={set("precio")}
            placeholder="Ej. 6500"
            keyboardType="numeric"
          />
          {errores.precio && <Text style={styles.error}>{errores.precio}</Text>}

          {/* Cuartos */}
          <Text style={styles.campoLabel}>Número de cuartos *</Text>
          <View style={styles.cuartosRow}>
            {["1", "2", "3", "4", "5+"].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.cuartoBtn, form.cuartos === n && styles.cuartoBtnActivo]}
                onPress={() => set("cuartos")(n)}
              >
                <Text style={[styles.cuartoBtnTexto, form.cuartos === n && styles.cuartoBtnTextoActivo]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.cuartos && <Text style={styles.error}>{errores.cuartos}</Text>}
        </View>

        {/* ── Ubicación ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>📍 Ubicación</Text>

          <Campo
            label="Colonia *"
            value={form.colonia}
            onChange={set("colonia")}
            placeholder="Ej. Lindavista"
          />
          {errores.colonia && <Text style={styles.error}>{errores.colonia}</Text>}

          <Campo
            label="Alcaldía *"
            value={form.alcaldia}
            onChange={set("alcaldia")}
            placeholder="Ej. Gustavo A. Madero"
          />
          {errores.alcaldia && <Text style={styles.error}>{errores.alcaldia}</Text>}

          <Campo
            label="Dirección completa *"
            value={form.direccion}
            onChange={set("direccion")}
            placeholder="Calle, número, referencias"
          />
          {errores.direccion && <Text style={styles.error}>{errores.direccion}</Text>}

          <Campo
            label="Metro más cercano"
            value={form.metro_cercano}
            onChange={set("metro_cercano")}
            placeholder="Ej. Politécnico"
          />
        </View>

        {/* ── Tipo de renta ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>👥 Tipo de renta</Text>
          <View style={styles.tipoRow}>
            {TIPOS_RENTA.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.tipoBtn, form.tipo_renta === t.value && styles.tipoBtnActivo]}
                onPress={() => set("tipo_renta")(t.value)}
              >
                <Text style={styles.tipoEmoji}>{t.emoji}</Text>
                <Text style={[styles.tipoBtnTexto, form.tipo_renta === t.value && styles.tipoBtnTextoActivo]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Amenidades ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>✨ Amenidades</Text>
          {AMENIDADES.map((a) => (
            <FilaSwitch
              key={a.key}
              emoji={a.emoji}
              label={a.label}
              value={form[a.key] as boolean}
              onChange={set(a.key)}
            />
          ))}
        </View>

        {/* ── Botón guardar ── */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnGuardandoOpacity]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          <Text style={styles.btnGuardarTexto}>
            {guardando ? "Guardando..." : "Publicar departamento"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f4f0" },
  scroll:     { paddingBottom: 20 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#f7f4f0",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e0dcd8",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  backEmoji:  { fontSize: 17 },
  topTitulo:  { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  separador:  { height: 1, backgroundColor: "#e0dcd8" },

  seccion: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  seccionTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 14 },

  campoWrapper: { marginBottom: 14 },
  campoLabel:   { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#f7f4f0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: "#1a1a1a",
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  inputMultiline: { height: 90, textAlignVertical: "top" },
  error: { fontSize: 12, color: "#e63946", marginTop: -8, marginBottom: 8 },

  cuartosRow:      { flexDirection: "row", gap: 8, marginBottom: 14, marginTop: 6 },
  cuartoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#f7f4f0", alignItems: "center",
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  cuartoBtnActivo:      { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  cuartoBtnTexto:       { fontSize: 14, fontWeight: "700", color: "#555" },
  cuartoBtnTextoActivo: { color: "#fff" },

  tipoRow: { flexDirection: "row", gap: 8 },
  tipoBtn: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#f7f4f0", borderWidth: 1, borderColor: "#e0dcd8",
  },
  tipoBtnActivo:      { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  tipoEmoji:          { fontSize: 20, marginBottom: 4 },
  tipoBtnTexto:       { fontSize: 11, fontWeight: "700", color: "#555", textAlign: "center" },
  tipoBtnTextoActivo: { color: "#fff" },

  switchRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0ece8",
  },
  switchEmoji: { fontSize: 20, width: 32 },
  switchLabel: { flex: 1, fontSize: 14, color: "#333", fontWeight: "600" },

  btnGuardar: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: "#1a3a8f", borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
  },
  btnGuardandoOpacity: { opacity: 0.6 },
  btnGuardarTexto: { color: "#fff", fontWeight: "900", fontSize: 16 },
});