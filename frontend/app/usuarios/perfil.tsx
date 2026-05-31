import React, { useEffect, useState } from "react";
import { useAuth } from "./../context/AuthContext";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { URL_BASE } from "../../services/api";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

const MEDIA_BASE = Platform.OS === "web"
  ? "http://localhost:8000/"
  : "http://192.168.1.84:8000/";

const GENERO_LABEL: Record<string, string> = {
  M: "Masculino", F: "Femenino", O: "Otro", P: "Prefiero no decirlo",
};
const TIPO_LABEL: Record<string, string> = {
  admin: "Administrador", arrendatario: "Arrendatario", arrendador: "Arrendador",
};

type EstadoVerificacion = "pendiente" | "aprobado" | "rechazado" | "";

type Departamento = {
  id: number;
  titulo: string;
  colonia: string;
  disponible: boolean;
  precio: number;
  vistas_mes?: number;
  calificacion?: number;
  rentado_hasta?: string;
  inquilino_nombre?: string;
};

// ── Subcomponentes ────────────────────────────────────────────────
function FilaDato({ emoji, label, valor }: { emoji: string; label: string; valor: string }) {
  return (
    <View style={styles.filaRow}>
      <Text style={styles.filaEmoji}>{emoji}</Text>
      <View style={styles.filaTextos}>
        <Text style={styles.filaLabel}>{label}</Text>
        <Text style={styles.filaValor}>{valor}</Text>
      </View>
    </View>
  );
}

function Estrellas({ valor }: { valor: number | null | undefined }) {
  const num = valor != null ? parseFloat(String(valor)) : null;
  return (
    <Text style={{ fontSize: 13, color: "#f4a500" }}>
      {num != null && !isNaN(num)
        ? `${"⭐".repeat(Math.round(num))} ${num.toFixed(1)}`
        : "Sin calificación"}
    </Text>
  );
}

