import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  obtenerDepartamento,
  Departamento,
  obtenerIdsFavoritos,
  toggleFavorito,
  URL_BASE,
} from "./../../services/api";
import { useAuth } from "./../context/AuthContext";

const { width } = Dimensions.get("window");

type Opinion = {
  id: number;
  nombre: string;
  calificacion: number;
  comentario: string;
  meses: number;
};

const OPINIONES_MOCK: Opinion[] = [
  { id: 1, nombre: "Juan Pérez",   calificacion: 4, comentario: "Increíble ubicación, buen precio, recámaras limpias, lo volvería a rentar", meses: 9 },
  { id: 2, nombre: "Michel Gámez", calificacion: 4, comentario: "Excelente departamento, cuenta con todo lo que dice la publicación",         meses: 6 },
  { id: 3, nombre: "Benito",       calificacion: 3, comentario: "Esta bien, nada fuera de lo normal",                                          meses: 3 },
  { id: 4, nombre: "Laura Torres", calificacion: 5, comentario: "Súper limpio y bien ubicado, el arrendador es muy amable",                    meses: 12 },
  { id: 5, nombre: "Carlos Ruiz",  calificacion: 4, comentario: "Buen departamento, cerca del metro, recomendado",                             meses: 2 },
];

// ── TOP_ICONS solo con los íconos estáticos ──
const TOP_ICONS = [
  { key: "perfil",   emoji: "👤", route: "/usuarios/perfil" },
  { key: "chat",     emoji: "💬", route: "/mensajes" },
  { key: "ajustes",  emoji: "⚙️", route: "/configuracion" },
  { key: "favoritos", emoji: "🤍", route: "/favoritos" },
];

const AMENIDADES = [
  { key: "amueblado",       label: "Amueblado",      emoji: "🛋" },
  { key: "internet",        label: "Internet",        emoji: "📶" },
  { key: "estacionamiento", label: "Estacionamiento", emoji: "🚗" },
  { key: "pet_friendly",    label: "Pet friendly",    emoji: "🐾" },
  { key: "cocina",          label: "Cocina",          emoji: "🍳" },
];

const Estrellas = ({ calificacion, size = 18 }: { calificacion: number; size?: number }) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Text key={i} style={{ fontSize: size }}>{i <= calificacion ? "⭐" : "☆"}</Text>
    ))}
  </View>
);

const TarjetaOpinion = ({ op }: { op: Opinion }) => (
  <View style={styles.opinionCard}>
    <View style={styles.opinionHeader}>
      <View style={styles.opinionAvatar}>
        <Text style={styles.opinionAvatarTexto}>👤</Text>
      </View>
      <Text style={styles.opinionNombre} numberOfLines={1}>{op.nombre}</Text>
    </View>
    <Estrellas calificacion={op.calificacion} size={14} />
    <Text style={styles.opinionComentario} numberOfLines={4}>{op.comentario}</Text>
    <Text style={styles.opinionMeses}>Rentó por {op.meses} meses</Text>
  </View>
);

