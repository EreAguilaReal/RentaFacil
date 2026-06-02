import React, { createContext, useContext, useMemo, useState } from "react";

interface FiltrosState {
  busqueda: string;
  setBusqueda: (v: string) => void;
  chipActivo: string | null;
  setChipActivo: (v: string | null) => void;
  filtros: Record<string, boolean>;
  setFiltros: (v: Record<string, boolean>) => void;
  rangoMax: number;
  setRangoMax: (v: number) => void;
  resetFiltros: () => void;
  /** Número de filtros activos (chips + switches + rango si no es el máximo) */
  filtrosActivos: number;
}

const RANGO_DEFAULT = 10000;

const FiltrosContext = createContext<FiltrosState | null>(null);

export function FiltrosProvider({ children }: { children: React.ReactNode }) {
  const [busqueda, setBusqueda]     = useState("");
  const [chipActivo, setChipActivo] = useState<string | null>(null);
  const [filtros, setFiltros]       = useState<Record<string, boolean>>({});
  const [rangoMax, setRangoMax]     = useState(RANGO_DEFAULT);

  const resetFiltros = () => {
    setChipActivo(null);
    setFiltros({});
    setRangoMax(RANGO_DEFAULT);
  };

  const filtrosActivos = useMemo(() => {
    const switches = Object.values(filtros).filter(Boolean).length;
    const chip     = chipActivo ? 1 : 0;
    const rango    = rangoMax < RANGO_DEFAULT ? 1 : 0;
    return switches + chip + rango;
  }, [filtros, chipActivo, rangoMax]);

  return (
    <FiltrosContext.Provider value={{
      busqueda, setBusqueda,
      chipActivo, setChipActivo,
      filtros, setFiltros,
      rangoMax, setRangoMax,
      resetFiltros,
      filtrosActivos,
    }}>
      {children}
    </FiltrosContext.Provider>
  );
}

export function useFiltros(): FiltrosState {
  const ctx = useContext(FiltrosContext);
  if (!ctx) throw new Error("useFiltros debe usarse dentro de <FiltrosProvider>");
  return ctx;
}

export default function FiltrosContextRoute() {
  return null;
}