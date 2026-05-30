import { Platform } from 'react-native';

export const URL_BASE = Platform.OS === 'web'
  ? 'http://localhost:8000/api'
  : 'http://IP-LOCAL:8000/api';
  
export async function obtenerDepartamentos(filtros: Record<string, string> = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${URL_BASE}/departamentos/?${params}`);
  if (!res.ok) throw new Error('Error al obtener departamentos');
  return res.json();
}

export async function obtenerDepartamento(id: number) {
  const res = await fetch(`${URL_BASE}/departamentos/${id}/`);
  if (!res.ok) throw new Error('Error al obtener departamento');
  return res.json();
}

export type Departamento = {
  id: number;
  titulo: string;
  descripcion?: string;
  precio: number;
  colonia: string;
  alcaldia: string;
  direccion: string;
  metro_cercano: string;
  imagen?: string;
  disponible: boolean;
  tipo_renta?: 'solo_mujeres' | 'solo_hombres' | 'mixto';
  cuartos: number;
  // amenidades
  amueblado?: boolean;
  internet?: boolean;
  estacionamiento?: boolean;
  pet_friendly?: boolean;
  cocina?: boolean;
};