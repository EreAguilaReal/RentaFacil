import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { Linking } from "react-native";

const { width } = Dimensions.get("window");

// ── Tipos ─────────────────────────────────────────────────────────

type Calificacion = {
  id: number;
  calificacion: number;
  comentario: string;
  aspectos_positivos: string[];
  fecha: string;
  creado: boolean;
  arrendatario: {
    id: number;
    nombre: string;
  };
};

type Reporte = {
  id: number;
  categoria: string;
  descripcion: string;
  fecha: string;
  revisado: boolean;
  arrendatario: {
    id: number;
    nombre: string;
  };
};

// ── Constantes ────────────────────────────────────────────────────

const TOP_ICONS = [
  { key: "perfil",    emoji: "👤", route: "/usuarios/perfil" },
  { key: "chat",      emoji: "💬", route: "/mensajes" },
  { key: "ajustes",   emoji: "⚙️",  route: "/configuracion" },
  { key: "favoritos", emoji: "🤍", route: "/favoritos" },
];

const AMENIDADES = [
  { key: "amueblado",       label: "Amueblado",       emoji: "🛋" },
  { key: "internet",        label: "Internet",         emoji: "📶" },
  { key: "estacionamiento", label: "Estacionamiento",  emoji: "🚗" },
  { key: "pet_friendly",    label: "Pet friendly",     emoji: "🐾" },
  { key: "cocina",          label: "Cocina",           emoji: "🍳" },
];

// ── Sub-componentes ───────────────────────────────────────────────

const Estrellas = ({
  calificacion,
  size = 18,
}: {
  calificacion: number;
  size?: number;
}) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Text key={i} style={{ fontSize: size }}>
        {i <= calificacion ? "⭐" : "☆"}
      </Text>
    ))}
  </View>
);

