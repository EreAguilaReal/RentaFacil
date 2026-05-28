import { Platform } from 'react-native';

export const URL_BASE = Platform.OS === 'web'
  ? 'http://localhost:8000/api'
  : 'http://192.168.1.84:8000/api';
  
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