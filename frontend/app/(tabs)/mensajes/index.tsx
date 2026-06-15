import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { URL_BASE } from "../../../services/api";

// ── tipos ─────────────────────────────────────────────────────────
interface OtroUsuario {
  id: number; nombres: string; apellidos: string;
  nombre_usuario: string; tipo_usuario: string;
}
interface UltimoMensaje {
  contenido: string; enviado_en: string; es_mio: boolean;
}
interface ChatItem {
  id: number; otro_usuario: OtroUsuario | null;
  ultimo_mensaje: UltimoMensaje | null;
  no_leidos: number; creado_en: string;
}

const TIPO_LABEL: Record<string, string> = {
  admin: "Administrador", arrendatario: "Arrendatario", arrendador: "Arrendador",
};

function iniciales(nombres: string, apellidos: string) {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function horaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return "Ahora";
  if (min < 60)  return `${min}m`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ── componente fila de chat ───────────────────────────────────────
function ChatFila({
  item, onPress, onEliminar,
}: { item: ChatItem; onPress: () => void; onEliminar: () => void }) {
  const otro = item.otro_usuario;
  return (
    <View style={styles.chatFila}>
      {/* Área clickeable principal — todo menos el botón eliminar */}
      <TouchableOpacity
        style={styles.chatFilaContenido}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>
            {otro ? iniciales(otro.nombres, otro.apellidos) : "?"}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatInfoTop}>
            <Text style={styles.chatNombre} numberOfLines={1}>
              {otro ? `${otro.nombres} ${otro.apellidos}` : "Usuario desconocido"}
            </Text>
            {item.ultimo_mensaje && (
              <Text style={styles.chatHora}>
                {horaRelativa(item.ultimo_mensaje.enviado_en)}
              </Text>
            )}
          </View>
          <View style={styles.chatInfoBottom}>
            <Text style={styles.chatTipo}>
              {otro ? (TIPO_LABEL[otro.tipo_usuario] ?? otro.tipo_usuario) : ""}
            </Text>
            {item.no_leidos > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{item.no_leidos}</Text>
              </View>
            )}
          </View>
          {item.ultimo_mensaje && (
            <Text style={styles.chatUltimo} numberOfLines={1}>
              {item.ultimo_mensaje.es_mio ? "Tú: " : ""}
              {item.ultimo_mensaje.contenido}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Botón eliminar — fuera del TouchableOpacity principal */}
      <TouchableOpacity
        style={styles.eliminarBtn}
        onPress={onEliminar}
        activeOpacity={0.6}
      >
        <Text style={styles.eliminarTexto}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── pantalla principal ────────────────────────────────────────────
export default function Mensajes() {
  const router          = useRouter();
  const { usuario }     = useAuth();
  const [chats, setChats]         = useState<ChatItem[]>([]);
  const [modalVisible, setModal]  = useState(false);
  const [busqueda, setBusqueda]   = useState("");
  const [buscando, setBuscando]   = useState(false);

  const [cargandoInicial, setCargandoInicial] = useState(true);

  const cargarChats = useCallback(async () => {
    if (!usuario) return;
    try {
      const res  = await fetch(`${URL_BASE}/mensajes/${usuario.id}/chats/`);
      const data = await res.json();
      setChats(data);
    } catch {
      // silencioso en polling
    } finally {
      setCargandoInicial(false);  // solo la primera vez muestra spinner
    }
  }, [usuario]);

  useEffect(() => {
    cargarChats();
    const intervalo = setInterval(cargarChats, 5000);  // refresca cada 5s
    return () => clearInterval(intervalo);
  }, [cargarChats]);

  const crearChat = async () => {
    if (!usuario || !busqueda.trim()) return;
    setBuscando(true);
    try {
      const res  = await fetch(`${URL_BASE}/mensajes/${usuario.id}/chats/crear/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ busqueda: busqueda.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.error ?? "No se pudo crear el chat");
        return;
      }
      setModal(false);
      setBusqueda("");
      await cargarChats();
      router.push({
        pathname: "/(tabs)/mensajes/[id]" as any,
        params: {
          id:             data.id,
          nombre:         `${data.otro_usuario?.nombres ?? ""} ${data.otro_usuario?.apellidos ?? ""}`.trim(),
          tipo:           data.otro_usuario?.tipo_usuario ?? "",
          nombre_usuario: data.otro_usuario?.nombre_usuario ?? "",
        },
      });
    } catch {
      Alert.alert("Error", "No se pudo crear el chat");
    } finally {
      setBuscando(false);
    }
  };

  const eliminarChat = async (chatId: number) => {
    const confirmar = Platform.OS === "web"
      ? window.confirm("¿Seguro que quieres eliminar esta conversación?")
      : await new Promise<boolean>(resolve =>
          Alert.alert(
            "Eliminar chat",
            "¿Seguro que quieres eliminar esta conversación?",
            [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
            ]
          )
        );

    if (!confirmar) return;

    await fetch(`${URL_BASE}/mensajes/${usuario!.id}/chats/${chatId}/eliminar/`, { method: "DELETE" });
    setChats(prev => prev.filter(c => c.id !== chatId));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Mensajes</Text>
        <TouchableOpacity style={styles.nuevoBtn} onPress={() => setModal(true)}>
          <Text style={styles.nuevoTexto}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.separador} />

      {/* Lista */}
      {cargandoInicial ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a3a8f" size="large" />
      ) : chats.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioEmoji}>💬</Text>
          <Text style={styles.vacioTexto}>Sin conversaciones</Text>
          <Text style={styles.vacioSub}>Toca + para iniciar un chat</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => (
            <ChatFila
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/mensajes/[id]" as any,
                  params: {
                    id:     String(item.otro_usuario?.id ?? item.id),
                    nombre: item.otro_usuario
                      ? `${item.otro_usuario.nombres} ${item.otro_usuario.apellidos}`
                      : "Chat",
                    tipo: item.otro_usuario?.tipo_usuario ?? "",
                    nombre_usuario: item.otro_usuario?.nombre_usuario ?? "",
                  },
                })
              }
              onEliminar={() => eliminarChat(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.listaSeparador} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal nuevo chat */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nuevo chat</Text>
            <Text style={styles.modalSub}>Busca por nombre o usuario</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre real o @usuario"
              placeholderTextColor="#aaa"
              value={busqueda}
              onChangeText={setBusqueda}
              autoFocus
              onSubmitEditing={crearChat}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => { setModal(false); setBusqueda(""); }}
              >
                <Text style={styles.modalBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnCrear, (!busqueda.trim() || buscando) && { opacity: 0.5 }]}
                onPress={crearChat}
                disabled={!busqueda.trim() || buscando}
              >
                {buscando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnCrearTexto}>Iniciar chat</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f4f0" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:  { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e0dcd8" },
  backTexto: { fontSize: 18 },
  headerTitulo: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  nuevoBtn:  { width: 38, height: 38, borderRadius: 10, backgroundColor: "#1a3a8f", justifyContent: "center", alignItems: "center" },
  nuevoTexto: { fontSize: 24, color: "#fff", fontWeight: "300", lineHeight: 30 },
  separador: { height: 1, backgroundColor: "#e0dcd8" },

 chatFila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingRight: 12,
  },
  chatFilaContenido: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#1a3a8f", justifyContent: "center", alignItems: "center",
  },
  avatarLetra:   { fontSize: 18, fontWeight: "900", color: "#fff" },
  chatInfo:      { flex: 1 },
  chatInfoTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatNombre:    { fontSize: 15, fontWeight: "800", color: "#1a1a1a", flex: 1, marginRight: 8 },
  chatHora:      { fontSize: 11, color: "#aaa", fontWeight: "600" },
  chatInfoBottom:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  chatTipo:      { fontSize: 12, color: "#888", fontWeight: "600" },
  chatUltimo:    { fontSize: 13, color: "#aaa", marginTop: 3 },
  badge: {
    backgroundColor: "#e63946", borderRadius: 10,
    minWidth: 20, height: 20, paddingHorizontal: 5,
    justifyContent: "center", alignItems: "center",
  },
  badgeTexto:    { color: "#fff", fontSize: 11, fontWeight: "800" },
  eliminarBtn:   { paddingLeft: 8 },
  eliminarTexto: { fontSize: 18 },
  listaSeparador:{ height: 1, backgroundColor: "#f0ece8", marginLeft: 78 },

  vacio:      { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  vacioSub:   { fontSize: 14, color: "#aaa" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
  },
  modalTitulo: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  modalSub:    { fontSize: 13, color: "#888" },
  modalInput: {
    borderWidth: 1.5, borderColor: "#e0dcd8", borderRadius: 12,
    padding: 14, fontSize: 15, color: "#1a1a1a", backgroundColor: "#f7f4f0",
  },
  modalBtns:           { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtnCancelar:    { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: "#e0dcd8", paddingVertical: 14, alignItems: "center" },
  modalBtnCancelarTexto: { fontWeight: "700", color: "#555" },
  modalBtnCrear:       { flex: 1, borderRadius: 12, backgroundColor: "#1a3a8f", paddingVertical: 14, alignItems: "center" },
  modalBtnCrearTexto:  { fontWeight: "800", color: "#fff" },
});