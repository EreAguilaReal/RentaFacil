import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useFiltros } from "../context/FiltrosContext";

interface Chip {
  key: string;
  label: string;
}

const CHIPS_DEFAULT: Chip[] = [
  { key: "amueblado",       label: "🛋 Amueblado" },
  { key: "pet_friendly",    label: "🐾 Pet friendly" },
  { key: "solo_mujeres",    label: "👩 Solo mujeres" },
  { key: "internet",        label: "📶 Internet" },
  { key: "estacionamiento", label: "🚗 Estacionamiento" },
  { key: "cocina",          label: "🍳 Cocina" },
];

interface ChipsFiltroProps {
  chips?: Chip[];
}

export default function ChipsFiltro({ chips = CHIPS_DEFAULT }: ChipsFiltroProps) {
  const { chipActivo, setChipActivo } = useFiltros();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, { overflow: "visible" }]}
      contentContainerStyle={styles.content}
    >
      {chips.map((chip) => {
        const activo = chipActivo === chip.key;
        return (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => setChipActivo(activo ? null : chip.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginTop: 10, minHeight: 30, maxHeight: 30},
  content: { paddingHorizontal: 20, gap: 8 , alignItems: "center"},
  chip: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#e0dcd8",
    height: 30,
  },
  chipActivo: {
    backgroundColor: "#e63946",
    borderColor: "#e63946",
  },
  chipTexto: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  chipTextoActivo: {
    color: "#fff",
  },
});