import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "./../context/AuthContext";
import { URL_BASE } from "./../../services/api";

// ── Helpers imagen ────────────────────────────────────────────────

async function uriABlob(uri: string): Promise<Blob> {
  if (uri.startsWith("blob:") || uri.startsWith("http")) {
    const r = await fetch(uri);
    return r.blob();
  }
  const [meta, base64] = uri.split(",");
  const mime = meta.split(":")[1].split(";")[0];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function prepararImagen(img: ImagenLocal): Promise<any> {
  if (Platform.OS === "web") return await uriABlob(img.uri);
  return { uri: img.uri, name: img.name, type: img.type };
}

function mimeDesdeUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

// ── Tipos ─────────────────────────────────────────────────────────

type TipoRenta = "solo_mujeres" | "solo_hombres" | "mixto";

type ImagenLocal = { uri: string; name: string; type: string };

type ImagenGaleria = { id: number; imagen: string; orden: number };

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

type FormContacto = {
  whatsapp:  string;
  telefono:  string;
  sitio_web: string;
};

// ── Constantes ────────────────────────────────────────────────────

const TIPOS_RENTA: { value: TipoRenta; label: string; emoji: string }[] = [
  { value: "mixto",        label: "Mixto",        emoji: "👥" },
  { value: "solo_mujeres", label: "Solo mujeres", emoji: "👩" },
  { value: "solo_hombres", label: "Solo hombres", emoji: "👨" },
];

const AMENIDADES: { key: keyof FormData; label: string; emoji: string }[] = [
  { key: "amueblado",       label: "Amueblado",       emoji: "🛋" },
  { key: "internet",        label: "Internet",         emoji: "🛜" },
  { key: "estacionamiento", label: "Estacionamiento",  emoji: "🚗" },
  { key: "pet_friendly",    label: "Pet friendly",     emoji: "🐾" },
  { key: "cocina",          label: "Cocina equipada",  emoji: "🍳" },
];

const MAX_GALERIA = 9;

// ── Subcomponentes ────────────────────────────────────────────────

function Campo({
  label, value, onChange, placeholder, keyboardType, multiline, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad" | "url";
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
        autoCapitalize="none"
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

export default function EditarDepartamento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();

  // Estados de carga
  const [cargando, setCargando]     = useState(true);
  const [guardando, setGuardando]   = useState(false);
  const [seccionActiva, setSeccion] = useState<
    "info" | "ubicacion" | "amenidades" | "imagenes" | "contacto"
  >("info");

  // Datos del departamento
  const [form, setForm] = useState<FormData>({
    titulo: "", descripcion: "", precio: "", colonia: "",
    alcaldia: "", direccion: "", metro_cercano: "", cuartos: "1",
    tipo_renta: "mixto", amueblado: false, internet: false,
    estacionamiento: false, pet_friendly: false, cocina: false,
  });

  // Imagen principal
  const [imagenPrincipalUrl, setImagenPrincipalUrl]       = useState<string | null>(null);
  const [nuevaImagenPrincipal, setNuevaImagenPrincipal]   = useState<ImagenLocal | null>(null);

  // Galería
  const [galeriaExistente, setGaleriaExistente]           = useState<ImagenGaleria[]>([]);
  const [galeriaEliminada, setGaleriaEliminada]           = useState<number[]>([]);
  const [galeriaNewLocal, setGaleriaNewLocal]             = useState<ImagenLocal[]>([]);

  // Contacto (se guarda en el modelo del arrendador)
  const [contacto, setContacto] = useState<FormContacto>({
    whatsapp: "", telefono: "", sitio_web: "",
  });

  const [errores, setErrores] = useState<Partial<Record<string, string>>>({});

  const set = (campo: keyof FormData) => (valor: any) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));
  const setC = (campo: keyof FormContacto) => (valor: string) =>
    setContacto((prev) => ({ ...prev, [campo]: valor }));

  // ── Cargar departamento ───────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`${URL_BASE}/departamentos/${id}/`);
        if (!r.ok) throw new Error("No encontrado");
        const d = await r.json();

        // Verificar que el arrendador sea el usuario actual
        const arrId =
          typeof d.arrendador === "object" ? d.arrendador?.id : d.arrendador;
        if (usuario && String(arrId) !== String(usuario.id)) {
          Alert.alert("Sin permiso", "Solo el arrendador puede editar este departamento.");
          router.back();
          return;
        }

        // Verificar que no tenga renta activa
        if (!d.disponible) {
          Alert.alert(
            "No disponible",
            "No puedes editar un departamento con renta activa.",
            [{ text: "Entendido", onPress: () => router.back() }]
          );
          return;
        }

        setForm({
          titulo:          d.titulo          ?? "",
          descripcion:     d.descripcion     ?? "",
          precio:          String(d.precio   ?? ""),
          colonia:         d.colonia         ?? "",
          alcaldia:        d.alcaldia        ?? "",
          direccion:       d.direccion       ?? "",
          metro_cercano:   d.metro_cercano   ?? "",
          cuartos:         String(d.cuartos  ?? 1),
          tipo_renta:      d.tipo_renta      ?? "mixto",
          amueblado:       d.amueblado       ?? false,
          internet:        d.internet        ?? false,
          estacionamiento: d.estacionamiento ?? false,
          pet_friendly:    d.pet_friendly    ?? false,
          cocina:          d.cocina          ?? false,
        });

        setImagenPrincipalUrl(d.imagen_principal ?? null);
        setGaleriaExistente(d.galeria ?? []);
      } catch {
        Alert.alert("Error", "No se pudo cargar el departamento.");
        router.back();
      } finally {
        setCargando(false);
      }
    })();
  }, [id]);

  // ── Cargar datos de contacto del arrendador ───────────────────

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const r = await fetch(`${URL_BASE}/usuarios/${usuario.id}/`);
        if (!r.ok) return;
        const d = await r.json();
        setContacto({
          whatsapp:  d.whatsapp  ?? "",
          telefono:  d.telefono  ?? "",
          sitio_web: d.sitio_web ?? "",
        });
      } catch {}
    })();
  }, [usuario?.id]);

  // ── Imagen principal ──────────────────────────────────────────

  const seleccionarPrincipal = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) { Alert.alert("Permiso requerido"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [16, 9],
    });
    if (result.canceled) return;
    const a = result.assets[0];
    setNuevaImagenPrincipal({
      uri:  a.uri,
      name: a.fileName || `img_${Date.now()}.jpg`,
      type: a.mimeType || "image/jpeg",
    });
  };

  // ── Galería ───────────────────────────────────────────────────

  const totalImagenes =
    galeriaExistente.filter((g) => !galeriaEliminada.includes(g.id)).length +
    galeriaNewLocal.length;

  const seleccionarAdicional = async () => {
    if (totalImagenes >= MAX_GALERIA) {
      Alert.alert("Límite alcanzado", `Máximo ${MAX_GALERIA} fotos adicionales.`);
      return;
    }
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) { Alert.alert("Permiso requerido"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true,
      selectionLimit: MAX_GALERIA - totalImagenes,
    });
    if (result.canceled) return;
    const nuevas = result.assets.map((a) => ({
      uri:  a.uri,
      name: a.fileName || `img_${Date.now()}.jpg`,
      type: a.mimeType || mimeDesdeUri(a.uri),
    }));
    setGaleriaNewLocal((prev) => [...prev, ...nuevas].slice(0, MAX_GALERIA));
  };

  const marcarEliminarGaleria = (imgId: number) =>
    setGaleriaEliminada((prev) => [...prev, imgId]);

  const quitarNueva = (index: number) =>
    setGaleriaNewLocal((prev) => prev.filter((_, i) => i !== index));

  // ── Validación ────────────────────────────────────────────────

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.titulo.trim())    e.titulo    = "El título es obligatorio";
    if (!form.precio.trim() || isNaN(Number(form.precio)) || Number(form.precio) <= 0)
                                e.precio    = "Ingresa un precio válido";
    if (!form.colonia.trim())   e.colonia   = "La colonia es obligatoria";
    if (!form.alcaldia.trim())  e.alcaldia  = "La alcaldía es obligatoria";
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria";
    if (isNaN(Number(form.cuartos)) || Number(form.cuartos) < 1)
                                e.cuartos   = "Mínimo 1 cuarto";
    // Validar URL de sitio web solo si fue ingresada
    if (contacto.sitio_web && !/^https?:\/\/.+/.test(contacto.sitio_web)) {
      e.sitio_web = "Ingresa una URL válida (ej. https://mi-sitio.com)";
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Guardar ───────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (!validar() || !usuario) return;
    setGuardando(true);

    try {
      // 1. PATCH del departamento (campos de texto + imagen principal si cambió)
      const fd = new FormData();
      fd.append("titulo",          form.titulo.trim());
      fd.append("descripcion",     form.descripcion.trim());
      fd.append("precio",          String(Number(form.precio)));
      fd.append("colonia",         form.colonia.trim());
      fd.append("alcaldia",        form.alcaldia.trim());
      fd.append("direccion",       form.direccion.trim());
      fd.append("metro_cercano",   form.metro_cercano.trim());
      fd.append("cuartos",         String(Number(form.cuartos)));
      fd.append("tipo_renta",      form.tipo_renta);
      fd.append("amueblado",       String(form.amueblado));
      fd.append("internet",        String(form.internet));
      fd.append("estacionamiento", String(form.estacionamiento));
      fd.append("pet_friendly",    String(form.pet_friendly));
      fd.append("cocina",          String(form.cocina));

      if (nuevaImagenPrincipal) {
        const archivo = await prepararImagen(nuevaImagenPrincipal);
        fd.append("imagen_principal", archivo, nuevaImagenPrincipal.name);
      }

      const r = await fetch(`${URL_BASE}/departamentos/${id}/`, {
        method: "PATCH",
        body:   fd,
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        Alert.alert("Error al guardar", JSON.stringify(err));
        return;
      }

      // 2. Eliminar imágenes de galería marcadas
      for (const imgId of galeriaEliminada) {
        await fetch(`${URL_BASE}/departamentos/${id}/galeria/${imgId}/`, {
          method: "DELETE",
        }).catch(() => {});
      }

      // 3. Subir nuevas imágenes de galería
      for (const img of galeriaNewLocal) {
        const fgd = new FormData();
        const archivo = await prepararImagen(img);
        fgd.append("imagen", archivo, img.name);
        await fetch(`${URL_BASE}/departamentos/${id}/galeria/`, {
          method: "POST",
          body:   fgd,
        }).catch(() => {});
      }

      // 4. PATCH del arrendador — actualizar datos de contacto
      const hayContacto =
        contacto.whatsapp.trim() || contacto.telefono.trim() || contacto.sitio_web.trim();
      
      if (hayContacto) {
        console.log({
          telefono: contacto.telefono,
          whatsapp: contacto.whatsapp,
          sitio_web: contacto.sitio_web,
        });
        await fetch(`${URL_BASE}/usuarios/${usuario.id}/`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            whatsapp:  contacto.whatsapp.trim(),
            telefono:  contacto.telefono.trim(),
            sitio_web: contacto.sitio_web.trim(),
          }),
        }).catch(() => {});
      }

      Alert.alert("¡Listo!", "Departamento actualizado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un problema de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <ActivityIndicator size="large" color="#1a3a8f" />
          <Text style={styles.cargandoTexto}>Cargando departamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Imagen principal a mostrar: nueva seleccionada > URL del backend
  const uriPrincipalPreview = nuevaImagenPrincipal?.uri ?? imagenPrincipalUrl;

  const galeriaVisible = galeriaExistente.filter(
    (g) => !galeriaEliminada.includes(g.id)
  );

  const SECCIONES: {
    key: typeof seccionActiva;
    label: string;
    emoji: string;
  }[] = [
    { key: "info",       label: "Información",  emoji: "📋" },
    { key: "ubicacion",  label: "Ubicación",    emoji: "📍" },
    { key: "amenidades", label: "Amenidades",   emoji: "✨" },
    { key: "imagenes",   label: "Imágenes",     emoji: "🖼" },
    { key: "contacto",   label: "Contacto",     emoji: "📱" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Editar departamento</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      {/* ── Tabs de sección ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {SECCIONES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.tab, seccionActiva === s.key && styles.tabActivo]}
            onPress={() => setSeccion(s.key)}
          >
            <Text style={styles.tabEmoji}>{s.emoji}</Text>
            <Text
              style={[
                styles.tabTexto,
                seccionActiva === s.key && styles.tabTextoActivo,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.separador} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ INFORMACIÓN BÁSICA ══ */}
        {seccionActiva === "info" && (
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
              {["1", "2", "3", "4", "5"].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.cuartoBtn,
                    form.cuartos === n && styles.cuartoBtnActivo,
                  ]}
                  onPress={() => set("cuartos")(n)}
                >
                  <Text
                    style={[
                      styles.cuartoBtnTexto,
                      form.cuartos === n && styles.cuartoBtnTextoActivo,
                    ]}
                  >
                    {n === "5" ? "5+" : n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errores.cuartos && <Text style={styles.error}>{errores.cuartos}</Text>}

            {/* Tipo de renta */}
            <Text style={[styles.campoLabel, { marginTop: 14 }]}>
              Tipo de renta
            </Text>
            <View style={styles.tipoRow}>
              {TIPOS_RENTA.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.tipoBtn,
                    form.tipo_renta === t.value && styles.tipoBtnActivo,
                  ]}
                  onPress={() => set("tipo_renta")(t.value)}
                >
                  <Text style={styles.tipoEmoji}>{t.emoji}</Text>
                  <Text
                    style={[
                      styles.tipoBtnTexto,
                      form.tipo_renta === t.value && styles.tipoBtnTextoActivo,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ══ UBICACIÓN ══ */}
        {seccionActiva === "ubicacion" && (
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
        )}

        {/* ══ AMENIDADES ══ */}
        {seccionActiva === "amenidades" && (
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
        )}

        {/* ══ IMÁGENES ══ */}
        {seccionActiva === "imagenes" && (
          <View style={styles.seccion}>
            {/* Imagen principal */}
            <Text style={styles.seccionTitulo}>🖼 Imagen principal</Text>
            <Text style={styles.seccionSub}>
              Toca para cambiar la foto destacada de tu anuncio.
            </Text>

            {uriPrincipalPreview ? (
              <View style={styles.imagenPrincipalWrapper}>
                <Image
                  source={{ uri: uriPrincipalPreview }}
                  style={styles.imagenPrincipalPreview}
                  resizeMode="cover"
                />
                {nuevaImagenPrincipal && (
                  <View style={styles.nuevaBadge}>
                    <Text style={styles.nuevaBadgeTexto}>Nueva imagen</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.imagenPrincipalCambiar}
                  onPress={seleccionarPrincipal}
                >
                  <Text style={styles.imagenPrincipalCambiarTexto}>
                    ✏️ Cambiar imagen principal
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagenPrincipalBtn}
                onPress={seleccionarPrincipal}
              >
                <Text style={styles.imagenPrincipalIcono}>📷</Text>
                <Text style={styles.imagenPrincipalTexto}>
                  Seleccionar imagen principal
                </Text>
                <Text style={styles.imagenPrincipalSub}>JPG, PNG o WEBP</Text>
              </TouchableOpacity>
            )}

            {/* Galería adicional */}
            <View style={[styles.galeriaHeader, { marginTop: 24 }]}>
              <Text style={styles.seccionTitulo}>🗂 Fotos adicionales</Text>
              <Text style={styles.galeriaConteo}>
                {totalImagenes}/{MAX_GALERIA}
              </Text>
            </View>
            <Text style={styles.seccionSub}>
              Las fotos con ✕ rojo serán eliminadas al guardar.
            </Text>

            <View style={styles.galeriaGrid}>
              {/* Fotos existentes en el backend */}
              {galeriaVisible.map((img) => (
                <View key={img.id} style={styles.galeriaThumbWrapper}>
                  <Image
                    source={{ uri: img.imagen }}
                    style={styles.galeriaThumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.galeriaThumbEliminar}
                    onPress={() => marcarEliminarGaleria(img.id)}
                  >
                    <Text style={styles.galeriaThumbEliminarTexto}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Fotos nuevas (aún no subidas) */}
              {galeriaNewLocal.map((img, i) => (
                <View key={`new-${i}`} style={styles.galeriaThumbWrapper}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.galeriaThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.galeriaNewBadge}>
                    <Text style={styles.galeriaNewBadgeTexto}>+</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.galeriaThumbEliminar}
                    onPress={() => quitarNueva(i)}
                  >
                    <Text style={styles.galeriaThumbEliminarTexto}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {totalImagenes < MAX_GALERIA && (
              <TouchableOpacity
                style={styles.galeriaAgregarBtn}
                onPress={seleccionarAdicional}
              >
                <Text style={styles.galeriaAgregarIcono}>＋</Text>
                <Text style={styles.galeriaAgregarTexto}>
                  Agregar fotos adicionales
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ══ CONTACTO ══ */}
        {seccionActiva === "contacto" && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>📱 Información de contacto</Text>
            <Text style={styles.seccionSub}>
              Esta información se mostrará a los interesados en tu departamento.
              Se guarda en tu perfil de arrendador.
            </Text>

            <View style={styles.contactoItem}>
              <Text style={styles.contactoIcono}>📱</Text>
              <View style={styles.contactoInputWrapper}>
                <Text style={styles.campoLabel}>WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={contacto.whatsapp}
                  onChangeText={setC("whatsapp")}
                  placeholder="Ej. +52 55 1234 5678"
                  placeholderTextColor="#bbb"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.contactoItem}>
              <Text style={styles.contactoIcono}>📞</Text>
              <View style={styles.contactoInputWrapper}>
                <Text style={styles.campoLabel}>Teléfono fijo</Text>
                <TextInput
                  style={styles.input}
                  value={contacto.telefono}
                  onChangeText={setC("telefono")}
                  placeholder="Ej. 55 5678 9012"
                  placeholderTextColor="#bbb"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.contactoItem}>
              <Text style={styles.contactoIcono}>🌐</Text>
              <View style={styles.contactoInputWrapper}>
                <Text style={styles.campoLabel}>Sitio web</Text>
                <TextInput
                  style={styles.input}
                  value={contacto.sitio_web}
                  onChangeText={setC("sitio_web")}
                  placeholder="https://mi-sitio.com"
                  placeholderTextColor="#bbb"
                  keyboardType="url"
                  autoCapitalize="none"
                />
                {errores.sitio_web && (
                  <Text style={styles.error}>{errores.sitio_web}</Text>
                )}
              </View>
            </View>

            <View style={styles.contactoNota}>
              <Text style={styles.contactoNotaTexto}>
                💡 Estos datos se actualizan en tu perfil. Todos tus departamentos
                mostrarán la misma información de contacto.
              </Text>
            </View>
          </View>
        )}

        {/* ── Botón guardar ── */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnGuardandoOpacity]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <View style={styles.btnGuardandoRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.btnGuardarTexto}>Guardando...</Text>
            </View>
          ) : (
            <Text style={styles.btnGuardarTexto}>Guardar cambios</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  cargandoContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", gap: 12,
  },
  cargandoTexto:  { fontSize: 16, color: "#888" },
  scroll:         { paddingBottom: 20 },

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

  // Tabs
  tabsContainer: { flexGrow: 0 },
  tabsContent:   { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: "row" },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  tabActivo:      { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  tabEmoji:       { fontSize: 14 },
  tabTexto:       { fontSize: 13, fontWeight: "700", color: "#555" },
  tabTextoActivo: { color: "#fff" },

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

  cuartosRow: { flexDirection: "row", gap: 8, marginBottom: 14, marginTop: 6 },
  cuartoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#f7f4f0", alignItems: "center",
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  cuartoBtnActivo:      { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  cuartoBtnTexto:       { fontSize: 14, fontWeight: "700", color: "#555" },
  cuartoBtnTextoActivo: { color: "#fff" },

  tipoRow: { flexDirection: "row", gap: 8, marginTop: 6 },
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
  imagenPrincipalWrapper: { gap: 10 },
  imagenPrincipalPreview: { width: "100%", height: 180, borderRadius: 12 },
  nuevaBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#1a9ed4", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  nuevaBadgeTexto: { color: "#fff", fontSize: 11, fontWeight: "700" },
  imagenPrincipalCambiar: {
    backgroundColor: "#f0f4ff", borderRadius: 10, paddingVertical: 10,
    alignItems: "center", borderWidth: 1, borderColor: "#1a3a8f",
  },
  imagenPrincipalCambiarTexto: { fontSize: 13, fontWeight: "700", color: "#1a3a8f" },
  imagenPrincipalBtn: {
    borderWidth: 2, borderColor: "#e0dcd8", borderStyle: "dashed",
    borderRadius: 14, paddingVertical: 28, alignItems: "center", gap: 6,
    backgroundColor: "#fafafa",
  },
  imagenPrincipalIcono: { fontSize: 32 },
  imagenPrincipalTexto: { fontSize: 14, fontWeight: "700", color: "#1a3a8f" },
  imagenPrincipalSub:   { fontSize: 12, color: "#aaa" },

  // Galería
  galeriaHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  galeriaConteo:  { fontSize: 13, fontWeight: "700", color: "#aaa" },
  galeriaGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  galeriaThumbWrapper: { position: "relative" },
  galeriaThumb:   { width: 80, height: 80, borderRadius: 10 },
  galeriaThumbEliminar: {
    position: "absolute", top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#e63946", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  galeriaThumbEliminarTexto: { color: "#fff", fontSize: 10, fontWeight: "900" },
  galeriaNewBadge: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: "#1a9ed4", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  galeriaNewBadgeTexto: { color: "#fff", fontSize: 10, fontWeight: "900" },
  galeriaAgregarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: "#e0dcd8", borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 14, backgroundColor: "#fafafa",
  },
  galeriaAgregarIcono: { fontSize: 18, color: "#1a3a8f", fontWeight: "900" },
  galeriaAgregarTexto: { fontSize: 14, fontWeight: "700", color: "#1a3a8f" },

  // Contacto
  contactoItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16,
  },
  contactoIcono:        { fontSize: 26, marginTop: 22 },
  contactoInputWrapper: { flex: 1 },
  contactoNota: {
    backgroundColor: "#f0f4ff", borderRadius: 12,
    padding: 14, marginTop: 8,
    borderLeftWidth: 3, borderLeftColor: "#1a3a8f",
  },
  contactoNotaTexto: { fontSize: 13, color: "#555", lineHeight: 20 },

  // Botón guardar
  btnGuardar: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: "#1a3a8f", borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
  },
  btnGuardandoOpacity: { opacity: 0.6 },
  btnGuardandoRow:     { flexDirection: "row", alignItems: "center", gap: 10 },
  btnGuardarTexto:     { color: "#fff", fontWeight: "900", fontSize: 16 },
});