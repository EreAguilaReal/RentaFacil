import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

type Props = {
  latitud?: number;
  longitud?: number;
  onLocationSelected: (
    lat: number,
    lng: number,
    direccion?: {
      direccion: string;
      colonia: string;
      alcaldia: string;
    }
  ) => void;
};

export default function MapaSelector({ latitud, longitud, onLocationSelected }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [buscando, setBuscando] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");

  const [centro, setCentro] = useState({
    lat: latitud ?? 19.4978,
    lng: longitud ?? -99.1269,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      setCentro({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  // ── Geocodificar dirección con Nominatim ──────────────────────────
  const buscarDireccion = async () => {
    const texto = textoBusqueda.trim();
    if (!texto) return;

    setBuscando(true);
    try {
      // Añadimos "Ciudad de México" como contexto para mejorar resultados
      
      const query = encodeURIComponent(`${texto}, Gustavo A. Madero, Ciudad de México, México`);
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=mx`;

      const res = await fetch(url, {
        headers: { "Accept-Language": "es", "User-Agent": "RentaFacil/1.0" },
      });
      const resultados = await res.json();

      if (!resultados || resultados.length === 0) {
        alert("No se encontró esa dirección. Intenta ser más específico.");
        return;
      }

      const { lat, lon, display_name } = resultados[0];
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lon);

      // ── Mover el pin en el mapa via JS ────────────────────────────
      webViewRef.current?.injectJavaScript(`
        if (marker) map.removeLayer(marker);
        marker = L.marker([${latNum}, ${lngNum}]).addTo(map);
        map.setView([${latNum}, ${lngNum}], 16);
        true;
      `);

      // ── Reverse geocode para extraer colonia y alcaldía ───────────
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: latNum,
        longitude: lngNum,
      });
      const dir = geocoded[0];
      const direccionCompleta = dir?.formattedAddress || display_name;
      const partes = direccionCompleta.split(",").map((p: string) => p.trim());
      const esCDMX = dir?.region?.toLowerCase().includes("ciudad de méxico");

      let colonia = "";
      let alcaldia = "";
      if (esCDMX) {
        colonia  = partes.length >= 2 ? partes[1] : (dir?.district || "");
        alcaldia = partes.length >= 3 ? partes[2] : "";
      } else {
        colonia  = dir?.district || "";
        alcaldia = dir?.city || "";
      }

      onLocationSelected(latNum, lngNum, { direccion: direccionCompleta, colonia, alcaldia });
    } catch (e) {
      console.error("Error geocodificando:", e);
      alert("Error al buscar la dirección. Verifica tu conexión.");
    } finally {
      setBuscando(false);
    }
  };

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map').setView([${centro.lat}, ${centro.lng}], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      let marker;

      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map);
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
      });
    </script>
  </body>
  </html>
  `;

  return (
    <View>
      {/* ── Buscador de dirección ── */}
      <View style={styles.buscadorRow}>
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar dirección en el mapa..."
          placeholderTextColor="#bbb"
          value={textoBusqueda}
          onChangeText={setTextoBusqueda}
          onSubmitEditing={buscarDireccion}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.buscadorBtn}
          onPress={buscarDireccion}
          disabled={buscando}
        >
          {buscando
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.buscadorBtnTexto}>🔍</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Mapa ── */}
      <View style={{ height: 300, borderRadius: 16, overflow: "hidden" }}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          onMessage={async (event) => {
            const data = JSON.parse(event.nativeEvent.data);
            try {
              const resultado = await Location.reverseGeocodeAsync({
                latitude: data.lat,
                longitude: data.lng,
              });
              const dir = resultado[0];
              const direccionCompleta = dir?.formattedAddress || "";
              const partes = direccionCompleta.split(",").map((p: string) => p.trim());
              const esCDMX = dir?.region?.toLowerCase().includes("ciudad de méxico");

              let colonia = "";
              let alcaldia = "";
              if (esCDMX) {
                colonia  = partes.length >= 2 ? partes[1] : (dir?.district || "");
                alcaldia = partes.length >= 3 ? partes[2] : "";
              } else {
                colonia  = dir?.district || "";
                alcaldia = dir?.city || "";
              }

              onLocationSelected(data.lat, data.lng, { direccion: direccionCompleta, colonia, alcaldia });
            } catch {
              onLocationSelected(data.lat, data.lng);
            }
          }}
        />
      </View>
      <Text style={styles.hint}>Toca el mapa o busca una dirección arriba</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buscadorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  buscadorInput: {
    flex: 1,
    backgroundColor: "#f7f4f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0dcd8",
  },
  buscadorBtn: {
    backgroundColor: "#1a3a8f",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buscadorBtnTexto: { fontSize: 18 },
  hint: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "center",
    marginTop: 6,
  },
});