export default function DetalleDepa() {
  const { id } = useLocalSearchParams();
  const router  = useRouter();
  const { usuario } = useAuth();

  const [depa, setDepa]                     = useState<Departamento | null>(null);
  const [cargando, setCargando]             = useState(true);
  const [modalOcupado, setModalOcupado]     = useState(false);
  const [mostrarTodas, setMostrarTodas]     = useState(false);
  const [iconActivo, setIconActivo]         = useState<string | null>(null);
  const [opinionIndex, setOpinionIndex]     = useState(0);
  const [mostrarTodasOp, setMostrarTodasOp] = useState(false);
  const [esFavorito, setEsFavorito]         = useState(false);
  const [arrendadorInfo, setArrendadorInfo] = useState<any | null>(null);

  // Carga departamento
  useEffect(() => {
    if (id) {
      obtenerDepartamento(Number(id))
        .then((data) => { setDepa(data); setCargando(false); })
        .catch(() => setCargando(false));
    }
  }, [id]);

  // Carga detalles del arrendador si el departamento lo tiene como id
  useEffect(() => {
    if (!depa) return;
    const arr = (depa as any).arrendador;
    if (!arr) return;
    // Si ya viene como objeto con nombres/apellidos
    if (typeof arr === 'object') {
      setArrendadorInfo(arr);
      return;
    }
    // Si viene como id, solicitar al endpoint de usuarios
    (async () => {
      try {
        const r = await fetch(`${URL_BASE}/usuarios/${arr}/`);
        if (!r.ok) throw new Error('No encontrado');
        const data = await r.json();
        setArrendadorInfo(data);
      } catch (_) {
        setArrendadorInfo(null);
      }
    })();
  }, [depa]);

  // Verifica si es favorito una vez que depa carga
  useEffect(() => {
    if (!usuario || !depa) return;
    obtenerIdsFavoritos(usuario.id)
      .then(ids => setEsFavorito(ids.includes(depa.id)))
      .catch(() => {});
  }, [usuario?.id, depa?.id]);

  const handleToggleFavorito = async () => {
    if (!usuario || !depa) return;
    await toggleFavorito(usuario.id, depa.id, esFavorito);
    setEsFavorito(prev => !prev);
  };

  const handleIconPress = (route: string, key: string) => {
    setIconActivo(key);
    router.push(route as any);
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <Text style={styles.cargandoTexto}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!depa) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <Text style={styles.cargandoTexto}>No se encontró el departamento.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const amenidadesActivas   = AMENIDADES.filter((a) => (depa as any)[a.key]);
  const amenidadesMostradas = mostrarTodas ? amenidadesActivas : amenidadesActivas.slice(0, 3);
  const opinionesMostradas  = mostrarTodasOp ? OPINIONES_MOCK : OPINIONES_MOCK.slice(opinionIndex, opinionIndex + 3);
  const calificacionPromedio = (depa && (depa as any).calificacion != null)
    ? Number((depa as any).calificacion)
    : OPINIONES_MOCK.reduce((s, o) => s + o.calificacion, 0) / OPINIONES_MOCK.length;

  const handleApartar = () => {
    const arrId = arrendadorInfo?.id ?? (typeof (depa as any).arrendador === 'object' ? (depa as any).arrendador.id : Number((depa as any).arrendador));
    if (usuario && arrId && usuario.id === arrId) {
      alert('Lo sentimos pero no es posible apartar tu propio departamento');
      return;
    }
    if (!depa.disponible) setModalOcupado(true);
    else alert("¡Departamento apartado!");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.accionBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.accionEmoji}>←</Text>
          </TouchableOpacity>
          <View style={styles.topIconsLeft}>
            {TOP_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic.key}
                style={[styles.topIconBtn, iconActivo === ic.key && styles.topIconBtnActivo]}
                onPress={() => handleIconPress(ic.route, ic.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.topIconEmoji}>{ic.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.topLogos}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoTexto}>IPN</Text>
          </View>
          <View style={[styles.logoBadge, { backgroundColor: "#003366" }]}> 
            <Text style={styles.logoTexto}>ESCOM</Text>
          </View>
        </View>
      </View>

      <View style={styles.separador} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Imagen principal ── */}
        <View style={styles.imagenContainer}>
          <Image
            source={{ uri: depa.imagen_principal || "https://via.placeholder.com/400x250" }}
            style={styles.imagen}
          />
          <TouchableOpacity
            style={styles.fotosBtn}
            onPress={() => router.push(`/departamento/fotos?id=${depa.id}`)}
          >
            <Text style={styles.fotosBtnTexto}>Toca para ver más fotos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info principal ── */}
        <View style={styles.infoContainer}>
          <View style={styles.tituloRow}>
            {/* Favorito conectado también aquí */}
            <TouchableOpacity onPress={handleToggleFavorito}>
              <Text style={styles.favEmoji}>{esFavorito ? "❤️" : "🤍"}</Text>
            </TouchableOpacity>
            <Text style={styles.titulo} numberOfLines={2}>{depa.titulo}</Text>
            <Text style={styles.vistasEmoji}>👁</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statTexto}>{typeof (depa as any).favoritos_count !== 'undefined' ? `${(depa as any).favoritos_count} Favoritos` : '50 Favoritos'}</Text>
            <Text style={styles.statTexto}>{(depa as any).vistas_mes ?? 1000} Vistas</Text>
          </View>
          <Text style={styles.descripcion}>
            {depa.descripcion ||
              `${depa.cuartos} recámara(s), cocina, sala, comedor. Ubicación cercana a puntos clave de la CDMX.\nLa estación de metro más cercana es ${depa.metro_cercano}.`}
          </Text>
          {depa.tipo_renta && (
            <View style={styles.tipoBadge}>
              <Text style={styles.tipoTexto}>
                {depa.tipo_renta === "solo_mujeres" ? "👩 Solo mujeres"
                  : depa.tipo_renta === "solo_hombres" ? "👨 Solo hombres"
                  : "👥 Mixto"}
              </Text>
            </View>
          )}
          <Text style={styles.seccionTitulo}>Este departamento ofrece</Text>
          {amenidadesMostradas.map((a) => (
            <View key={a.key} style={styles.amenidadRow}>
              <Text style={styles.amenidadEmoji}>{a.emoji}</Text>
              <Text style={styles.amenidadLabel}>{a.label}</Text>
            </View>
          ))}
          <View style={styles.botonesRow}>
            {amenidadesActivas.length > 3 && (
              <TouchableOpacity
                style={styles.btnSecundario}
                onPress={() => setMostrarTodas(!mostrarTodas)}
              >
                <Text style={styles.btnTexto}>
                  {mostrarTodas ? "Ver menos" : "Mostrar todas las amenidades"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnPrimario} onPress={handleApartar}>
              <Text style={styles.btnTexto}>Apartar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ Ubicación ══ */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeaderRow}>
            <Text style={styles.seccionTitulo}>Ubicación</Text>
                      </View>
          <Text style={styles.ubicacionDireccion}>{depa.colonia}, {depa.alcaldia}</Text>
          <Text style={styles.ubicacionDireccion}>{depa.direccion}</Text>
          <View style={styles.mapaContainer}>
            <View style={styles.mapaFondo}>
              <Text style={styles.mapaNota}>🗺 Mapa — se conectará a Google Maps</Text>
              <View style={styles.mapaPin}>
                <Text style={styles.mapaPinTexto}>📍</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.mapaRutasBtn}>
              <Text style={styles.mapaRutasBtnTexto}>Toca para generar rutas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ Información de contacto ══ */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información de contacto</Text>
          <View style={styles.contactoGrid}>
            <View style={styles.contactoIzq}>
              <TouchableOpacity style={styles.contactoItem}>
                <Text style={styles.contactoTexto}>📱 WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactoItem}>
                <Text style={styles.contactoTexto}>📞 Teléfono fijo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactoItem}>
                <Text style={styles.contactoTexto}>🌐 Sitio Web</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.agendarBtn}
              onPress={() => router.push(`/departamento/agendar?id=${depa.id}`)}
            >
              <Text style={styles.agendarBtnTexto}>Agendar visita al departamento</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ Calificación y opiniones ══ */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Calificación General:</Text>
          <View style={styles.calificacionRow}>
            <Estrellas calificacion={Math.round(calificacionPromedio)} size={28} />
            <Text style={styles.calificacionNumero}>({OPINIONES_MOCK.length} opiniones)</Text>
          </View>

          <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Opiniones Y Sugerencias:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.opinionesScroll}
          >
            {opinionesMostradas.map((op) => <TarjetaOpinion key={op.id} op={op} />)}
          </ScrollView>

          <View style={styles.carruselNav}>
            <TouchableOpacity
              style={styles.carruselBtn}
              onPress={() => setOpinionIndex(Math.max(0, opinionIndex - 1))}
            >
              <Text style={styles.carruselBtnTexto}>←</Text>
            </TouchableOpacity>
            <View style={styles.carruselDots}>
              {OPINIONES_MOCK.map((_, i) => (
                <View key={i} style={[styles.dot, opinionIndex === i && styles.dotActivo]} />
              ))}
            </View>
            <TouchableOpacity
              style={styles.carruselBtn}
              onPress={() => setOpinionIndex(Math.min(OPINIONES_MOCK.length - 1, opinionIndex + 1))}
            >
              <Text style={styles.carruselBtnTexto}>→</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.btnSecundario}
            onPress={() => setMostrarTodasOp(!mostrarTodasOp)}
          >
            <Text style={styles.btnTexto}>
              {mostrarTodasOp ? "Ver menos evaluaciones" : "Mostrar el resto de evaluaciones"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══ Conoce al arrendador ══ */}
        <View style={[styles.seccion, { marginBottom: 100 }]}>
          <Text style={styles.seccionTitulo}>Conoce al arrendador</Text>
          <View style={styles.arrendadorCard}>
            <View style={styles.arrendadorIzq}>
              <View style={styles.arrendadorAvatarContainer}>
                <View style={styles.arrendadorAvatar}>
                  <Text style={styles.arrendadorAvatarTexto}>👤</Text>
                </View>
                <View style={styles.verificadoBadge}>
                  <Text style={styles.verificadoTexto}>✓</Text>
                </View>
              </View>
              <Text style={styles.arrendadorNombre} numberOfLines={2}>
                {arrendadorInfo ? `${arrendadorInfo.nombres || ''} ${arrendadorInfo.apellidos || ''}` : String((depa as any).arrendador) }
              </Text>
            </View>
            <View style={styles.arrendadorDer}>
              <Text style={styles.arrendadorStat}>140 Evaluaciones</Text>
              <Text style={styles.arrendadorStat}>4.5 ⭐</Text>
              <Text style={styles.arrendadorStat}>4 años en la app</Text>
              <Text style={styles.arrendadorStat}>INE Verificada</Text>
              <View style={styles.arrendadorContactoBtns}>
                <TouchableOpacity style={styles.arrendadorContactoBtn}>
                  <Text style={styles.arrendadorContactoBtnTexto}>📱</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrendadorContactoBtn}>
                  <Text style={styles.arrendadorContactoBtnTexto}>✉️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
            <TouchableOpacity
              style={styles.btnContactarArrendador}
              onPress={async () => {
                if (!usuario) { router.push('/usuarios/login'); return; }
                // Determinar id del arrendador
                const arrId = arrendadorInfo?.id ?? (typeof (depa as any).arrendador === 'object' ? (depa as any).arrendador.id : Number((depa as any).arrendador));
                if (arrId && usuario.id === arrId) {
                  alert('Lo sentimos pero no es posible crear un chat para si mismo');
                  return;
                }
                const busqueda = arrendadorInfo?.nombre_usuario || `${arrendadorInfo?.nombres || ''} ${arrendadorInfo?.apellidos || ''}` || String((depa as any).arrendador);
                try {
                  const res = await fetch(`${URL_BASE}/mensajes/${usuario.id}/chats/crear/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ busqueda }),
                  });
                  if (!res.ok) throw new Error('No se pudo crear chat');
                  const chat = await res.json();
                  // Navegar al chat creado
                  router.push(`/mensajes/${chat.id}`);
                } catch (e) {
                  alert('Error al crear chat con el arrendador');
                }
              }}
            >
              <Text style={styles.btnTexto}>Contactar al arrendador</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Precio fijo abajo ── */}
      <View style={styles.precioBar}>
        <Text style={styles.precioTexto}>${depa.precio.toLocaleString()} MXN/mes</Text>
      </View>

      {/* ── Modal: Departamento ocupado ── */}
      <Modal visible={modalOcupado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Este departamento{"\n"}ya está ocupado</Text>
            <Text style={styles.modalEmoji}>⚠️</Text>
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalOcupado(false)}>
                <Text style={styles.modalBtnTexto}>Regresar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => { setModalOcupado(false); router.back(); }}
              >
                <Text style={styles.modalBtnTexto}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  cargandoContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  cargandoTexto: { fontSize: 16, color: "#888" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#f7f4f0",
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIconsLeft: { flexDirection: "row", gap: 6 },
  topIconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1.5, borderColor: "#e0dcd8",
  },
  topIconBtnActivo: { backgroundColor: "#e63946", borderColor: "#e63946" },
  topIconEmoji: { fontSize: 18 },
  topLogos: { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge: { backgroundColor: "#8B0000", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  logoTexto: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  separador: { height: 1, backgroundColor: "#e0dcd8" },
  accionesBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  accionesRight: { flexDirection: "row", gap: 8 },
  accionBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#e0dcd8",
  },
  accionEmoji: { fontSize: 17 },
  imagenContainer: { position: "relative", marginHorizontal: 16, borderRadius: 18, overflow: "hidden" },
  imagen: { width: "100%", height: 220, backgroundColor: "#c0cfff" },
  fotosBtn: {
    position: "absolute", top: 12, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  fotosBtnTexto: { color: "#fff", fontSize: 13, fontWeight: "600" },
  infoBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 16,
    width: 32, height: 32, justifyContent: "center", alignItems: "center",
  },
  infoBtnTexto: { fontSize: 16 },
  infoContainer: { paddingHorizontal: 20, paddingTop: 16 },
  tituloRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  favEmoji: { fontSize: 22 },
  titulo: { flex: 1, fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  vistasEmoji: { fontSize: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginBottom: 12 },
  statTexto: { fontSize: 12, color: "#888", fontWeight: "600" },
  descripcion: { fontSize: 14, color: "#555", lineHeight: 22, marginBottom: 12 },
  tipoBadge: {
    alignSelf: "flex-start", backgroundColor: "#fde8ea",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
  },
  tipoTexto: { fontSize: 13, fontWeight: "700", color: "#e63946" },
  amenidadRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ece8",
  },
  amenidadEmoji: { fontSize: 22, width: 32 },
  amenidadLabel: { fontSize: 15, color: "#333", fontWeight: "500" },
  botonesRow: { flexDirection: "row", gap: 10, marginTop: 20, flexWrap: "wrap" },
  seccion: {
    paddingHorizontal: 20, paddingTop: 24,
    borderTopWidth: 1, borderTopColor: "#e0dcd8", marginTop: 16,
  },
  seccionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seccionTitulo: { fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 12 },
  vistasTexto: { fontSize: 15, fontWeight: "700", color: "#555" },
  ubicacionDireccion: { fontSize: 14, color: "#555", marginBottom: 4 },
  mapaContainer: { marginTop: 12, borderRadius: 16, overflow: "hidden" },
  mapaFondo: {
    height: 180, backgroundColor: "#d4e8c2", borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#b5d49a", position: "relative",
  },
  mapaNota: { fontSize: 13, color: "#555", fontWeight: "600" },
  mapaPin: { position: "absolute", bottom: 40 },
  mapaPinTexto: { fontSize: 32 },
  mapaRutasBtn: {
    position: "absolute", bottom: 12, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  mapaRutasBtnTexto: { color: "#fff", fontWeight: "700", fontSize: 13 },
  contactoGrid: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  contactoIzq: { flex: 1, gap: 8 },
  contactoItem: {
    backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  contactoTexto: { fontSize: 14, color: "#333", fontWeight: "600" },
  agendarBtn: {
    flex: 1, backgroundColor: "#f0e8c8", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    justifyContent: "center", alignItems: "center",
  },
  agendarBtnTexto: { fontSize: 14, fontWeight: "800", color: "#7a6000", textAlign: "center", lineHeight: 20 },
  calificacionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  calificacionNumero: { fontSize: 18, fontWeight: "700", color: "#555" },
  opinionesScroll: { gap: 12, paddingVertical: 8 },
  opinionCard: {
    width: width * 0.6, backgroundColor: "#fff", borderRadius: 14,
    padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  opinionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  opinionAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#e0dcd8", justifyContent: "center", alignItems: "center",
  },
  opinionAvatarTexto: { fontSize: 16 },
  opinionNombre: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  opinionComentario: { fontSize: 12, color: "#555", lineHeight: 18, marginTop: 6 },
  opinionMeses: { fontSize: 11, color: "#aaa", marginTop: 8 },
  carruselNav: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 12, marginBottom: 12,
  },
  carruselBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0dcd8",
    justifyContent: "center", alignItems: "center",
  },
  carruselBtnTexto: { fontSize: 16, color: "#333" },
  carruselDots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e0dcd8" },
  dotActivo: { backgroundColor: "#e63946", width: 20 },
  arrendadorCard: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 16,
    padding: 16, gap: 16, shadowColor: "#000",
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 14,
  },
  arrendadorIzq: { alignItems: "center", flex: 1 },
  arrendadorAvatarContainer: { position: "relative", marginBottom: 8 },
  arrendadorAvatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: "#e0dcd8", justifyContent: "center", alignItems: "center",
  },
  arrendadorAvatarTexto: { fontSize: 36 },
  verificadoBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#1a9ed4", justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  verificadoTexto: { color: "#fff", fontSize: 12, fontWeight: "900" },
  arrendadorNombre: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  arrendadorInfo: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 2 },
  arrendadorDer: { flex: 1, justifyContent: "center", gap: 6 },
  arrendadorStat: { fontSize: 13, color: "#333", fontWeight: "600" },
  arrendadorContactoBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
  arrendadorContactoBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#f0ece8", justifyContent: "center", alignItems: "center",
  },
  arrendadorContactoBtnTexto: { fontSize: 18 },
  btnContactarArrendador: {
    backgroundColor: "#1a3a8f", borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  btnSecundario: {
    flex: 1, backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", minWidth: 140,
  },
  btnPrimario: {
    flex: 1, backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", minWidth: 120,
  },
  btnTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },
  precioBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#d0d8e8", paddingVertical: 16, alignItems: "center",
    borderTopWidth: 1, borderTopColor: "#c0c8d8",
  },
  precioTexto: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 32,
  },
  modalContenido: {
    backgroundColor: "#3a5fcf", borderRadius: 24,
    padding: 28, alignItems: "center", width: "100%",
  },
  modalTitulo: {
    fontSize: 20, fontWeight: "900", color: "#fff",
    textAlign: "center", marginBottom: 16, lineHeight: 28,
  },
  modalEmoji: { fontSize: 48, marginBottom: 20 },
  modalBotones: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: {
    flex: 1, backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  modalBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
});