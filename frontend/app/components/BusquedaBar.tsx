import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFiltros } from "../context/FiltrosContext";

interface BusquedaBarProps {
  onPressFiltros: () => void;
  placeholder?: string;
}

export default function BusquedaBar({
  onPressFiltros,
  placeholder = "Colonia, alcaldía o metro...",
}: BusquedaBarProps) {
  const { busqueda, setBusqueda, filtrosActivos } = useFiltros();

  return (
    <View style={styles.row}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          style={styles.input}
          value={busqueda}
          onChangeText={setBusqueda}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda("")} style={styles.clearBtn}>
            <Text style={styles.clearTexto}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.filtroBtn, filtrosActivos > 0 && styles.filtroBtnActivo]}
        onPress={onPressFiltros}
        activeOpacity={0.8}
      >
        <Text style={styles.filtroBtnIcono}>⚙️</Text>
        {filtrosActivos > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{filtrosActivos}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  clearBtn: { padding: 4 },
  clearTexto: { fontSize: 13, color: "#aaa" },
  filtroBtn: {
    backgroundColor: "#e63946",
    borderRadius: 14,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e63946",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  filtroBtnActivo: {
    backgroundColor: "#c1121f",
  },
  filtroBtnIcono: { fontSize: 20 },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: "800",
    color: "#e63946",
  },
});