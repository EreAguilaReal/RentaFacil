// app/(tabs)/configuracion.tsx
import React, { useEffect, useState } from "react";
import {
  Alert, Linking, Platform, ScrollView, StatusBar,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { URL_BASE } from "../../services/api";

// ── Componente fila de ajuste ─────────────────────────────────────
function FilaAjuste({
  emoji, label, descripcion, onPress, peligro = false, disabled = false,
}: {
  emoji: string; label: string; descripcion?: string;
  onPress: () => void; peligro?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.fila, disabled && styles.filaDisabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[styles.filaIcono, peligro && { backgroundColor: "#fde8ea" }]}>
        <Text style={styles.filaEmoji}>{emoji}</Text>
      </View>
      <View style={styles.filaTextos}>
        <Text style={[styles.filaLabel, peligro && { color: "#e63946" }]}>{label}</Text>
        {descripcion && <Text style={styles.filaDesc}>{descripcion}</Text>}
      </View>
      <Text style={styles.filaChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Componente fila con switch ────────────────────────────────────
function FilaSwitch({
  emoji, label, descripcion, valor, onChange,
}: {
  emoji: string; label: string; descripcion?: string;
  valor: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.fila}>
      <View style={styles.filaIcono}>
        <Text style={styles.filaEmoji}>{emoji}</Text>
      </View>
      <View style={styles.filaTextos}>
        <Text style={styles.filaLabel}>{label}</Text>
        {descripcion && <Text style={styles.filaDesc}>{descripcion}</Text>}
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        trackColor={{ false: "#e0dcd8", true: "#1a3a8f" }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Componente título de sección ──────────────────────────────────
function SeccionTitulo({ titulo }: { titulo: string }) {
  return <Text style={styles.seccionTitulo}>{titulo}</Text>;
}

// ── Pantalla principal ────────────────────────────────────────────
export default function Configuracion() {
  const router          = useRouter();
  const { usuario, logout } = useAuth();

  const [notificaciones, setNotificaciones] = useState(false);
  const [mensajesNuevos, setMensajesNuevos] = useState(false);
  const [temaOscuro, setTemaOscuro]         = useState(false);
  const [puedeEliminarCuenta, setPuedeEliminarCuenta] = useState(true);
  const [motivoEliminarCuenta, setMotivoEliminarCuenta] = useState<string | null>(null);

  const mostrarEnDesarrollo = () => {
    const mensaje = "Lo sentimos, se encuentra en desarrollo";
    if (Platform.OS === "web") {
      window.alert(mensaje);
    } else {
      Alert.alert("En desarrollo", mensaje);
    }
  };

  useEffect(() => {
    if (!usuario) return;

    fetch(`${URL_BASE}/usuarios/${usuario.id}/`)
      .then((r) => r.json())
      .then((data) => {
        const permitido = data.puede_eliminar_cuenta ?? true;
        setPuedeEliminarCuenta(permitido);

        if (!permitido) {
          if (data.tiene_departamentos) {
            setMotivoEliminarCuenta("No puedes eliminar tu cuenta mientras tengas departamentos registrados.");
          } else if (data.tiene_citas) {
            setMotivoEliminarCuenta("No puedes eliminar tu cuenta mientras tengas citas activas.");
          } else if (data.tiene_departamento_rentado) {
            setMotivoEliminarCuenta("No puedes eliminar tu cuenta mientras tengas un departamento rentado.");
          } else {
            setMotivoEliminarCuenta("No puedes eliminar tu cuenta en este momento.");
          }
        } else {
          setMotivoEliminarCuenta(null);
        }
      })
      .catch(() => {
        setPuedeEliminarCuenta(true);
        setMotivoEliminarCuenta(null);
      });
  }, [usuario?.id]);

  const confirmarCerrarSesion = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Seguro que quieres cerrar sesión?")) {
        logout();
        router.replace("/usuarios/login");
      }
    } else {
      Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión", style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/usuarios/login");
          },
        },
      ]);
    }
  };

  const eliminarCuenta = async () => {
    if (!usuario) return;
    try {
      const response = await fetch(`${URL_BASE}/usuarios/${usuario.id}/`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error ?? "No se pudo eliminar la cuenta");
        return;
      }
      await logout();
      router.replace("/usuarios/login");
    } catch (error) {
      alert("No se pudo eliminar la cuenta");
    }
  };

  const confirmarEliminarCuenta = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Eliminar tu cuenta? Esta acción no se puede deshacer.")) {
        eliminarCuenta();
      }
    } else {
      Alert.alert(
        "Eliminar cuenta",
        "Esta acción es permanente y no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: eliminarCuenta },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Configuración</Text>
      </View>
      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Cuenta ── */}
        <SeccionTitulo titulo="Cuenta" />
        <View style={styles.seccion}>
          <FilaAjuste
            emoji="👤"
            label="Ver perfil"
            descripcion={usuario ? `@${usuario.nombre_usuario}` : ""}
            onPress={() => router.push("/usuarios/perfil")}
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="✏️"
            label="Editar datos"
            descripcion="Nombre, fecha de nacimiento, género"
            onPress={() => router.push("/usuarios/editar")}
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="🔒"
            label="Cambiar contraseña"
            descripcion="Actualiza tu contraseña de acceso"
            onPress={() => router.push("/usuarios/cambiar-password")}
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="📄"
            label="Documento de verificación"
            descripcion="Sube o actualiza tu documento"
            onPress={() => router.push("/usuarios/perfil")}
          />
        </View>

        {/* ── Notificaciones ── */}
        <SeccionTitulo titulo="Notificaciones" />
        <View style={styles.seccion}>
          <FilaSwitch
            emoji="🔔"
            label="Notificaciones"
            descripcion="Activar o desactivar todas las notificaciones"
            valor={notificaciones}
            onChange={() => mostrarEnDesarrollo()}
          />
          <View style={styles.separadorFila} />
          <FilaSwitch
            emoji="💬"
            label="Mensajes nuevos"
            descripcion="Recibir alertas de nuevos mensajes"
            valor={mensajesNuevos}
            onChange={() => mostrarEnDesarrollo()}
          />
        </View>

        {/* ── Apariencia ── */}
        <SeccionTitulo titulo="Apariencia" />
        <View style={styles.seccion}>
          <FilaSwitch
            emoji="🌙"
            label="Tema oscuro"
            descripcion="Cambiar entre tema claro y oscuro"
            valor={temaOscuro}
            onChange={() => mostrarEnDesarrollo()}
          />
        </View>

        {/* ── Acerca de ── */}
        <SeccionTitulo titulo="Acerca de" />
        <View style={styles.seccion}>
          <FilaAjuste
            emoji="🏫"
            label="Instituto Politécnico Nacional"
            descripcion="www.ipn.mx"
            onPress={() => Linking.openURL("https://www.ipn.mx")}
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="💻"
            label="ESCOM"
            descripcion="Escuela Superior de Cómputo"
            onPress={() => Linking.openURL("https://www.escom.ipn.mx")}
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="📋"
            label="Términos y condiciones"
            descripcion="Consulta nuestros términos de uso"
            onPress={() => {}}
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="🔏"
            label="Política de privacidad"
            descripcion="Cómo manejamos tus datos"
            onPress={() => {}}
          />
          <View style={styles.separadorFila} />
          <View style={styles.fila}>
            <View style={styles.filaIcono}>
              <Text style={styles.filaEmoji}>📱</Text>
            </View>
            <View style={styles.filaTextos}>
              <Text style={styles.filaLabel}>Versión de la app</Text>
              <Text style={styles.filaDesc}>RentaFácil v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* ── Sesión ── */}
        <SeccionTitulo titulo="Sesión" />
        <View style={styles.seccion}>
          <FilaAjuste
            emoji="🚪"
            label="Cerrar sesión"
            onPress={confirmarCerrarSesion}
            peligro
          />
          <View style={styles.separadorFila} />
          <FilaAjuste
            emoji="🗑"
            label="Eliminar cuenta"
            descripcion={motivoEliminarCuenta ?? "Esta acción es permanente"}
            onPress={confirmarEliminarCuenta}
            peligro
            disabled={!puedeEliminarCuenta}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTexto}>RentaFácil © 2025 · IPN ESCOM</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f4f0" },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitulo: { fontSize: 26, fontWeight: "900", color: "#1a1a1a" },
  separador:    { height: 1, backgroundColor: "#e0dcd8" },
  scroll:       { paddingBottom: 40 },

  seccionTitulo: {
    fontSize: 12, fontWeight: "800", color: "#aaa",
    letterSpacing: 0.8, textTransform: "uppercase",
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8,
  },
  seccion: {
    marginHorizontal: 16, backgroundColor: "#fff",
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  fila: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  filaIcono: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f0ece8", justifyContent: "center", alignItems: "center",
  },
  filaEmoji:   { fontSize: 18 },
  filaTextos:  { flex: 1 },
  filaLabel:   { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  filaDesc:    { fontSize: 12, color: "#aaa", marginTop: 2 },
  filaChevron: { fontSize: 20, color: "#ccc", fontWeight: "300" },
  filaDisabled: { opacity: 0.45 },

  separadorFila: { height: 1, backgroundColor: "#f0ece8", marginLeft: 66 },

  footer: { alignItems: "center", paddingTop: 32 },
  footerTexto: { fontSize: 12, color: "#ccc", fontWeight: "600" },
});