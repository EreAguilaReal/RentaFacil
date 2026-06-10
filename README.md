# 🏠 RentaFácil

Aplicación móvil para facilitar la búsqueda de departamentos para estudiantes de la CDMX.

**Stack:** React Native + Expo · Django REST Framework · PostgreSQL · GitHub

---

## 📋 Prerequisitos

Instala lo siguiente antes de empezar:

- [Node.js](https://nodejs.org) (v18 o superior)
- [Python](https://python.org) (v3.10 o superior)
- [PostgreSQL](https://postgresql.org)
- [Git](https://git-scm.com)
- [Expo Go](https://expo.dev/go) en tu celular (Android o iOS)

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/EreAguilaReal/RentaFacil.git
cd RentaFacil
```

---

### 2. Configurar el Backend (Django)

```bash
cd backend
python -m venv env

# Windows
env\Scripts\activate

# Mac / Linux
source env/bin/activate

pip install -r requirements.txt
```

#### Crear el archivo `.env`

Crea un archivo llamado `.env` dentro de la carpeta `backend/` con este contenido:

```
SECRET_KEY=cualquier-clave-larga-solo-para-local
DEBUG=True
DB_NAME=rentafacil_db
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres
DB_HOST=localhost
DB_PORT=5432
```

> ⚠️ El archivo `.env` **nunca** se sube al repositorio. Cada quien crea el suyo con sus propios valores.

#### Crear la base de datos

Abre **pgAdmin** y crea una base de datos llamada `rentafacil_db`.

O desde la terminal de PostgreSQL:

```sql
CREATE DATABASE rentafacil_db;
```

#### Correr las migraciones e iniciar el servidor

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

#### Crear superusuario (para entrar al admin)

```bash
python manage.py createsuperuser
```

Accede al admin en: `http://127.0.0.1:8000/admin/`

---

### 3. Configurar el Frontend (Expo)

```bash
cd frontend
npm install
```

#### Cambiar la IP de la API

Abre `frontend/services/api.ts` y reemplaza la IP con **tu IP local**.

```typescript
const URL_BASE = 'http://TU_IP_LOCAL:8000/api';
```

> ⚠️ Revisa la sección [¿Cómo saber cuál es mi IP?](#-cómo-saber-cuál-es-mi-ip) más abajo antes de continuar.

#### Iniciar Expo

```bash
npx expo start --lan --clear
```

Escanea el QR con **Expo Go** en tu celular.

---

## 📁 Estructura del Proyecto

```
RentaFacil/
├── frontend/          # App móvil (React Native + Expo)
│   ├── app/
│   │   └── (tabs)/
│   │       └── index.tsx   # Pantalla principal
│   ├── services/
│   │   └── api.ts          # Llamadas al backend
│   └── package.json
└── backend/           # API REST (Django + DRF)
    ├── config/
    │   ├── settings.py
    │   └── urls.py
    ├── departamentos/
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   └── urls.py
    ├── requirements.txt
    └── manage.py
```

---

## 🔗 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/departamentos/` | Lista todos los departamentos |
| GET | `/api/departamentos/?precio_max=6000` | Filtrar por precio máximo |
| GET | `/api/departamentos/?tipo_renta=solo_mujeres` | Filtrar por tipo de renta |
| GET | `/api/departamentos/?pet_friendly=true` | Filtrar por pet friendly |
| GET | `/api/departamentos/?amueblado=true` | Filtrar por amueblado |
| GET | `/api/departamentos/{id}/` | Detalle de un departamento |

---

## 🌿 Ramas de Git

```
main          → Entrega final
└── develop   → Integración
    ├── feature/backend   → Equipo backend
    └── feature/frontend  → Equipo frontend
```

Consulta la **Guía de Estándares** del proyecto para las reglas de commits y Pull Requests.

---

## 🔍 ¿Cómo saber cuál es mi IP?

La forma más confiable es **leer la IP que muestra Expo en la terminal** al ejecutar:

```bash
npx expo start --lan --clear
```

Expo mostrará algo como:

```
Metro waiting on exp://10.241.242.230:8081
```

Esa dirección `10.241.242.230` es tu IP. Úsala con el puerto `8000` en `api.ts`:

```typescript
: 'http://10.241.242.230:8000/api'   // ← puerto 8000, no 8081
```

> ⚠️ **Importante:** El puerto `8081` es de Expo Metro (el bundler de JavaScript), **no** es Django. Django siempre corre en el puerto `8000`. Confundirlos es el error más común de conexión.

### ¿Por qué no usar `ipconfig`?

`ipconfig` puede mostrar varias IPs al mismo tiempo (Wi-Fi, Ethernet, adaptadores virtuales, hotspot). Si no estás usando el Wi-Fi de la escuela sino **datos móviles personales**, la IP del adaptador de datos es diferente a la del Wi-Fi y puede ser difícil identificarla. La IP que muestra Expo siempre corresponde a la red activa correcta.

### La IP puede cambiar

Cada vez que cambias de red (Wi-Fi de la escuela → datos móviles, o viceversa), tu IP cambia. Antes de cada sesión de desarrollo verifica que la IP en `api.ts` coincida con la que muestra Expo.

---

## 🛠️ Problemas frecuentes

### "No se pudo conectar con el servidor"

Este error aparece en la app cuando `api.ts` tiene una IP o puerto incorrecto.

**Checklist:**

1. ¿El servidor Django está corriendo? (`python manage.py runserver 0.0.0.0:8000`)
2. ¿La IP en `api.ts` coincide con la que muestra Expo en la terminal?
3. ¿El puerto en `api.ts` es `8000` y no `8081`?
4. ¿Tu celular y tu computadora están en la misma red?
5. ¿El firewall de Windows permite conexiones entrantes al puerto `8000`?
   - Panel de control → Firewall → Reglas de entrada → Nueva regla → Puerto TCP 8000

Para verificar que Django responde, abre desde el **navegador de tu celular**:

```
http://TU_IP:8000/api/departamentos/
```

Si carga, Django funciona. Si la app sigue fallando, el problema está en `api.ts`.

---

### Error al subir imágenes desde dispositivo físico

**Error:** `Not a valid base64 encoded string length`

**Causa:** En dispositivos físicos (Android/iOS), las imágenes seleccionadas con `expo-image-picker` tienen URIs del tipo `file:///...`, no `data:image/base64,...`. Intentar convertirlas con `atob()` causa este error.

**Solución:** En `nuevo.tsx` se usa la función `prepararImagen()` que detecta la plataforma automáticamente:

```typescript
async function prepararImagen(img: ImagenLocal): Promise<any> {
  if (Platform.OS === 'web') {
    return await uriABlob(img.uri);   // web: convierte a Blob
  }
  return { uri: img.uri, name: img.name, type: img.type };  // dispositivo: objeto directo
}
```

React Native acepta ese objeto `{ uri, name, type }` directamente en `FormData` sin necesidad de convertirlo.

---

### Reset de base de datos

Si recibes errores de migraciones inconsistentes (`InconsistentMigrationHistory`, columnas duplicadas, etc.), haz un reset completo:

```bash
# 1. Eliminar la base de datos desde pgAdmin, o desde psql:
cd "C:\Program Files\PostgreSQL\17\bin"
psql -U postgres
DROP DATABASE rentafacil_db;
CREATE DATABASE rentafacil_db;
\q

# 2. Eliminar migraciones antiguas (desde backend/)
del departamentos\migrations\0*.py
del usuarios\migrations\0*.py
del mensajes\migrations\0*.py
del citas\migrations\0*.py

# 3. Recrear migraciones y aplicarlas
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

---

## 📦 Dependencias adicionales

Ejecuta estos comandos si instalaste el proyecto desde cero y algo no funciona.

Desde `RentaFacil/backend/`:

```bash
pip install django-cors-headers   # Eliminar errores de fetch (CORS)
pip install Pillow                 # Almacenar y validar imágenes
```

Desde `RentaFacil/frontend/`:

```bash
npx expo install @react-native-async-storage/async-storage   # Estado del login
npx expo install @react-native-community/datetimepicker      # Selector de fecha
npx expo install expo-document-picker                         # Subir archivos
npx expo install expo-image-picker                            # Subir imágenes
npx expo install react-native-webview                         # Web View
npx expo install expo-location                              # Localización
```

> ⚠️ Recuerda copiar `api-example.ts` como `api.ts` y llenar `.env` con tus datos antes de iniciar.

---

## 👥 Equipo

Proyecto para la materia **Formulación y Evaluación de Proyectos Informáticos** — ESCOM / IPN.