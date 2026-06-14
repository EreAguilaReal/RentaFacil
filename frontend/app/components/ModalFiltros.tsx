import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFiltros } from "../context/FiltrosContext";

const PRECIOS = [3000, 4500, 6000, 7500, 9000, 10000];

const TIPOS_RENTA = [
  { key: "solo_mujeres", label: "Solo mujeres" },
  { key: "solo_hombres", label: "Solo hombres" },
  { key: "mixto",        label: "Mixto" },
];

const CARACTERISTICAS = [
  { key: "amueblado",       label: "🛋 Amueblado" },
  { key: "pet_friendly",    label: "🐾 Pet friendly" },
  { key: "internet",        label: "🛜 Internet incluido" },
  { key: "estacionamiento", label: "🚗 Estacionamiento" },
  { key: "cocina",          label: "🍳 Cocina" },
];

interface ModalFiltrosProps {
  visible: boolean;
  onClose: () => void;
}

export default function ModalFiltros({ visible, onClose }: ModalFiltrosProps) {
  const { filtros, setFiltros, rangoMax, setRangoMax, resetFiltros, filtrosActivos } = useFiltros();

  const toggleFiltro = (key: string, valor: boolean) => {
    setFiltros({ ...filtros, [key]: valor });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.contenido}>

          {/* Cabecera */}
          <View style={styles.cabecera}>
            <Text style={styles.titulo}>Filtros</Text>
            {filtrosActivos > 0 && (
              <TouchableOpacity onPress={resetFiltros}>
                <Text style={styles.limpiar}>Limpiar todo</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Rango de precio */}
            <Text style={styles.seccion}>Precio máximo</Text>
            <Text style={styles.precioActual}>
              ${rangoMax.toLocaleString()}/mes
            </Text>
            <View style={styles.preciosGrid}>
              {PRECIOS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.precioBtn, rangoMax === p && styles.precioBtnActivo]}
                  onPress={() => setRangoMax(p)}
                >
                  <Text style={[styles.precioBtnTexto, rangoMax === p && styles.precioBtnTextoActivo]}>
                    ${(p / 1000).toFixed(1)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tipo de renta */}
            <Text style={styles.seccion}>Tipo de renta</Text>
            {TIPOS_RENTA.map((op) => (
              <View key={op.key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{op.label}</Text>
                <Switch
                  value={filtros[op.key] ?? false}
                  onValueChange={(v) => toggleFiltro(op.key, v)}
                  trackColor={{ false: "#e0dcd8", true: "#e63946" }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            {/* Características */}
            <Text style={styles.seccion}>Características</Text>
            {CARACTERISTICAS.map((op) => (
              <View key={op.key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{op.label}</Text>
                <Switch
                  value={filtros[op.key] ?? false}
                  onValueChange={(v) => toggleFiltro(op.key, v)}
                  trackColor={{ false: "#e0dcd8", true: "#e63946" }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Botón aplicar */}
          <TouchableOpacity style={styles.botonAplicar} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.botonAplicarTexto}>
              Aplicar{filtrosActivos > 0 ? ` (${filtrosActivos} activos)` : ""}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  contenido: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "88%",
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1a1a1a",
  },
  limpiar: {
    fontSize: 14,
    color: "#e63946",
    fontWeight: "700",
  },
  seccion: {
    fontSize: 13,
    fontWeight: "800",
    color: "#aaa",
    marginTop: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  precioActual: {
    fontSize: 24,
    fontWeight: "900",
    color: "#e63946",
    marginBottom: 12,
  },
  preciosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  precioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
    backgroundColor: "#faf9f8",
  },
  precioBtnActivo: {
    backgroundColor: "#e63946",
    borderColor: "#e63946",
  },
  precioBtnTexto: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  precioBtnTextoActivo: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ece8",
  },
  switchLabel: {
    fontSize: 15,
    color: "#333",
  },
  botonAplicar: {
    backgroundColor: "#e63946",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#e63946",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  botonAplicarTexto: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});