// ── Vista Arrendador ──────────────────────────────────────────────
function VistaArrendador({ depas, cargando, router }: {
  depas: Departamento[]; cargando: boolean; router: any;
}) {
  const totalVistas = depas.reduce((s, d) => s + (d.vistas_mes ?? 0), 0);
  const promCalif   = depas.length
    ? depas.reduce((s, d) => s + (d.calificacion ?? 0), 0) / depas.length
    : 0;

  return (
    <>
      <View style={styles.seccionContainer}>
        <Text style={styles.seccionTitulo}>🏢 Mis departamentos</Text>
        {cargando ? (
          <ActivityIndicator color="#1a3a8f" />
        ) : depas.length === 0 ? (
          <Text style={styles.vaciTexto}>No tienes departamentos registrados aún.</Text>
        ) : (
          depas.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.depCard}
              onPress={() => router.push(`/departamento/${d.id}`)}
            >
              <Text style={styles.depTitulo}>{d.titulo}</Text>
              <Text style={styles.depSub}>{d.colonia}</Text>
              <View style={styles.chipsRow}>
                <View style={d.disponible ? styles.chipAmber : styles.chipGreen}>
                  <Text style={d.disponible ? styles.chipAmberTexto : styles.chipGreenTexto}>
                    {d.disponible ? "Disponible" : "Rentado"}
                  </Text>
                </View>
                {d.vistas_mes !== undefined && (
                  <View style={styles.chipBlue}>
                    <Text style={styles.chipBlueTexto}>{d.vistas_mes} vistas/mes</Text>
                  </View>
                )}
                {d.calificacion !== null && (
                  <View style={styles.chipAmber}>
                    <Text style={styles.chipAmberTexto}>{Number(d.calificacion).toFixed(1) ?? "Sin calificación"} ★</Text>
                  </View>
                )}
              </View>
              {!d.disponible && d.inquilino_nombre && (
                <Text style={styles.depMeta}>
                  👤 {d.inquilino_nombre}{d.rentado_hasta ? `  · Hasta: ${d.rentado_hasta}` : ""}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          style={styles.btnAgregar}
          onPress={() => router.push("/departamento/nuevo")}
        >
          <Text style={styles.btnAgregarTexto}>＋ Agregar departamento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seccionContainer}>
        <Text style={styles.seccionTitulo}>📊 Reportes</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalVistas}</Text>
            <Text style={styles.statLabel}>Vistas este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{promCalif.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Calificación promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{depas.length}</Text>
            <Text style={styles.statLabel}>Departamentos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{depas.filter(d => !d.disponible).length}</Text>
            <Text style={styles.statLabel}>Rentados</Text>
          </View>
        </View>
      </View>
    </>
  );
}

// ── Vista Arrendatario ────────────────────────────────────────────
function VistaArrendatario({ depas, cargando, router }: {
  depas: Departamento[]; cargando: boolean; router: any;
}) {
  return (
    <View style={styles.seccionContainer}>
      <Text style={styles.seccionTitulo}>🏠 Mi departamento</Text>
      {cargando ? (
        <ActivityIndicator color="#1a3a8f" />
      ) : depas.length === 0 ? (
        <Text style={styles.vaciTexto}>No tienes un departamento rentado actualmente.</Text>
      ) : (
        depas.map((d) => (
          <View key={d.id} style={styles.depCard}>
            <Text style={styles.depTitulo}>{d.titulo}</Text>
            <Text style={styles.depSub}>{d.colonia}</Text>
            {d.rentado_hasta && (
              <Text style={styles.depMeta}>📅 Rentado hasta: {d.rentado_hasta}</Text>
            )}
            {d.calificacion != null && <Estrellas valor={d.calificacion} />}
            <View style={styles.accionesDepRow}>
              <TouchableOpacity
                style={[styles.btnAccion, styles.btnDanger]}
                onPress={() => router.push(`/departamento/${d.id}/reporte`)}
              >
                <Text style={styles.btnTextoBlanco}>⚠ Reportar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnAccion}
                onPress={() => router.push(`/departamento/${d.id}/calificar`)}
              >
                <Text style={styles.btnTextoOscuro}>★ Calificar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAccion, styles.btnPrimary]}
                onPress={() => router.push(`/departamento/${d.id}/contacto`)}
              >
                <Text style={styles.btnTextoBlanco}>📞 Contactar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ── Vista Staff ───────────────────────────────────────────────────
type DocPendiente = {
  id: number;
  usuario_nombre: string;
  tipo_usuario: string;
  url: string;
};

function VistaStaff({ router }: { router: any }) {
  const [docs, setDocs]   = useState<DocPendiente[]>([]);
  const [depas, setDepas] = useState<Departamento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${URL_BASE}/usuarios/documentos-pendientes/`).then(r => r.json()),
      fetch(`${URL_BASE}/departamentos/?disponible=false`).then(r => r.json()),
    ])
      .then(([d, dep]) => { setDocs(d); setDepas(dep); })
      .finally(() => setCargando(false));
  }, []);

  const accionDoc = async (id: number, accion: "aprobar" | "rechazar") => {
    await fetch(`${URL_BASE}/usuarios/${id}/verificar-documento/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion }),
    });
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <>
      <View style={styles.seccionContainer}>
        <Text style={styles.seccionTitulo}>📄 Documentos pendientes</Text>
        {cargando ? (
          <ActivityIndicator color="#1a3a8f" />
        ) : docs.length === 0 ? (
          <Text style={styles.vaciTexto}>No hay documentos pendientes.</Text>
        ) : (
          docs.map((doc) => (
            <View key={doc.id} style={styles.docRow}>
              <View style={styles.docIcono}>
                <Text style={{ fontSize: 20 }}>📄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docNombre} numberOfLines={1}>{doc.usuario_nombre}</Text>
                <Text style={styles.docSub}>{TIPO_LABEL[doc.tipo_usuario] ?? doc.tipo_usuario}</Text>
              </View>
              <View style={styles.docBtns}>
                <TouchableOpacity
                  style={styles.btnDoc}
                  onPress={() => Linking.openURL(`${MEDIA_BASE}${doc.url}`)}
                >
                  <Text style={styles.btnDocTexto}>👁</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnDoc, styles.btnDocGreen]}
                  onPress={() => accionDoc(doc.id, "aprobar")}
                >
                  <Text style={styles.btnDocTexto}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnDoc, styles.btnDocRed]}
                  onPress={() => accionDoc(doc.id, "rechazar")}
                >
                  <Text style={styles.btnDocTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.seccionContainer}>
        <Text style={styles.seccionTitulo}>🏢 Rentas activas</Text>
        {cargando ? (
          <ActivityIndicator color="#1a3a8f" />
        ) : depas.length === 0 ? (
          <Text style={styles.vaciTexto}>Sin rentas activas.</Text>
        ) : (
          depas.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.depCard}
              onPress={() => router.push(`/departamento/${d.id}`)}
            >
              <Text style={styles.depTitulo}>{d.titulo}</Text>
              <Text style={styles.depSub}>{d.colonia}</Text>
              <View style={styles.chipsRow}>
                <View style={styles.chipGreen}>
                  <Text style={styles.chipGreenTexto}>Activo</Text>
                </View>
                {d.vistas_mes !== undefined && (
                  <View style={styles.chipBlue}>
                    <Text style={styles.chipBlueTexto}>{d.vistas_mes} vistas/mes</Text>
                  </View>
                )}
                {d.calificacion !== null && (
                  <View style={styles.chipAmber}>
                    <Text style={styles.chipAmberTexto}>{Number(d.calificacion).toFixed(1) ?? "Sin calificación"} ★</Text>
                  </View>
                )}
              </View>
              {d.inquilino_nombre && (
                <Text style={styles.depMeta}>
                  👤 {d.inquilino_nombre}{d.rentado_hasta ? `  · Hasta: ${d.rentado_hasta}` : ""}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function Perfil() {
  const router = useRouter();
  const { logout, usuario, actualizarUsuario } = useAuth();
  const [depas, setDepas]             = useState<Departamento[]>([]);
  const [cargandoDepas, setCargandoDepas] = useState(false);

  // Refresca datos del usuario cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (!usuario) return;
      fetch(`${URL_BASE}/usuarios/${usuario.id}/`)
        .then(r => r.json())
        .then(data => actualizarUsuario(data))
        .catch(() => {});
    }, [usuario?.id])
  );

  // Carga departamentos según rol
  useEffect(() => {
    if (!usuario) return;
    const esArrendador   = usuario.tipo_usuario === "arrendador";
    const esArrendatario = usuario.tipo_usuario === "arrendatario";
    if (!esArrendador && !esArrendatario) return;

    setCargandoDepas(true);
    const endpoint = esArrendador
      ? `${URL_BASE}/departamentos/?arrendador=${usuario.id}`
      : `${URL_BASE}/departamentos/?inquilino=${usuario.id}`;

    fetch(endpoint)
      .then(r => r.json())
      .then(setDepas)
      .finally(() => setCargandoDepas(false));
  }, [usuario?.id]); // solo se re-ejecuta si cambia el id

  const refrescarUsuario = async () => {
    if (!usuario) return;
    try {
      const r = await fetch(`${URL_BASE}/usuarios/${usuario.id}/`);
      await actualizarUsuario(await r.json());
    } catch {}
  };

  const handleSubirDocumento = async () => {
    if (!usuario) return;
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (resultado.canceled) return;
      const archivo  = resultado.assets[0];
      const formData = new FormData();
      if (Platform.OS === "web") {
        formData.append("documento_verificacion", archivo.file as File, archivo.name);
      } else {
        formData.append("documento_verificacion", {
          uri: archivo.uri, name: archivo.name, type: "application/pdf",
        } as any);
      }
      const r = await fetch(
        `${URL_BASE}/usuarios/${usuario.id}/subir-documento/`,
        { method: "PATCH", body: formData }
      );
      if (!r.ok) { alert("Error al subir el documento"); return; }
      await refrescarUsuario();
      alert("Documento subido. En espera de verificación.");
    } catch { alert("No se pudo subir el documento"); }
  };

  const handleEliminarDocumento = async () => {
    if (!usuario) return;
    try {
      const r = await fetch(
        `${URL_BASE}/usuarios/${usuario.id}/subir-documento/`,
        {
          method: "PATCH",
          body: JSON.stringify({ documento_verificacion: null }),
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!r.ok) { alert("Error al eliminar el documento"); return; }
      await refrescarUsuario();
    } catch { alert("No se pudo eliminar el documento"); }
  };

  if (!usuario) return null;

  const esArrendador   = usuario.tipo_usuario === "arrendador";
  const esArrendatario = usuario.tipo_usuario === "arrendatario";
  const esStaff        = usuario.tipo_usuario === "admin";

  // Leer campos con fallback seguro por si el backend aún no los devuelve
  const verificado:         boolean               = (usuario as any).verificado          ?? false;
  const estadoVerificacion: EstadoVerificacion    = (usuario as any).estado_verificacion ?? "";

  const mostrarDoc = (esArrendador || esArrendatario) && !verificado;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLogos}>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.ipn.mx")}>
            <View style={styles.logoBadge}><Text style={styles.logoTexto}>IPN</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.escom.ipn.mx")}>
            <View style={[styles.logoBadge, { backgroundColor: "#003366" }]}>
              <Text style={styles.logoTexto}>ESCOM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Barra de acciones */}
        <View style={styles.accionesBar}>
          <TouchableOpacity style={styles.accionBtn} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.accionEmoji}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accionBtnEditar}
            onPress={() => router.push("/usuarios/editar")}
          >
            <Text style={styles.accionEmoji}>✏️</Text>
            <Text style={styles.accionEditarTexto}>Editar datos</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCirculo}>
            <Text style={styles.avatarLetra}>{usuario.nombres.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.nombreCompleto}>{usuario.nombres} {usuario.apellidos}</Text>
          <Text style={styles.nombreUsuario}>@{usuario.nombre_usuario}</Text>
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoTexto}>{TIPO_LABEL[usuario.tipo_usuario] ?? usuario.tipo_usuario}</Text>
          </View>
        </View>

        {/* Datos personales */}
        <View style={styles.seccionContainer}>
          <Text style={styles.seccionTitulo}>Información personal</Text>
          <FilaDato emoji="📧" label="Correo electrónico"  valor={usuario.correo_electronico} />
          <FilaDato emoji="🎂" label="Fecha de nacimiento" valor={usuario.fecha_nacimiento} />
          <FilaDato emoji="⚧"  label="Género"              valor={GENERO_LABEL[usuario.genero] ?? usuario.genero} />
        </View>

        {/* Verificación — visible también cuando está aprobado para mostrar confirmación */}
        {(esArrendador || esArrendatario) && (
          <View style={styles.seccionContainer}>
            <Text style={styles.seccionTitulo}>Verificación</Text>

            {/* ✅ Aprobado */}
            {verificado && (
              <View style={styles.docPendiente}>
                <Text style={styles.docEmoji}>✅</Text>
                <Text style={[styles.docTexto, { color: "#27500A", textAlign: "center" }]}>
                  Tu identidad ha sido verificada correctamente
                </Text>
              </View>
            )}

            {/* ❌ Rechazado */}
            {!verificado && estadoVerificacion === "rechazado" && (
              <View style={styles.docPendiente}>
                <Text style={styles.docEmoji}>❌</Text>
                <Text style={[styles.docTexto, { color: "#e63946", textAlign: "center" }]}>
                  Tu documento fue rechazado.{"\n"}Por favor sube uno nuevo.
                </Text>
                <TouchableOpacity style={styles.docBtn} onPress={handleSubirDocumento}>
                  <Text style={styles.docBtnTexto}>📎 Subir nuevo documento</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ⏳ Pendiente con documento subido */}
            {!verificado && estadoVerificacion === "pendiente" && usuario.documento_verificacion && (
              <View style={styles.docPendiente}>
                <Text style={styles.docEmoji}>⏳</Text>
                <Text style={styles.docTexto}>Documento en espera de verificación</Text>
                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={() => Linking.openURL(`${MEDIA_BASE}${usuario.documento_verificacion}`)}
                >
                  <Text style={styles.docBtnTexto}>📥 Ver documento</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.docBtn, { backgroundColor: "#e63946", marginTop: 8 }]}
                  onPress={handleEliminarDocumento}
                >
                  <Text style={styles.docBtnTexto}>🗑 Eliminar y subir nuevo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 📄 Sin documento */}
            {!verificado && !usuario.documento_verificacion && estadoVerificacion !== "rechazado" && (
              <View style={styles.docPendiente}>
                <Text style={styles.docEmoji}>📄</Text>
                <Text style={styles.docTexto}>Sin documento cargado</Text>
                <TouchableOpacity style={styles.docBtn} onPress={handleSubirDocumento}>
                  <Text style={styles.docBtnTexto}>Subir documento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Secciones por rol */}
        {esArrendador   && <VistaArrendador   depas={depas} cargando={cargandoDepas} router={router} />}
        {esArrendatario && <VistaArrendatario depas={depas} cargando={cargandoDepas} router={router} />}
        {esStaff        && <VistaStaff        router={router} />}

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.cerrarSesionBtn}
          onPress={async () => { await logout(); router.replace("/usuarios/login"); }}
        >
          <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  topBar: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#f7f4f0" },
  topLogos: { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge: { backgroundColor: "#8B0000", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  logoTexto: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  separador: { height: 1, backgroundColor: "#e0dcd8" },
  accionesBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  accionBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: "#e0dcd8" },
  accionEmoji: { fontSize: 17 },
  accionBtnEditar: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: "#e0dcd8" },
  accionEditarTexto: { fontSize: 13, fontWeight: "700", color: "#1a3a8f" },
  avatarContainer: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  avatarCirculo: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#1a3a8f", justifyContent: "center", alignItems: "center", marginBottom: 12, shadowColor: "#1a3a8f", shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  avatarLetra: { fontSize: 40, fontWeight: "900", color: "#fff" },
  nombreCompleto: { fontSize: 22, fontWeight: "900", color: "#1a1a1a" },
  nombreUsuario: { fontSize: 14, color: "#888", fontWeight: "600", marginTop: 2 },
  tipoBadge: { backgroundColor: "#fde8ea", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  tipoTexto: { fontSize: 13, fontWeight: "700", color: "#e63946" },
  seccionContainer: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#fff", borderRadius: 18, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  seccionTitulo: { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },
  filaRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ece8" },
  filaEmoji: { fontSize: 20, width: 28 },
  filaTextos: { flex: 1 },
  filaLabel: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  filaValor: { fontSize: 15, color: "#333", fontWeight: "600", marginTop: 2 },
  docPendiente: { alignItems: "center", gap: 8, paddingVertical: 8 },
  docEmoji: { fontSize: 28 },
  docTexto: { fontSize: 14, color: "#555", fontWeight: "600" },
  docBtn: { backgroundColor: "#1a3a8f", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  docBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },
  cerrarSesionBtn: { backgroundColor: "#e63946", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginHorizontal: 16, marginBottom: 40, marginTop: 8 },
  cerrarSesionTexto: { color: "#fff", fontWeight: "900", fontSize: 15 },
  vaciTexto: { fontSize: 14, color: "#aaa", textAlign: "center", paddingVertical: 12 },
  depCard: { borderWidth: 1, borderColor: "#e0dcd8", borderRadius: 12, padding: 12, marginBottom: 8 },
  depTitulo: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  depSub: { fontSize: 12, color: "#888", marginTop: 2 },
  depMeta: { fontSize: 12, color: "#555", marginTop: 6 },
  chipsRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  chipGreen: { backgroundColor: "#EAF3DE", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipGreenTexto: { fontSize: 11, fontWeight: "700", color: "#27500A" },
  chipAmber: { backgroundColor: "#FAEEDA", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipAmberTexto: { fontSize: 11, fontWeight: "700", color: "#633806" },
  chipBlue: { backgroundColor: "#E6F1FB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipBlueTexto: { fontSize: 11, fontWeight: "700", color: "#0C447C" },
  btnAgregar: { backgroundColor: "#1a3a8f", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  btnAgregarTexto: { color: "#fff", fontWeight: "800", fontSize: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: "#f0f4ff", borderRadius: 12, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "900", color: "#1a3a8f" },
  statLabel: { fontSize: 11, color: "#555", marginTop: 4, textAlign: "center" },
  accionesDepRow: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  btnAccion: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "#e0dcd8", minWidth: 80 },
  btnPrimary: { backgroundColor: "#1a3a8f", borderColor: "#1a3a8f" },
  btnDanger: { backgroundColor: "#e63946", borderColor: "#e63946" },
  btnTextoBlanco: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnTextoOscuro: { color: "#1a1a1a", fontWeight: "700", fontSize: 12 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ece8" },
  docIcono: { width: 36, height: 36, backgroundColor: "#E6F1FB", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  docNombre: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  docSub: { fontSize: 11, color: "#888", marginTop: 2 },
  docBtns: { flexDirection: "row", gap: 4 },
  btnDoc: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f0ece8", justifyContent: "center", alignItems: "center" },
  btnDocTexto: { fontSize: 14 },
  btnDocGreen: { backgroundColor: "#EAF3DE" },
  btnDocRed: { backgroundColor: "#fde8ea" },
});