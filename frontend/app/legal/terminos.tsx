// app/legal/terminos.tsx
import React from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

function SeccionLegal({ numero, titulo, children }: {
  numero: string; titulo: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionHeader}>
        <View style={styles.numeroBadge}>
          <Text style={styles.numeroBadgeTexto}>{numero}</Text>
        </View>
        <Text style={styles.seccionTitulo}>{titulo}</Text>
      </View>
      <Text style={styles.seccionCuerpo}>{children}</Text>
    </View>
  );
}

export default function Terminos() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botonVolver}>
          <Text style={styles.botonVolverTexto}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Términos y condiciones</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.separador} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>📋</Text>
          <Text style={styles.introTitulo}>RentaFácil</Text>
          <Text style={styles.introSubtitulo}>
            Proyecto escolar — IPN ESCOM · 2026
          </Text>
          <Text style={styles.introTexto}>
            Al usar esta aplicación, aceptas los presentes términos. Lee con atención antes de continuar.
          </Text>
          <View style={styles.introBadge}>
            <Text style={styles.introBadgeTexto}>Última actualización: junio 2026</Text>
          </View>
        </View>

        {/* Aviso escolar */}
        <View style={styles.avisoCard}>
          <Text style={styles.avisoTexto}>
            ⚠️{"  "}Esta aplicación es un{" "}
            <Text style={styles.aviso_bold}>prototipo académico</Text> desarrollado
            como proyecto de la materia de Ingeniería de Software en el IPN ESCOM.
            No tiene fines comerciales.
          </Text>
        </View>

        <SeccionLegal numero="1" titulo="Aceptación de los términos">
          Al registrarte y usar RentaFácil, confirmas que tienes al menos 18 años de edad o que cuentas con autorización de un tutor legal. El uso continuado de la aplicación implica la aceptación plena de estos términos y de las actualizaciones que se publiquen en el futuro.
        </SeccionLegal>

        <SeccionLegal numero="2" titulo="Descripción del servicio">
          RentaFácil es una plataforma de intermediación que conecta a estudiantes que buscan departamentos en renta con propietarios de inmuebles en la delegación Gustavo A. Madero, Ciudad de México. La aplicación no es parte contratante en ningún acuerdo de arrendamiento; solo facilita el contacto entre las partes.
        </SeccionLegal>

        <SeccionLegal numero="3" titulo="Cuentas de usuario">
          Cada usuario es responsable de mantener la confidencialidad de su contraseña y de todas las actividades realizadas desde su cuenta. Debes notificar de inmediato cualquier uso no autorizado. RentaFácil no será responsable por pérdidas derivadas del uso indebido de tu cuenta por terceros.{"\n\n"}
          Puedes eliminar tu cuenta en cualquier momento desde Configuración, siempre que no tengas departamentos activos, citas pendientes ni un contrato de renta vigente.
        </SeccionLegal>

        <SeccionLegal numero="4" titulo="Publicación de inmuebles">
          Los propietarios son los únicos responsables de la veracidad, exactitud y legalidad de la información publicada sobre sus inmuebles. RentaFácil se reserva el derecho de eliminar publicaciones que incumplan estos términos, sean fraudulentas, contengan información falsa o violen derechos de terceros, sin previo aviso.
        </SeccionLegal>

        <SeccionLegal numero="5" titulo="Conducta del usuario">
          Queda estrictamente prohibido:{"\n\n"}
          • Publicar información falsa o engañosa.{"\n"}
          • Usar la plataforma con fines distintos a la búsqueda o renta legítima de inmuebles.{"\n"}
          • Hostigar, amenazar o discriminar a otros usuarios.{"\n"}
          • Intentar acceder sin autorización a cuentas ajenas o a los sistemas de la plataforma.{"\n"}
          • Usar la aplicación para actividades ilegales conforme a la legislación mexicana.
        </SeccionLegal>

        <SeccionLegal numero="6" titulo="Citas y reservaciones">
          La plataforma permite agendar citas para visitar inmuebles. Tanto inquilinos como propietarios se comprometen a respetar los horarios acordados. En caso de no poder asistir, deberán cancelar con al menos 2 horas de anticipación. El abuso reiterado de las citas puede resultar en la suspensión de la cuenta.
        </SeccionLegal>

        <SeccionLegal numero="7" titulo="Reseñas y calificaciones">
          Los usuarios pueden publicar reseñas sobre inmuebles e interacciones. Las reseñas deben ser honestas y basadas en experiencias reales. No se permite lenguaje ofensivo, discriminatorio o falso. RentaFácil puede eliminar reseñas que incumplan esta política sin previo aviso.
        </SeccionLegal>

        <SeccionLegal numero="8" titulo="Limitación de responsabilidad">
          RentaFácil es un proyecto académico sin fines de lucro. No garantiza la disponibilidad continua del servicio, la veracidad de los anuncios de terceros, ni el resultado de las negociaciones entre usuarios. El uso de la plataforma es bajo la responsabilidad exclusiva del usuario.
        </SeccionLegal>

        <SeccionLegal numero="9" titulo="Modificaciones">
          El equipo de desarrollo puede modificar estos términos en cualquier momento. Las modificaciones serán notificadas mediante la aplicación. El uso continuado tras la publicación de cambios implica su aceptación.
        </SeccionLegal>

        <SeccionLegal numero="10" titulo="Legislación aplicable">
          Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será resuelta conforme a la legislación vigente en la Ciudad de México.
        </SeccionLegal>

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
  container:      { flex: 1, backgroundColor: "#f7f4f0" },
  separador:      { height: 1, backgroundColor: "#e0dcd8" },
  scroll:         { paddingBottom: 48 },

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
  headerTitulo:   { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#1a1a1a" },

  introCard: {
    margin: 16, backgroundColor: AZUL, borderRadius: 20,
    padding: 24, alignItems: "center",
  },
  introEmoji:     { fontSize: 36, marginBottom: 8 },
  introTitulo:    { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 2 },
  introSubtitulo: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 12 },
  introTexto:     { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 19 },
  introBadge: {
    marginTop: 14, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  introBadgeTexto: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "600" },

  avisoCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: "#fffbe6", borderRadius: 14,
    padding: 14, borderLeftWidth: 4, borderLeftColor: "#f5a623",
  },
  avisoTexto:  { fontSize: 13, color: "#7a5c00", lineHeight: 19 },
  aviso_bold:  { fontWeight: "700" },

  seccion: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#fff", borderRadius: 18,
    padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  seccionHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  numeroBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#eef1fa", justifyContent: "center", alignItems: "center",
  },
  numeroBadgeTexto: { fontSize: 12, fontWeight: "800", color: AZUL },
  seccionTitulo:    { fontSize: 15, fontWeight: "800", color: "#1a1a1a", flex: 1 },
  seccionCuerpo:    { fontSize: 13, color: "#555", lineHeight: 20 },

  footer:    { alignItems: "center", paddingTop: 36, gap: 4 },
  footerTexto: { fontSize: 12, color: "#bbb", fontWeight: "600" },
  footerSub:   { fontSize: 11, color: "#ccc" },
});