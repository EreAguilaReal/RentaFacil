import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  usuario: any | null;
  login: (datos: any) => Promise<void>;
  logout: () => Promise<void>;
  estaAutenticado: boolean;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  login: async () => {},
  logout: async () => {},
  estaAutenticado: false,
  cargando: true,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);