import React, { useState } from "react";
import {
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { URL_BASE } from "../../services/api";

// ── Helper: convierte URI local a Blob (web) ──────────────────────
async function uriABlob(uri: string): Promise<Blob> {
  // Si ya es blob: lo fetchea directo
  if (uri.startsWith("blob:") || uri.startsWith("http")) {
    const r = await fetch(uri);
    return r.blob();
  }
  // data:image/... → convierte base64 a Blob
  const [meta, base64] = uri.split(",");
  const mime = meta.split(":")[1].split(";")[0];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── Tipos ─────────────────────────────────────────────────────────
type TipoRenta = "solo_mujeres" | "solo_hombres" | "mixto";

type ImagenLocal = {
  uri:  string;
  name: string;
  type: string;
};

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

const MAX_GALERIA = 9; // principal + 9 adicionales = 10 en total

// ── Helpers imagen ────────────────────────────────────────────────
function nombreArchivo(uri: string): string {
  return uri.split("/").pop() ?? `img_${Date.now()}.jpg`;
}

function mimeDesdeUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png")  return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

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
  const router      = useRouter();
  const { usuario } = useAuth();

  const [form, setForm]           = useState<FormData>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores]     = useState<Partial<Record<keyof FormData | "imagen_principal", string>>>({});

  // ── Estado de imágenes ────────────────────────────────────────
  const [imagenPrincipal, setImagenPrincipal] = useState<ImagenLocal | null>(null);
  const [galeria, setGaleria]                 = useState<ImagenLocal[]>([]);

  const set = (campo: keyof FormData) => (valor: any) =>
    setForm(prev => ({ ...prev, [campo]: valor }));

  // ── Selección de imagen principal ─────────────────────────────
  const seleccionarPrincipal = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setImagenPrincipal({
      uri: asset.uri,
      name: asset.fileName || `imagen_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
    // Limpiar error si existía
    setErrores(prev => ({ ...prev, imagen_principal: undefined }));
  };

  // ── Selección de imágenes adicionales ─────────────────────────
  const seleccionarAdicional = async () => {
    if (galeria.length >= MAX_GALERIA) {
      Alert.alert("Límite alcanzado", `Puedes agregar máximo ${MAX_GALERIA} imágenes adicionales.`);
      return;
    }
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_GALERIA - galeria.length,
    });
    if (result.canceled) return;
    const nuevas = result.assets.map(a => ({
      uri:  a.uri,
      name: nombreArchivo(a.uri),
      type: mimeDesdeUri(a.uri),
    }));
    setGaleria(prev => [...prev, ...nuevas].slice(0, MAX_GALERIA));
  };

  const eliminarAdicional = (index: number) =>
    setGaleria(prev => prev.filter((_, i) => i !== index));

  // ── Validación ────────────────────────────────────────────────
  const validar = (): boolean => {
    const e: Partial<Record<keyof FormData | "imagen_principal", string>> = {};
    if (!form.titulo.trim())    e.titulo    = "El título es obligatorio";
    if (!form.precio.trim())    e.precio    = "El precio es obligatorio";
    else if (isNaN(Number(form.precio)) || Number(form.precio) <= 0)
                                e.precio    = "Ingresa un precio válido";
    if (!form.colonia.trim())   e.colonia   = "La colonia es obligatoria";
    if (!form.alcaldia.trim())  e.alcaldia  = "La alcaldía es obligatoria";
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria";
    if (!form.cuartos.trim())   e.cuartos   = "Indica el número de cuartos";
    else if (isNaN(Number(form.cuartos)) || Number(form.cuartos) < 1)
                                e.cuartos   = "Mínimo 1 cuarto";
    if (!imagenPrincipal)       e.imagen_principal = "La imagen principal es obligatoria";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Enviar ────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!validar()) return;
    if (!usuario)   return;

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("titulo",          form.titulo.trim());
      formData.append("descripcion",     form.descripcion.trim());
      formData.append("precio",          String(Number(form.precio)));
      formData.append("colonia",         form.colonia.trim());
      formData.append("alcaldia",        form.alcaldia.trim());
      formData.append("direccion",       form.direccion.trim());
      formData.append("metro_cercano",   form.metro_cercano.trim());
      formData.append("cuartos",         String(Number(form.cuartos)));
      formData.append("tipo_renta",      form.tipo_renta);
      formData.append("amueblado",       String(form.amueblado));
      formData.append("internet",        String(form.internet));
      formData.append("estacionamiento", String(form.estacionamiento));
      formData.append("pet_friendly",    String(form.pet_friendly));
      formData.append("cocina",          String(form.cocina));
      formData.append("arrendador",      String(usuario.id));

      // ── Imagen principal ──────────────────────────────────────
      if (imagenPrincipal) {
        const blob = await uriABlob(imagenPrincipal.uri);
        formData.append("imagen_principal", blob, imagenPrincipal.name);
      }

      const r = await fetch(`${URL_BASE}/departamentos/`, {
        method: "POST",
        // ⚠️ Sin Content-Type — el browser lo pone solo con el boundary correcto
        body: formData,
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        console.error("Error backend:", err);
        Alert.alert("Error", JSON.stringify(err));
        return;
      }

      const depaCreado = await r.json();
      console.log("Depa creado:", depaCreado);

      // ── Galería ───────────────────────────────────────────────
      for (const img of galeria) {
        const fd = new FormData();
        const blob = await uriABlob(img.uri);
        fd.append("imagen", blob, img.name);

        const rg = await fetch(`${URL_BASE}/departamentos/${depaCreado.id}/galeria/`, {
          method: "POST",
          body:   fd,
        });

        if (!rg.ok) {
          const eg = await rg.json().catch(() => ({}));
          console.warn("Error galería:", eg);
        }
      }

      Alert.alert("¡Listo!", "Departamento registrado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error("Error general:", e);
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
            {[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5+" },
            ].map((n) => (
              <TouchableOpacity
                key={n.value}
                style={[styles.cuartoBtn, form.cuartos === n.value && styles.cuartoBtnActivo]}
                onPress={() => set("cuartos")(n.value)}
              >
                <Text style={[styles.cuartoBtnTexto, form.cuartos === n.value && styles.cuartoBtnTextoActivo]}>
                  {n.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.cuartos && <Text style={styles.error}>{errores.cuartos}</Text>}
        </View>

        {/* ── Ubicación ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>📍 Ubicación</Text>

          <Campo label="Colonia *"            value={form.colonia}       onChange={set("colonia")}       placeholder="Ej. Lindavista" />
          {errores.colonia   && <Text style={styles.error}>{errores.colonia}</Text>}
          <Campo label="Alcaldía *"           value={form.alcaldia}      onChange={set("alcaldia")}      placeholder="Ej. Gustavo A. Madero" />
          {errores.alcaldia  && <Text style={styles.error}>{errores.alcaldia}</Text>}
          <Campo label="Dirección completa *" value={form.direccion}     onChange={set("direccion")}     placeholder="Calle, número, referencias" />
          {errores.direccion && <Text style={styles.error}>{errores.direccion}</Text>}
          <Campo label="Metro más cercano"    value={form.metro_cercano} onChange={set("metro_cercano")} placeholder="Ej. Politécnico" />
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

        {/* ── Imagen principal ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🖼 Imagen principal *</Text>
          <Text style={styles.seccionSub}>
            Será la foto destacada de tu anuncio. Obligatoria.
          </Text>

          {imagenPrincipal ? (
            <View style={styles.imagenPrincipalWrapper}>
              <Image source={{ uri: imagenPrincipal.uri }} style={styles.imagenPrincipalPreview} resizeMode="cover"/>
              <TouchableOpacity
                style={styles.imagenPrincipalCambiar}
                onPress={seleccionarPrincipal}
              >
                <Text style={styles.imagenPrincipalCambiarTexto}>✏️ Cambiar imagen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.imagenPrincipalBtn,
                errores.imagen_principal && styles.imagenPrincipalBtnError,
              ]}
              onPress={seleccionarPrincipal}
            >
              <Text style={styles.imagenPrincipalIcono}>📷</Text>
              <Text style={styles.imagenPrincipalTexto}>Seleccionar imagen principal</Text>
              <Text style={styles.imagenPrincipalSub}>JPG, PNG o WEBP</Text>
            </TouchableOpacity>
          )}
          {errores.imagen_principal && (
            <Text style={styles.error}>{errores.imagen_principal}</Text>
          )}
        </View>

        {/* ── Galería adicional ── */}
        <View style={styles.seccion}>
          <View style={styles.galeriaHeader}>
            <Text style={styles.seccionTitulo}>🗂 Fotos adicionales</Text>
            <Text style={styles.galeriaConteo}>
              {galeria.length}/{MAX_GALERIA}
            </Text>
          </View>
          <Text style={styles.seccionSub}>
            Agrega hasta {MAX_GALERIA} fotos más para mostrar tu departamento.
          </Text>

          {/* Grid de miniaturas */}
          {galeria.length > 0 && (
            <View style={styles.galeriaGrid}>
              {galeria.map((img, i) => (
                <View key={i} style={styles.galeriaThumbWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.galeriaThumb} resizeMode="cover"/>
                  <TouchableOpacity
                    style={styles.galeriaThumbEliminar}
                    onPress={() => eliminarAdicional(i)}
                  >
                    <Text style={styles.galeriaThumbEliminarTexto}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Botón agregar */}
          {galeria.length < MAX_GALERIA && (
            <TouchableOpacity style={styles.galeriaAgregarBtn} onPress={seleccionarAdicional}>
              <Text style={styles.galeriaAgregarIcono}>＋</Text>
              <Text style={styles.galeriaAgregarTexto}>
                {galeria.length === 0 ? "Agregar fotos" : "Agregar más fotos"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Botón guardar ── */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnGuardandoOpacity]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          <Text style={styles.btnGuardarTexto}>
            {guardando ? "Publicando..." : "Publicar departamento"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  scroll:    { paddingBottom: 20 },
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
  seccionTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 4 },
  seccionSub:    { fontSize: 12, color: "#aaa", marginBottom: 14 },

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

  cuartosRow:           { flexDirection: "row", gap: 8, marginBottom: 14, marginTop: 6 },
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

  // Imagen principal
  imagenPrincipalBtn: {
    borderWidth: 2, borderColor: "#e0dcd8", borderStyle: "dashed",
    borderRadius: 14, paddingVertical: 28, alignItems: "center", gap: 6,
    backgroundColor: "#fafafa",
  },
  imagenPrincipalBtnError: { borderColor: "#e63946" },
  imagenPrincipalIcono:    { fontSize: 32 },
  imagenPrincipalTexto:    { fontSize: 14, fontWeight: "700", color: "#1a3a8f" },
  imagenPrincipalSub:      { fontSize: 12, color: "#aaa" },
  imagenPrincipalWrapper:  { gap: 10 },
  imagenPrincipalPreview: {
    width: "100%", height: 180, borderRadius: 12,
  },
  imagenPrincipalCambiar: {
    backgroundColor: "#f0f4ff", borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: "#1a3a8f",
  },
  imagenPrincipalCambiarTexto: { fontSize: 13, fontWeight: "700", color: "#1a3a8f" },

  // Galería
  galeriaHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  galeriaConteo:  { fontSize: 13, fontWeight: "700", color: "#aaa" },
  galeriaGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12,
  },
  galeriaThumbWrapper: { position: "relative" },
  galeriaThumb: {
    width: 80, height: 80, borderRadius: 10,
  },
  galeriaThumbEliminar: {
    position: "absolute", top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#e63946", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  galeriaThumbEliminarTexto: { color: "#fff", fontSize: 10, fontWeight: "900" },
  galeriaAgregarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: "#e0dcd8", borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 14, backgroundColor: "#fafafa",
  },
  galeriaAgregarIcono: { fontSize: 18, color: "#1a3a8f", fontWeight: "900" },
  galeriaAgregarTexto: { fontSize: 14, fontWeight: "700", color: "#1a3a8f" },

  btnGuardar: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: "#1a3a8f", borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
  },
  btnGuardandoOpacity: { opacity: 0.6 },
  btnGuardarTexto: { color: "#fff", fontWeight: "900", fontSize: 16 },
});