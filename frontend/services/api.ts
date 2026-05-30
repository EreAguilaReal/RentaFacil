const URL_BASE = 'http://10.46.150.230:8000/api';

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