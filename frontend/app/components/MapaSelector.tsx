import React, { useEffect, useState } from "react";
import { View } from "react-native";
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

export default function MapaSelector({
  latitud,
  longitud,
  onLocationSelected,
}: Props) {
  const [centro, setCentro] = useState({
    lat: latitud ?? 19.4978,
    lng: longitud ?? -99.1269,
  });

  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const pos =
        await Location.getCurrentPositionAsync({});

      setCentro({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    })();
  }, []);

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
      html,body,#map{
        width:100%;
        height:100%;
        margin:0;
      }
    </style>
  </head>

  <body>
    <div id="map"></div>

    <script>
      const map = L.map('map')
        .setView([${centro.lat}, ${centro.lng}], 15);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ).addTo(map);

      let marker;

      map.on('click', function(e){

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if(marker){
          map.removeLayer(marker);
        }

        marker = L.marker([lat,lng]).addTo(map);

        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            lat,
            lng
          })
        );
      });
    </script>

  </body>
  </html>
  `;

  return (
    <View
      style={{
        height: 300,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <WebView
        source={{ html }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        onMessage={async (event) => {
          const data = JSON.parse(event.nativeEvent.data);

          try {
            const resultado =
              await Location.reverseGeocodeAsync({
                latitude: data.lat,
                longitude: data.lng,
              });

            const dir = resultado[0];

            const direccionCompleta =
              dir?.formattedAddress || "";

            const partes = direccionCompleta
              .split(",")
              .map((p) => p.trim());

            const esCDMX =
              dir?.region?.toLowerCase()
                .includes("ciudad de méxico");

            let colonia = "";
            let alcaldia = "";

            if (esCDMX) {
              // Ejemplo:
              // "1A de Primavera 51, Vista Hermosa, Gustavo A. Madero, 07188 Ciudad de México, CDMX, Mexico"

              colonia = partes.length >= 2
                ? partes[1]
                : (dir?.district || "");

              alcaldia = partes.length >= 3
                ? partes[2]
                : "";
            } else {
              colonia = dir?.district || "";
              alcaldia = dir?.city || "";
            }

            onLocationSelected(
              data.lat,
              data.lng,
              {
                direccion: direccionCompleta,
                colonia,
                alcaldia,
              }
            );
          } catch (error) {
            console.log(error);

            onLocationSelected(
              data.lat,
              data.lng
            );
          }
        }}
      />
    </View>
  );
}