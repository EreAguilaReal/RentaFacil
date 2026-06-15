import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { URL_BASE } from "../../../services/api";

export default function ReportesDepartamento() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      const response = await fetch(
        `${URL_BASE}/departamentos/${id}/reportes/`
      );

      const data = await response.json();
      console.log(data);

      setReportes(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.btnBack}
        >
          <Text>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Reportes
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1a3a8f"
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 16,
          }}
        >
          {reportes.length === 0 ? (
            <Text style={styles.empty}>
              No hay reportes para este departamento.
            </Text>
          ) : (
            reportes.map((r: any) => (
              <View
                key={r.id}
                style={styles.card}
              >
                <View style={styles.header}>
                  <Text style={styles.categoria}>
                    {r.categoria}
                  </Text>

                  <Text style={styles.fecha}>
                    {new Date(r.fecha)
                      .toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.descripcion}>
                  {r.descripcion}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.usuario}>
                  Reportado por:
                </Text>

                <Text style={styles.usuarioNombre}>
                  {r.arrendatario.nombre}
                </Text>

                <Text style={styles.usuarioCorreo}>
                  {r.arrendatario.correo}
                </Text>

                {r.revisado && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      Revisado
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f4f0",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  btnBack: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
  },

  empty: {
    textAlign: "center",
    color: "#666",
    marginTop: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  categoria: {
    fontWeight: "900",
    color: "#e63946",
    textTransform: "capitalize",
  },

  fecha: {
    color: "#888",
    fontSize: 12,
  },

  descripcion: {
    marginTop: 12,
    lineHeight: 22,
    color: "#333",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },

  usuario: {
    fontSize: 12,
    color: "#666",
  },

  usuarioNombre: {
    fontWeight: "700",
    marginTop: 4,
  },

  usuarioCorreo: {
    color: "#1a3a8f",
    marginTop: 2,
  },

  chip: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#dff5e1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  chipText: {
    color: "#1b7d36",
    fontWeight: "700",
  },
});