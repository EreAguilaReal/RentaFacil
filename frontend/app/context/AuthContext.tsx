import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

interface UsuarioAuth {
  id:             number;
  token:          string;
  nombre_usuario: string;
  nombres:        string;
  apellidos:      string;
  correo_electronico: string;
  fecha_nacimiento:   string;
  genero:         string;
  tipo_usuario:   string;
  documento_verificacion: string | null;
  verificado:   boolean;
  estado_verificacion: 'pendiente' | 'aprobado' | 'rechazado' | '';
}

interface AuthContextType {
  usuario: UsuarioAuth | null;
  login:   (datos: UsuarioAuth) => Promise<void>;
  logout:  () => Promise<void>;
  estaAutenticado: boolean;
  cargando: boolean;
  actualizarUsuario: (datos: Partial<UsuarioAuth>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  login: async () => {},
  logout: async () => {},
  estaAutenticado: false,
  cargando: true,
  actualizarUsuario: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<any | null>(null);

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  const actualizarUsuario = async (datos: Partial<UsuarioAuth>) => {
    const nuevoUsuario = { ...usuario, ...datos } as UsuarioAuth;
    setUsuario(nuevoUsuario);
    await AsyncStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
  };

  const cargarSesion = async () => {
    try {
      const sesionGuardada = await AsyncStorage.getItem("usuario");

      if (sesionGuardada) {
        setUsuario(JSON.parse(sesionGuardada));
      }
    } catch (error) {
      console.log("Error cargando sesión:", error);
    } finally {
      setCargando(false);
    }
  };

  const login = async (datos: any) => {
    setUsuario(datos);

    await AsyncStorage.setItem(
      "usuario",
      JSON.stringify(datos)
    );
  };

  const logout = async () => {
    setUsuario(null);

    await AsyncStorage.removeItem("usuario");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        estaAutenticado: !!usuario,
        cargando,
        actualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default function AuthContextRoute() {
  return null;
}