const TarjetaCalificacion = ({ cal }: { cal: Calificacion }) => {
  const fecha = new Date(cal.fecha);
  const mesesTranscurridos = Math.max(
    1,
    Math.round(
      (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
  );

  return (
    <View style={styles.opinionCard}>
      <View style={styles.opinionHeader}>
        <View style={styles.opinionAvatar}>
          <Text style={styles.opinionAvatarTexto}>👤</Text>
        </View>
        <Text style={styles.opinionNombre} numberOfLines={1}>
          {cal.arrendatario?.nombre ?? "Usuario"}
        </Text>
      </View>
      <Estrellas calificacion={cal.calificacion} size={14} />
      {cal.comentario ? (
        <Text style={styles.opinionComentario} numberOfLines={4}>
          {cal.comentario}
        </Text>
      ) : null}
      {cal.aspectos_positivos?.length > 0 && (
        <View style={styles.aspectosContainer}>
          {cal.aspectos_positivos.slice(0, 3).map((a, i) => (
            <View key={i} style={styles.aspectoBadge}>
              <Text style={styles.aspectoTexto}>{a}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.opinionMeses}>
        Hace {mesesTranscurridos}{" "}
        {mesesTranscurridos === 1 ? "mes" : "meses"}
      </Text>
    </View>
  );
};

// ── Pantalla principal ────────────────────────────────────────────

export default function DetalleDepa() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();

  const [depa, setDepa] = useState<Departamento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modalOcupado, setModalOcupado] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [iconActivo, setIconActivo] = useState<string | null>(null);
  const [mostrarTodasOp, setMostrarTodasOp] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [arrendadorInfo, setArrendadorInfo] = useState<any | null>(null);

  // Datos reales del backend
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [cargandoCals, setCargandoCals] = useState(false);
  const [opinionIndex, setOpinionIndex] = useState(0);

  // ── Efectos ────────────────────────────────────────────────────

  // 1. Departamento
  useEffect(() => {
    if (!id) return;
    obtenerDepartamento(Number(id))
      .then((data) => {
        setDepa(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [id]);
  // Registrar vista al abrir la pantalla
  useEffect(() => {
    if (!id) return;
    fetch(`${URL_BASE}/departamentos/${id}/vista/`, { method: "POST" }).catch(() => {});
  }, [id]);
  // 2. Arrendador
  useEffect(() => {
    if (!depa) return;
    const arr = (depa as any).arrendador;
    if (!arr) return;
    if (typeof arr === "object") {
      setArrendadorInfo(arr);
      return;
    }
    (async () => {
      try {
        const r = await fetch(`${URL_BASE}/usuarios/${arr}/`);
        if (!r.ok) throw new Error("No encontrado");
        const data = await r.json();
        setArrendadorInfo(data);
      } catch {
        setArrendadorInfo(null);
      }
    })();
  }, [depa]);

  // 3. Favoritos
  useEffect(() => {
    if (!usuario || !depa) return;
    obtenerIdsFavoritos(usuario.id)
      .then((ids) => setEsFavorito(ids.includes(depa.id)))
      .catch(() => {});
  }, [usuario?.id, depa?.id]);

  // 4. Calificaciones reales
  useEffect(() => {
    if (!id) return;
    setCargandoCals(true);
    fetch(`${URL_BASE}/departamentos/${id}/calificaciones/`)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar calificaciones");
        return r.json();
      })
      .then((data) => {
        // El endpoint GET no existe en el código original pero es coherente
        // con el patrón REST; si devuelve lista directa la usamos tal cual
        const lista = Array.isArray(data) ? data : data.results ?? [];
        setCalificaciones(lista);
      })
      .catch(() => setCalificaciones([]))
      .finally(() => setCargandoCals(false));
  }, [id]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleToggleFavorito = async () => {
    if (!usuario || !depa) return;
    await toggleFavorito(usuario.id, depa.id, esFavorito);
    setEsFavorito((prev) => !prev);
  };

  const handleIconPress = (route: string, key: string) => {
    setIconActivo(key);
    router.push(route as any);
  };

  const handleApartar = () => {
    const arrId =
      arrendadorInfo?.id ??
      (typeof (depa as any).arrendador === "object"
        ? (depa as any).arrendador.id
        : Number((depa as any).arrendador));

    if (usuario && arrId && usuario.id === arrId) {
      alert("Lo sentimos pero no es posible apartar tu propio departamento");
      return;
    }
    if (!depa?.disponible) setModalOcupado(true);
    else alert("¡Departamento apartado!");
  };

  // ── Estado de carga / error ────────────────────────────────────

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

  if (!depa) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <Text style={styles.cargandoTexto}>
            No se encontró el departamento.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Datos derivados ───────────────────────────────────────────

  const amenidadesActivas = AMENIDADES.filter((a) => (depa as any)[a.key]);
  const amenidadesMostradas = mostrarTodas
    ? amenidadesActivas
    : amenidadesActivas.slice(0, 3);
  // ¿El usuario actual es el arrendador?
  const esArrendador = (() => {
    if (!usuario || !depa) return false;
    const arrId =
      arrendadorInfo?.id ??
      (typeof (depa as any).arrendador === "object"
        ? (depa as any).arrendador?.id
        : Number((depa as any).arrendador));
    return usuario.id === arrId;
  })();
  // Calificación: usar el campo del modelo si existe, o calcular del array
  const calificacionPromedio =
    (depa as any).calificacion != null
      ? Number((depa as any).calificacion)
      : calificaciones.length > 0
      ? calificaciones.reduce((s, c) => s + c.calificacion, 0) /
        calificaciones.length
      : 0;

  const totalOpiniones = calificaciones.length;

  // Paginación de opiniones: 3 en modo horizontal, todas en modo expandido
  const opinionesMostradas = mostrarTodasOp
    ? calificaciones
    : calificaciones.slice(opinionIndex, opinionIndex + 3);

  // Nombre arrendador real (viene del serializer como arrendador_nombre)
  const nombreArrendador = (() => {
    if ((depa as any).arrendador_nombre) return (depa as any).arrendador_nombre;
    if (arrendadorInfo)
      return `${arrendadorInfo.nombres ?? ""} ${
        arrendadorInfo.apellidos ?? ""
      }`.trim();
    return String((depa as any).arrendador ?? "");
  })();

  // Estadísticas del arrendador (vienen del objeto usuario si se extendió)
  const arrendadorEvaluaciones =
    arrendadorInfo?.total_evaluaciones ?? arrendadorInfo?.evaluaciones ?? null;
  const arrendadorCalificacion =
    arrendadorInfo?.calificacion_promedio ?? arrendadorInfo?.calificacion ?? null;
  const arrendadorAnios =
    arrendadorInfo?.anios_en_app ??
    (arrendadorInfo?.fecha_registro
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(arrendadorInfo.fecha_registro).getTime()) /
              (1000 * 60 * 60 * 24 * 365)
          )
        )
      : null);

  // ── Render ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.accionBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Text style={styles.accionEmoji}>←</Text>
          </TouchableOpacity>
          <View style={styles.topIconsLeft}>
            {TOP_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic.key}
                style={[
                  styles.topIconBtn,
                  iconActivo === ic.key && styles.topIconBtnActivo,
                ]}
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
            source={{
              uri:
                depa.imagen_principal ||
                "https://via.placeholder.com/400x250",
            }}
            style={styles.imagen}
          />
          <TouchableOpacity
            style={styles.fotosBtn}
            onPress={() =>
              router.push(`/departamento/fotos?id=${depa.id}`)
            }
          >
            <Text style={styles.fotosBtnTexto}>Toca para ver más fotos</Text>
          </TouchableOpacity>
        </View>
        {/* ── Info principal ── */}
        <View style={styles.infoContainer}>
          <View style={styles.tituloRow}>
            <TouchableOpacity onPress={handleToggleFavorito}>
              <Text style={styles.favEmoji}>
                {esFavorito ? "❤️" : "🤍"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.titulo} numberOfLines={2}>
              {depa.titulo}
            </Text>
          </View>

          {esArrendador && depa.disponible && (
            <TouchableOpacity
              style={styles.btnContactarArrendador}
              onPress={() =>
                router.push({
                  pathname: "/departamento/editar" as any,
                  params: { id: String(depa.id) },
                })
              }
            >
              <Text style={styles.btnTexto}>✏️ Editar departamento</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.statsRow}>
            <Text style={styles.statTexto}>
              {typeof (depa as any).favoritos_count !== "undefined"
                ? `${(depa as any).favoritos_count} Favoritos`
                : "— Favoritos"}
            </Text>
            <Text style={styles.statTexto}>
              {(depa as any).vistas_mes ?? 0} Vistas este mes
            </Text>
            <Text style={styles.statTexto}>
              {depa.cuartos}{" "}
              {depa.cuartos === 1 ? "cuarto" : "cuartos"}
            </Text>
          </View>

          <Text style={styles.descripcion}>
            {depa.descripcion ||
              `${depa.cuartos} recámara(s), cocina, sala, comedor. Ubicación cercana a puntos clave de la CDMX.${
                depa.metro_cercano
                  ? `\nEstación de metro más cercana: ${depa.metro_cercano}.`
                  : ""
              }`}
          </Text>

          {depa.tipo_renta && (
            <View style={styles.tipoBadge}>
              <Text style={styles.tipoTexto}>
                {depa.tipo_renta === "solo_mujeres"
                  ? "👩 Solo mujeres"
                  : depa.tipo_renta === "solo_hombres"
                  ? "👨 Solo hombres"
                  : "👥 Mixto"}
              </Text>
            </View>
          )}

          {/* Badge disponibilidad */}
          <View
            style={[
              styles.disponibilidadBadge,
              {
                backgroundColor: depa.disponible ? "#e8f5e9" : "#fde8ea",
              },
            ]}
          >
            <Text
              style={[
                styles.disponibilidadTexto,
                { color: depa.disponible ? "#2e7d32" : "#e63946" },
              ]}
            >
              {depa.disponible
                ? "✅ Disponible"
                : depa.rentado_hasta
                ? `🔒 Ocupado hasta ${depa.rentado_hasta}`
                : "🔒 No disponible"}
            </Text>
          </View>

          {/* Metro cercano */}
          {depa.metro_cercano ? (
            <View style={styles.metroBadge}>
              <Text style={styles.metroTexto}>
                🚇 Metro: {depa.metro_cercano}
              </Text>
            </View>
          ) : null}

          <Text style={styles.seccionTitulo}>Este departamento ofrece</Text>

          {amenidadesActivas.length === 0 ? (
            <Text style={styles.sinAmenidades}>
              Sin amenidades registradas
            </Text>
          ) : (
            amenidadesMostradas.map((a) => (
              <View key={a.key} style={styles.amenidadRow}>
                <Text style={styles.amenidadEmoji}>{a.emoji}</Text>
                <Text style={styles.amenidadLabel}>{a.label}</Text>
              </View>
            ))
          )}

          <View style={styles.botonesRow}>
            {amenidadesActivas.length > 3 && (
              <TouchableOpacity
                style={styles.btnSecundario}
                onPress={() => setMostrarTodas(!mostrarTodas)}
              >
                <Text style={styles.btnTexto}>
                  {mostrarTodas
                    ? "Ver menos"
                    : "Mostrar todas las amenidades"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.btnPrimario}
              onPress={handleApartar}
            >
              <Text style={styles.btnTexto}>Apartar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ Ubicación ══ */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Ubicación</Text>
          <Text style={styles.ubicacionDireccion}>
            {depa.colonia}, {depa.alcaldia}
          </Text>
          <Text style={styles.ubicacionDireccion}>{depa.direccion}</Text>
          <View style={styles.mapaContainer}>
            <View style={styles.mapaFondo}>
              <Text style={styles.mapaNota}>
                🗺 Mapa — se conectará a Google Maps
              </Text>
              <View style={styles.mapaPin}>
                <Text style={styles.mapaPinTexto}>📍</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.mapaRutasBtn}>
              <Text style={styles.mapaRutasBtnTexto}>
                Toca para generar rutas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ Información de contacto ══ */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información de contacto</Text>

          <View style={styles.contactoGrid}>
            <View style={styles.contactoIzq}>

              {/* WhatsApp */}
              {arrendadorInfo?.whatsapp ? (
                <TouchableOpacity
                  style={styles.contactoItem}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${arrendadorInfo.whatsapp.replace(/\D/g, "")}`
                    )
                  }
                >
                  <Text style={styles.contactoTexto}>
                    📱 {arrendadorInfo.whatsapp}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.contactoItem, { opacity: 0.4 }]}>
                  <Text style={styles.contactoTexto}>
                    📱 WhatsApp no disponible
                  </Text>
                </View>
              )}

              {/* Teléfono */}
              {arrendadorInfo?.telefono ? (
                <TouchableOpacity
                  style={styles.contactoItem}
                  onPress={() =>
                    Linking.openURL(`tel:${arrendadorInfo.telefono}`)
                  }
                >
                  <Text style={styles.contactoTexto}>
                    📞 {arrendadorInfo.telefono}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.contactoItem, { opacity: 0.4 }]}>
                  <Text style={styles.contactoTexto}>
                    📞 Teléfono no disponible
                  </Text>
                </View>
              )}

              {/* Sitio web */}
              {arrendadorInfo?.sitio_web ? (
                <TouchableOpacity
                  style={styles.contactoItem}
                  onPress={() => {
                    const url = arrendadorInfo.sitio_web.startsWith("http")
                      ? arrendadorInfo.sitio_web
                      : `https://${arrendadorInfo.sitio_web}`;

                    Linking.openURL(url);
                  }}
                >
                  <Text style={styles.contactoTexto}>
                    🌐 {arrendadorInfo.sitio_web}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.contactoItem, { opacity: 0.4 }]}>
                  <Text style={styles.contactoTexto}>
                    🌐 Sitio web no disponible
                  </Text>
                </View>
              )}

            </View>

            <TouchableOpacity
              style={styles.agendarBtn}
              onPress={() =>
                router.push({
                  pathname: "/departamento/agendar",
                  params: { id: depa.id.toString() },
                })
              }
            >
              <Text style={styles.agendarBtnTexto}>
                Agendar visita al departamento
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ Calificación y opiniones ══ */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Calificación General:</Text>

          {cargandoCals ? (
            <ActivityIndicator
              size="small"
              color="#1a3a8f"
              style={{ marginBottom: 12 }}
            />
          ) : totalOpiniones === 0 ? (
            <Text style={styles.sinOpiniones}>
              Aún no hay opiniones para este departamento.
            </Text>
          ) : (
            <>
              <View style={styles.calificacionRow}>
                <Estrellas
                  calificacion={Math.round(calificacionPromedio)}
                  size={28}
                />
                <Text style={styles.calificacionNumero}>
                  {calificacionPromedio.toFixed(1)} (
                  {totalOpiniones}{" "}
                  {totalOpiniones === 1 ? "opinión" : "opiniones"})
                </Text>
              </View>

              <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>
                Opiniones Y Sugerencias:
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.opinionesScroll}
              >
                {opinionesMostradas.map((cal) => (
                  <TarjetaCalificacion key={cal.id} cal={cal} />
                ))}
              </ScrollView>

              {/* Carrusel (solo si hay más de 3 y no está expandido) */}
              {!mostrarTodasOp && totalOpiniones > 3 && (
                <View style={styles.carruselNav}>
                  <TouchableOpacity
                    style={styles.carruselBtn}
                    onPress={() =>
                      setOpinionIndex(Math.max(0, opinionIndex - 1))
                    }
                  >
                    <Text style={styles.carruselBtnTexto}>←</Text>
                  </TouchableOpacity>
                  <View style={styles.carruselDots}>
                    {calificaciones.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          opinionIndex === i && styles.dotActivo,
                        ]}
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.carruselBtn}
                    onPress={() =>
                      setOpinionIndex(
                        Math.min(totalOpiniones - 1, opinionIndex + 1)
                      )
                    }
                  >
                    <Text style={styles.carruselBtnTexto}>→</Text>
                  </TouchableOpacity>
                </View>
              )}

              {totalOpiniones > 3 && (
                <TouchableOpacity
                  style={styles.btnSecundario}
                  onPress={() => setMostrarTodasOp(!mostrarTodasOp)}
                >
                  <Text style={styles.btnTexto}>
                    {mostrarTodasOp
                      ? "Ver menos evaluaciones"
                      : "Mostrar el resto de evaluaciones"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ══ Conoce al arrendador ══ */}
        <View style={[styles.seccion, { marginBottom: 100 }]}>
          <Text style={styles.seccionTitulo}>Conoce al arrendador</Text>
          <View style={styles.arrendadorCard}>
            <View style={styles.arrendadorIzq}>
              <View style={styles.arrendadorAvatarContainer}>
                {arrendadorInfo?.foto_perfil ? (
                  <Image
                    source={{ uri: arrendadorInfo.foto_perfil }}
                    style={styles.arrendadorAvatar}
                  />
                ) : (
                  <View style={styles.arrendadorAvatar}>
                    <Text style={styles.arrendadorAvatarTexto}>👤</Text>
                  </View>
                )}
                {arrendadorInfo?.verificado && (
                  <View style={styles.verificadoBadge}>
                    <Text style={styles.verificadoTexto}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.arrendadorNombre} numberOfLines={2}>
                {nombreArrendador || "Arrendador"}
              </Text>
              {arrendadorInfo?.correo ? (
                <Text style={styles.arrendadorInfo} numberOfLines={1}>
                  {arrendadorInfo.correo}
                </Text>
              ) : null}
            </View>

            <View style={styles.arrendadorDer}>
              {arrendadorEvaluaciones != null ? (
                <Text style={styles.arrendadorStat}>
                  {arrendadorEvaluaciones} Evaluaciones
                </Text>
              ) : null}
              {arrendadorCalificacion != null ? (
                <Text style={styles.arrendadorStat}>
                  {Number(arrendadorCalificacion).toFixed(1)} ⭐
                </Text>
              ) : null}
              {arrendadorAnios != null ? (
                <Text style={styles.arrendadorStat}>
                  {arrendadorAnios}{" "}
                  {arrendadorAnios === 1 ? "año" : "años"} en la app
                </Text>
              ) : null}
              {arrendadorInfo?.ine_verificada ||
              arrendadorInfo?.verificado ? (
                <Text style={styles.arrendadorStat}>Identidad Verificada ✓</Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnContactarArrendador}
            onPress={async () => {
              if (!usuario) {
                router.push("/usuarios/login");
                return;
              }
              const arrId =
                arrendadorInfo?.id ??
                (typeof (depa as any).arrendador === "object"
                  ? (depa as any).arrendador.id
                  : Number((depa as any).arrendador));

              if (!arrId) {
                alert("No se pudo identificar al arrendador");
                return;
              }
              if (usuario.id === arrId) {
                alert("No es posible crear un chat para ti mismo");
                return;
              }

              router.push({
                pathname: "/(tabs)/mensajes/[id]" as any,
                params: {
                  id: String(arrId),
                  nombre: nombreArrendador,
                  tipo: "arrendador",
                },
              });
            }}
          >
            <Text style={styles.btnTexto}>Contactar al arrendador</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Precio fijo abajo ── */}
      <View style={styles.precioBar}>
        <Text style={styles.precioTexto}>
          ${depa.precio.toLocaleString()} MXN/mes
        </Text>
      </View>

      {/* ── Modal: Departamento ocupado ── */}
      <Modal visible={modalOcupado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>
              Este departamento{"\n"}ya está ocupado
            </Text>
            <Text style={styles.modalEmoji}>⚠️</Text>
            {depa.rentado_hasta ? (
              <Text style={styles.modalSubtitulo}>
                Disponible a partir del {depa.rentado_hasta}
              </Text>
            ) : null}
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setModalOcupado(false)}
              >
                <Text style={styles.modalBtnTexto}>Regresar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setModalOcupado(false);
                  router.back();
                }}
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

// ── Estilos ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  cargandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  cargandoTexto: { fontSize: 16, color: "#888" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f7f4f0",
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIconsLeft: { flexDirection: "row", gap: 6 },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
  },
  topIconBtnActivo: { backgroundColor: "#e63946", borderColor: "#e63946" },
  topIconEmoji: { fontSize: 18 },
  topLogos: { flexDirection: "row", gap: 6, alignItems: "center" },
  logoBadge: {
    backgroundColor: "#8B0000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoTexto: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  separador: { height: 1, backgroundColor: "#e0dcd8" },
  accionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0dcd8",
  },
  accionEmoji: { fontSize: 17 },
  imagenContainer: {
    position: "relative",
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  imagen: { width: "100%", height: 220, backgroundColor: "#c0cfff" },
  fotosBtn: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  fotosBtnTexto: { color: "#fff", fontSize: 13, fontWeight: "600" },
  infoContainer: { paddingHorizontal: 20, paddingTop: 16 },
  tituloRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  favEmoji: { fontSize: 22 },
  titulo: { flex: 1, fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  vistasEmoji: { fontSize: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 4,
  },
  statTexto: { fontSize: 12, color: "#888", fontWeight: "600" },
  descripcion: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 12,
  },
  tipoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fde8ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  tipoTexto: { fontSize: 13, fontWeight: "700", color: "#e63946" },
  disponibilidadBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  disponibilidadTexto: { fontSize: 13, fontWeight: "700" },
  metroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8eaf6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  metroTexto: { fontSize: 13, fontWeight: "600", color: "#3949ab" },
  amenidadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ece8",
  },
  amenidadEmoji: { fontSize: 22, width: 32 },
  amenidadLabel: { fontSize: 15, color: "#333", fontWeight: "500" },
  sinAmenidades: { fontSize: 14, color: "#aaa", marginBottom: 12 },
  botonesRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    alignItems: "center",
  },
  seccion: {
    paddingHorizontal: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e0dcd8",
    marginTop: 16,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  ubicacionDireccion: { fontSize: 14, color: "#555", marginBottom: 4 },
  mapaContainer: { marginTop: 12, borderRadius: 16, overflow: "hidden" },
  mapaFondo: {
    height: 180,
    backgroundColor: "#d4e8c2",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b5d49a",
    position: "relative",
  },
  mapaNota: { fontSize: 13, color: "#555", fontWeight: "600" },
  mapaPin: { position: "absolute", bottom: 40 },
  mapaPinTexto: { fontSize: 32 },
  mapaRutasBtn: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapaRutasBtnTexto: { color: "#fff", fontWeight: "700", fontSize: 13 },
  contactoGrid: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  contactoIzq: { flex: 1, gap: 8 },
  contactoItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  contactoTexto: { fontSize: 14, color: "#333", fontWeight: "600" },
  agendarBtn: {
    flex: 1,
    backgroundColor: "#f0e8c8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  agendarBtnTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7a6000",
    textAlign: "center",
    lineHeight: 20,
  },
  calificacionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  calificacionNumero: { fontSize: 18, fontWeight: "700", color: "#555" },
  sinOpiniones: { fontSize: 14, color: "#aaa", marginBottom: 12 },
  opinionesScroll: { gap: 12, paddingVertical: 8 },
  opinionCard: {
    width: width * 0.6,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  opinionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  opinionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0dcd8",
    justifyContent: "center",
    alignItems: "center",
  },
  opinionAvatarTexto: { fontSize: 16 },
  opinionNombre: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  opinionComentario: {
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
    marginTop: 6,
  },
  aspectosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  aspectoBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aspectoTexto: { fontSize: 11, color: "#2e7d32", fontWeight: "600" },
  opinionMeses: { fontSize: 11, color: "#aaa", marginTop: 8 },
  carruselNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  carruselBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0dcd8",
    justifyContent: "center",
    alignItems: "center",
  },
  carruselBtnTexto: { fontSize: 16, color: "#333" },
  carruselDots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e0dcd8" },
  dotActivo: { backgroundColor: "#e63946", width: 20 },
  arrendadorCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 14,
  },
  arrendadorIzq: { alignItems: "center", flex: 1 },
  arrendadorAvatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  arrendadorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e0dcd8",
    justifyContent: "center",
    alignItems: "center",
  },
  arrendadorAvatarTexto: { fontSize: 36 },
  verificadoBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1a9ed4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  verificadoTexto: { color: "#fff", fontSize: 12, fontWeight: "900" },
  arrendadorNombre: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  arrendadorInfo: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
  },
  arrendadorDer: { flex: 1, justifyContent: "center", gap: 6 },
  arrendadorStat: { fontSize: 13, color: "#333", fontWeight: "600" },
  arrendadorContactoBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
  arrendadorContactoBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f0ece8",
    justifyContent: "center",
    alignItems: "center",
  },
  arrendadorContactoBtnTexto: { fontSize: 18 },
  btnContactarArrendador: {
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSecundario: {
    flex: 1, backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", minWidth: 140,
  },
  btnPrimario: {
        flex: 1, backgroundColor: "#1a3a8f", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", minWidth: 140,
  },
  btnTexto: { color: "#fff", fontWeight: "800", fontSize: 13},
  precioBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d0d8e8",
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#c0c8d8",
  },
  precioTexto: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalContenido: {
    backgroundColor: "#3a5fcf",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 28,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
    textAlign: "center",
  },
  modalEmoji: { fontSize: 48, marginBottom: 20 },
  modalBotones: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: {
    flex: 1,
    backgroundColor: "#1a3a8f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
});