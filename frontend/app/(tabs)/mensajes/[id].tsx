import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { URL_BASE } from "../../../services/api";

interface Mensaje {
  id: number; contenido: string;
  emisor_id: number; enviado_en: string; leido: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  admin: "Administrador", arrendatario: "Arrendatario", arrendador: "Arrendador",
};

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default function Conversacion() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ id: string; nombre: string; tipo: string }>();
  const id      = params.id;
  const nombre  = params.nombre ?? "";
  const tipo    = params.tipo   ?? "";

  const { usuario }             = useAuth();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto]       = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const flatRef                 = useRef<FlatList>(null);

  const cargarMensajes = useCallback(async () => {
    if (!usuario || !id) return;
    try {
      const res  = await fetch(`${URL_BASE}/mensajes/${usuario.id}/chats/${id}/mensajes/`);
      const data = await res.json();
      setMensajes(data);
    } catch {
      // silencioso en polling
    } finally {
      setCargando(false);
    }
  }, [usuario, id]);

  useEffect(() => {
    cargarMensajes();
    const intervalo = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervalo);
  }, [cargarMensajes]);

  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!texto.trim() || !usuario || enviando) return;
    const textoActual = texto.trim();
    setTexto("");
    setEnviando(true);
    try {
      const res = await fetch(
        `${URL_BASE}/mensajes/${usuario.id}/chats/${id}/enviar/`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ contenido: textoActual }),
        }
      );
      const data = await res.json();
      if (res.ok) setMensajes(prev => [...prev, data]);
    } catch {
      setTexto(textoActual);
    } finally {
      setEnviando(false);
    }
  };

  const renderMensaje = ({ item, index }: { item: Mensaje; index: number }) => {
    const esMio      = item.emisor_id === usuario?.id;
    const anterior   = index > 0 ? mensajes[index - 1] : null;
    const mismaFecha = anterior &&
      new Date(anterior.enviado_en).toDateString() === new Date(item.enviado_en).toDateString();

    return (
      <>
        {!mismaFecha && (
          <View style={styles.fechaSeparador}>
            <Text style={styles.fechaTexto}>
              {new Date(item.enviado_en).toLocaleDateString("es-MX", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </Text>
          </View>
        )}
        <View style={[styles.burbuja, esMio ? styles.burbujaPropia : styles.burbujaAjena]}>
          <Text style={[styles.burbujaTexto, esMio && styles.burbujaTextoPropio]}>
            {item.contenido}
          </Text>
          <Text style={[styles.burbujaHora, esMio && styles.burbujaHoraPropia]}>
            {formatHora(item.enviado_en)}
            {esMio && (item.leido ? "  ✓✓" : "  ✓")}
          </Text>
        </View>
      </>
    );
  };

  const tipoLabel = TIPO_LABEL[tipo] ?? tipo;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarLetra}>
            {nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerTextos}>
          <Text style={styles.headerNombre} numberOfLines={1}>{nombre}</Text>
          {tipoLabel ? (
            <Text style={styles.headerTipo}>{tipoLabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.separador} />

      {/* Mensajes */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {cargando ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#1a3a8f" size="large" />
        ) : (
          <FlatList
            ref={flatRef}
            data={mensajes}
            keyExtractor={m => String(m.id)}
            renderItem={renderMensaje}
            contentContainerStyle={styles.listaPadding}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.vacio}>
                <Text style={styles.vacioTexto}>Sin mensajes aún</Text>
                <Text style={styles.vacioSub}>¡Saluda! 👋</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#aaa"
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
            onSubmitEditing={Platform.OS === "web" ? enviarMensaje : undefined}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && { opacity: 0.4 }]}
            onPress={enviarMensaje}
            disabled={!texto.trim() || enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendTexto}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  backTexto:         { fontSize: 18 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#1a3a8f", justifyContent: "center", alignItems: "center",
  },
  headerAvatarLetra: { fontSize: 16, fontWeight: "900", color: "#fff" },
  headerTextos:      { flex: 1 },
  headerNombre:      { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  headerTipo:        { fontSize: 12, color: "#888", fontWeight: "600", marginTop: 1 },
  separador:         { height: 1, backgroundColor: "#e0dcd8" },

  listaPadding:  { padding: 16, gap: 4 },
  fechaSeparador:{ alignItems: "center", marginVertical: 10 },
  fechaTexto:    { fontSize: 12, color: "#aaa", fontWeight: "600", textTransform: "capitalize" },

  burbuja: {
    maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    marginVertical: 2,
  },
  burbujaAjena:       { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  burbujaPropia:      { backgroundColor: "#1a3a8f", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  burbujaTexto:       { fontSize: 15, color: "#1a1a1a" },
  burbujaTextoPropio: { color: "#fff" },
  burbujaHora:        { fontSize: 10, color: "#aaa", marginTop: 4, textAlign: "right" },
  burbujaHoraPropia:  { color: "rgba(255,255,255,0.6)" },

  vacio:      { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80, gap: 6 },
  vacioTexto: { fontSize: 16, fontWeight: "700", color: "#aaa" },
  vacioSub:   { fontSize: 14, color: "#bbb" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0dcd8",
  },
  input: {
    flex: 1, backgroundColor: "#f7f4f0", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: "#1a1a1a", maxHeight: 100,
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#1a3a8f", justifyContent: "center", alignItems: "center",
  },
  sendTexto: { color: "#fff", fontSize: 16 },
});