// app/legal/privacidad.tsx
import React from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

function SeccionPrivacidad({ emoji, titulo, children }: {
  emoji: string; titulo: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionHeader}>
        <View style={styles.iconoWrap}>
          <Text style={styles.icono}>{emoji}</Text>
        </View>
        <Text style={styles.seccionTitulo}>{titulo}</Text>
      </View>
      <Text style={styles.seccionCuerpo}>{children}</Text>
    </View>
  );
}

function TagDato({ texto }: { texto: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagTexto}>{texto}</Text>
    </View>
  );
}

export default function Privacidad() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botonVolver}>
          <Text style={styles.botonVolverTexto}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Política de privacidad</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🔏</Text>
          <Text style={styles.heroTitulo}>Cómo manejamos tus datos</Text>
          <Text style={styles.heroTexto}>
            Tu privacidad importa. Esta política explica qué información recopilamos,
            para qué la usamos y cómo la protegemos.
          </Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeTexto}>Última actualización: junio 2026</Text>
          </View>
        </View>

        {/* Aviso académico */}
        <View style={styles.avisoCard}>
          <Text style={styles.avisoTexto}>
            🎓{"  "}RentaFácil es un{" "}
            <Text style={styles.aviso_bold}>proyecto académico sin fines comerciales</Text>{" "}
            desarrollado en la Escuela Superior de Cómputo (Escom) del IPN ESCOM. Los datos 
            recopilados son usados exclusivamente dentro de la plataforma con fines educativos.
          </Text>
        </View>

        {/* Datos que recopilamos */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <View style={styles.iconoWrap}>
              <Text style={styles.icono}>📂</Text>
            </View>
            <Text style={styles.seccionTitulo}>Datos que recopilamos</Text>
          </View>
          <Text style={[styles.seccionCuerpo, { marginBottom: 12 }]}>
            Al registrarte y usar la aplicación, recopilamos la siguiente información:
          </Text>
          <View style={styles.tagGrid}>
            <TagDato texto="Nombre completo" />
            <TagDato texto="Nombre de usuario" />
            <TagDato texto="Correo electrónico" />
            <TagDato texto="Contraseña (cifrada)" />
            <TagDato texto="Fecha de nacimiento" />
            <TagDato texto="Género" />
            <TagDato texto="Documento de verificación" />
            <TagDato texto="Fotos de inmuebles" />
            <TagDato texto="Historial de citas" />
            <TagDato texto="Reseñas y calificaciones" />
          </View>
        </View>

        <SeccionPrivacidad emoji="🎯" titulo="Para qué usamos tu información">
          Usamos tus datos exclusivamente para:{"\n\n"}
          • Crear y gestionar tu cuenta de usuario.{"\n"}
          • Mostrar tu perfil a otros usuarios dentro de la plataforma.{"\n"}
          • Facilitar la búsqueda y publicación de inmuebles.{"\n"}
          • Gestionar citas entre inquilinos y propietarios.{"\n"}
          • Mostrar reseñas y calificaciones de inmuebles.{"\n"}
          • Enviar notificaciones relacionadas con el servicio.{"\n"}
          • Cumplir con fines académicos y de evaluación del proyecto escolar.
        </SeccionPrivacidad>

        <SeccionPrivacidad emoji="🚫" titulo="Lo que NO hacemos con tus datos">
          En RentaFácil nos comprometemos a:{"\n\n"}
          • No vender, alquilar ni comercializar tu información personal.{"\n"}
          • No compartir tus datos con terceros sin tu consentimiento expreso,
          salvo cuando lo exija la ley.{"\n"}
          • No usar tus datos para publicidad de terceros.{"\n"}
          • No conservar datos sensibles (como contraseñas) en texto plano;
          se almacenan siempre de forma cifrada.
        </SeccionPrivacidad>

        <SeccionPrivacidad emoji="🔐" titulo="Cómo protegemos tu información">
          Implementamos las siguientes medidas de seguridad:{"\n\n"}
          • Las contraseñas se almacenan con algoritmos de hash seguros (Django authentication).{"\n"}
          • La comunicación entre la app y el servidor se realiza vía HTTP local en entorno de desarrollo.{"\n"}
          • El acceso a los datos está restringido al equipo de desarrollo del proyecto.{"\n"}
          • La base de datos PostgreSQL está protegida por credenciales de acceso.{"\n\n"}
          Al ser un prototipo académico, el sistema no está diseñado para almacenar datos
          sensibles de la vida real de los usuarios.
        </SeccionPrivacidad>

        <SeccionPrivacidad emoji="🗺️" titulo="Ubicación y mapas">
          La sección de mapa utiliza las direcciones de los inmuebles para generar
          ubicaciones aproximadas mediante el servicio Nominatim/OpenStreetMap, que es
          de código abierto y sin fines comerciales. No recopilamos tu ubicación GPS
          en tiempo real. Las consultas al geocodificador no están asociadas a tu
          identidad personal.
        </SeccionPrivacidad>

        <SeccionPrivacidad emoji="🧒" titulo="Menores de edad">
          RentaFácil no está diseñada para usuarios menores de 18 años. Si descubrimos
          que hemos recopilado información de un menor sin el consentimiento de un
          tutor legal, eliminaremos esa información de inmediato.
        </SeccionPrivacidad>

        {/* Derechos del usuario */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <View style={styles.iconoWrap}>
              <Text style={styles.icono}>⚖️</Text>
            </View>
            <Text style={styles.seccionTitulo}>Tus derechos (ARCO)</Text>
          </View>
          <Text style={[styles.seccionCuerpo, { marginBottom: 12 }]}>
            De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión
            de los Particulares (LFPDPPP), tienes derecho a:
          </Text>
          <View style={styles.derechosFila}>
            <View style={styles.derechoBadge}>
              <Text style={styles.derechoLetra}>A</Text>
              <Text style={styles.derechoTexto}>Acceso</Text>
            </View>
            <View style={styles.derechoBadge}>
              <Text style={styles.derechoLetra}>R</Text>
              <Text style={styles.derechoTexto}>Rectificación</Text>
            </View>
            <View style={styles.derechoBadge}>
              <Text style={styles.derechoLetra}>C</Text>
              <Text style={styles.derechoTexto}>Cancelación</Text>
            </View>
            <View style={styles.derechoBadge}>
              <Text style={styles.derechoLetra}>O</Text>
              <Text style={styles.derechoTexto}>Oposición</Text>
            </View>
          </View>
          <Text style={[styles.seccionCuerpo, { marginTop: 12 }]}>
            Puedes ejercer estos derechos directamente desde la sección{" "}
            <Text style={{ fontWeight: "700", color: "#1a3a8f" }}>Cuenta</Text>{" "}
            en Configuración: editar tus datos, cambiar tu contraseña o
            eliminar tu cuenta.
          </Text>
        </View>

        <SeccionPrivacidad emoji="🔄" titulo="Retención y eliminación de datos">
          Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta,
          tus datos personales son borrados de nuestra base de datos, excepto aquella
          información que deba conservarse por requisitos académicos de evaluación del
          proyecto. Los datos anonimizados pueden usarse para métricas del sistema.
        </SeccionPrivacidad>

        <SeccionPrivacidad emoji="✏️" titulo="Cambios a esta política">
          Esta política puede actualizarse periódicamente. Cualquier cambio relevante
          será notificado a través de la aplicación. El uso continuado de RentaFácil
          tras la publicación de los cambios implica la aceptación de la nueva política.
        </SeccionPrivacidad>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTexto}>RentaFácil © 2026 · IPN ESCOM</Text>
          <Text style={styles.footerSub}>Proyecto académico — sin fines comerciales</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AZUL = "#1a3a8f";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f0" },
  separador: { height: 1, backgroundColor: "#e0dcd8" },
  scroll:    { paddingBottom: 48 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  botonVolver: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  botonVolverTexto: { fontSize: 24, color: AZUL, fontWeight: "300", lineHeight: 28 },
  headerTitulo: {
    flex: 1, textAlign: "center",
    fontSize: 18, fontWeight: "800", color: "#1a1a1a",
  },

  heroCard: {
    margin: 16, backgroundColor: "#0f2566", borderRadius: 20,
    padding: 24, alignItems: "center",
  },
  heroEmoji:    { fontSize: 36, marginBottom: 8 },
  heroTitulo:   { fontSize: 19, fontWeight: "900", color: "#fff", marginBottom: 8, textAlign: "center" },
  heroTexto:    { fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 19 },
  heroBadge: {
    marginTop: 14, backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  heroBadgeTexto: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "600" },

  avisoCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: "#eef1fa", borderRadius: 14,
    padding: 14, borderLeftWidth: 4, borderLeftColor: AZUL,
  },
  avisoTexto: { fontSize: 13, color: "#1a2a5e", lineHeight: 19 },
  aviso_bold: { fontWeight: "700" },

  seccion: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#fff", borderRadius: 18, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  seccionHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10,
  },
  iconoWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#eef1fa", justifyContent: "center", alignItems: "center",
  },
  icono:         { fontSize: 18 },
  seccionTitulo: { fontSize: 15, fontWeight: "800", color: "#1a1a1a", flex: 1 },
  seccionCuerpo: { fontSize: 13, color: "#555", lineHeight: 20 },

  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#eef1fa", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagTexto: { fontSize: 12, color: AZUL, fontWeight: "600" },

  derechosFila:  { flexDirection: "row", gap: 8 },
  derechoBadge: {
    flex: 1, backgroundColor: "#eef1fa", borderRadius: 12,
    padding: 10, alignItems: "center", gap: 4,
  },
  derechoLetra: { fontSize: 18, fontWeight: "900", color: AZUL },
  derechoTexto: { fontSize: 10, color: "#555", fontWeight: "600", textAlign: "center" },

  footer:      { alignItems: "center", paddingTop: 36, gap: 4 },
  footerTexto: { fontSize: 12, color: "#bbb", fontWeight: "600" },
  footerSub:   { fontSize: 11, color: "#ccc" },
});