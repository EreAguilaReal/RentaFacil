import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { obtenerFavoritos, toggleFavorito } from "../../services/api";

type DepaFav = {
  id:        number;
  titulo:    string;
  colonia:   string;
  precio:    number;
  imagen?:   string;
  metro_cercano?: string;
  tipo_renta?: string;
  pet_friendly?: boolean;
  amueblado?: boolean;
  internet?:  boolean;
  estacionamiento?: boolean;
  cocina?: boolean;
};

type Favorito = {
  id:           number;
  departamento: DepaFav;
  fecha:        string;
};

const TarjetaFav = ({
  fav,
  onEliminar,
}: {
  fav: Favorito;
  onEliminar: (id: number) => void;
}) => {
  const router = useRouter();
  const d = fav.departamento;
  const badges = [];
  if (d.tipo_renta === "solo_mujeres")
    badges.push({ texto: "Solo mujeres", color: "#ff6b9d" });

  if (d.tipo_renta === "solo_hombres")
    badges.push({ texto: "Solo hombres", color: "#4a90e2" });

  if (d.pet_friendly)
    badges.push({ texto: "Pet friendly", color: "#4caf50" });

  if (d.amueblado)
    badges.push({ texto: "Amueblado", color: "#ff9800" });

  if (d.internet)
    badges.push({ texto: "Internet", color: "#7b61ff" });

  if (d.estacionamiento)
    badges.push({ texto: "Estacionamiento", color: "#009688" });

  if (d.cocina)
    badges.push({ texto: "Cocina", color: "#795548" });
  return (
    <TouchableOpacity
      style={styles.tarjeta}
      activeOpacity={0.88}
      onPress={() => router.push(`/departamento/${d.id}`)}
    >
      <View style={styles.imagenWrapper}>
        <Image
          source={{ uri: d.imagen ?? "https://via.placeholder.com/400x200" }}
          style={styles.imagen}
        />
        {/* Badges */}
        <View style={styles.badgesRow}>
          {badges.slice(0, 2).map((badge, index) => (
            <View
              key={index}
              style={[styles.badge, { backgroundColor: badge.color }]}
            >
              <Text style={styles.badgeTexto}>
                {badge.texto}
              </Text>
            </View>
          ))}

          {badges.length > 2 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(0,0,0,0.7)" }
              ]}
            >
              <Text style={styles.badgeTexto}>
                +{badges.length - 2}
              </Text>
            </View>
          )}
        </View>
        {/* Botón quitar favorito */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => onEliminar(d.id)}
        >
          <Text style={styles.heartEmoji}>❤️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={1}>{d.titulo}</Text>
        <Text style={styles.colonia} numberOfLines={1}>📍 {d.colonia}</Text>
        {d.metro_cercano ? (
          <Text style={styles.metro}>🚇 {d.metro_cercano}</Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.precio}>${d.precio.toLocaleString()}/mes</Text>
          <View style={styles.iconosRow}>
            {d.amueblado        && <Text style={styles.icono}>🛋</Text>}
            {d.internet         && <Text style={styles.icono}>📶</Text>}
            {d.estacionamiento  && <Text style={styles.icono}>🚗</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function FavoritosScreen() {
  const router      = useRouter();
  const { usuario } = useAuth();
  const [favs, setFavs]         = useState<Favorito[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    if (!usuario) return;
    setCargando(true);
    obtenerFavoritos(usuario.id)
      .then(setFavs)
      .catch(() => setFavs([]))
      .finally(() => setCargando(false));
  }, [usuario?.id]);

  // Recarga cada vez que la pantalla recibe foco
  useFocusEffect(cargar);

  const handleEliminar = async (depaId: number) => {
    if (!usuario) return;
    await toggleFavorito(usuario.id, depaId, true);
    setFavs(prev => prev.filter(f => f.departamento.id !== depaId));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4f0" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Mis favoritos</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.separador} />

      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      ) : favs.length === 0 ? (
        <View style={styles.centrado}>
          <Text style={styles.vaciEmoji}>🤍</Text>
          <Text style={styles.vaciTitulo}>Sin favoritos aún</Text>
          <Text style={styles.vaciSub}>
            Guarda departamentos que te interesen para verlos aquí
          </Text>
          <TouchableOpacity
            style={styles.explorarBtn}
            onPress={() => router.push("/search" as any)}
          >
            <Text style={styles.explorarTexto}>Explorar departamentos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.conteo}>
            {favs.length} departamento{favs.length !== 1 ? "s" : ""} guardado{favs.length !== 1 ? "s" : ""}
          </Text>
          {favs.map(f => (
            <TarjetaFav key={f.id} fav={f} onEliminar={handleEliminar} />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f4f0" },
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
  centrado:   { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  conteo: {
    fontSize: 13, fontWeight: "700", color: "#888",
    paddingHorizontal: 20, paddingVertical: 12,
  },

  // Tarjeta
  tarjeta: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  imagenWrapper: { position: "relative" },
  imagen:        { width: "100%", height: 160 },
  badgesRow: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", gap: 6,
  },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heartBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16, width: 32, height: 32,
    justifyContent: "center", alignItems: "center",
  },
  heartEmoji: { fontSize: 16 },
  info:       { padding: 14 },
  titulo:     { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  colonia:    { fontSize: 13, color: "#777", marginTop: 4 },
  metro:      { fontSize: 12, color: "#555", marginTop: 4 },
  footer: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 10,
  },
  precio:     { fontSize: 17, fontWeight: "900", color: "#e63946" },
  iconosRow:  { flexDirection: "row", gap: 4 },
  icono:      { fontSize: 16 },

  // Vacío
  vaciEmoji:  { fontSize: 52, marginBottom: 12 },
  vaciTitulo: { fontSize: 18, fontWeight: "800", color: "#333", marginBottom: 6 },
  vaciSub:    { fontSize: 14, color: "#aaa", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  explorarBtn: {
    backgroundColor: "#e63946", borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  explorarTexto: { color: "#fff", fontWeight: "800", fontSize: 14 },
});