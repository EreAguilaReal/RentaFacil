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

Abre `frontend/services/api.ts` y reemplaza la IP con **tu IP local**:

```typescript
const URL_BASE = 'http://TU_IP_LOCAL:8000/api';
```

Para encontrar tu IP local corre en la terminal:

```bash
# Windows
ipconfig
# Busca "Dirección IPv4" en el adaptador Wi-Fi

# Mac / Linux
ifconfig | grep inet
```

> ⚠️ Tu celular y tu computadora deben estar en el **mismo WiFi** para que la app pueda conectarse al backend.

#### Iniciar Expo

```bash
npx expo start
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

## 👥 Equipo

Proyecto para la materia **Formulación y Evaluación de Proyectos Informáticos**.

## Instalar CORS para eliminar errores de fetch
## pip install django-cors-headers

## En caso de tener una base de datos antigua, eliminarla desde pgAdmin, crearla de nuevo con:
## python manage.py makemigrations
## python manage.py migrate
## python manage.py createsuperuser
## python manage.py runserver 0.0.0.0:8000