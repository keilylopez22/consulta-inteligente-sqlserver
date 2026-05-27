# Atal-IA — Backend API

API REST construida con **FastAPI** que recibe preguntas en lenguaje natural, las traduce a T-SQL usando **Gemini 2.5 Flash** a través de **LangChain**, las ejecuta contra una base de datos **SQL Server** y devuelve los resultados paginados.

---

## Tecnologías

| Tecnología | Versión | Rol |
|---|---|---|
| Python | 3.13+ | Lenguaje base |
| FastAPI | Latest | Framework web / API REST |
| LangChain | Latest | Orquestación del LLM |
| Gemini 2.5 Flash | — | Modelo de lenguaje (Google AI) |
| SQLAlchemy | 2.x | ORM / conexión a BD |
| pyodbc | Latest | Driver ODBC para SQL Server |
| Uvicorn | Latest | Servidor ASGI |

---

## Estructura

```
ProyectoFinalBasedatosII/
├── main.py          # Endpoints FastAPI
├── sql_chain.py     # Lógica LangChain + Gemini
├── db.py            # Conexión SQL Server + paginación
├── requirements.txt
├── .env             # Variables de entorno (no subir a git)
├── .env.example     # Plantilla de variables
├── start-api.bat    # Script para levantar la API
└── start-frontend.bat
```

---

## Requisitos previos

- Python 3.13+
- [ODBC Driver 17 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- Acceso a la base de datos `DonaldV2` en `192.168.1.101`
- API Key de Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Instalación

```bash
# 1. Clonar / abrir el proyecto
cd ProyectoFinalBasedatosII

# 2. Instalar dependencias
py -m pip install -r requirements.txt

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales
```

### Variables de entorno (`.env`)

```env
GOOGLE_API_KEY=tu_clave_de_gemini

DB_SERVER=192.168.1.101
DB_NAME=DonaldV2
DB_USER=sa
DB_PASSWORD=tu_password
```

> Si `DB_USER` y `DB_PASSWORD` están vacíos, se usa **Windows Authentication**.

---

## Ejecución

```bash
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

O usando el script:

```bash
start-api.bat
```

---

## Endpoints

### `POST /query` — Consulta en lenguaje natural

Traduce la pregunta a T-SQL, la ejecuta y devuelve los resultados paginados.

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int | 1 | Número de página |
| `page_size` | int | 50 | Filas por página (máx 100) |

**Body:**
```json
{
  "question": "¿Cuáles son los 10 clientes con más pedidos?"
}
```

**Respuesta exitosa (200):**
```json
{
  "sql": "SELECT TOP 10 ...",
  "results": [...],
  "total": 10,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

**Error operación prohibida (400):**
```json
{
  "detail": "⛔ Operación 'DROP' no permitida. Atal-IA solo puede realizar consultas de lectura (SELECT)."
}
```

**Error interno (500):**
```json
{
  "detail": "No se pudo procesar la consulta. Intenta reformular tu pregunta."
}
```

---

### `GET /schema` — Schema de la base de datos

Devuelve todas las tablas y columnas de `DonaldV2` con sus tipos de datos.

**Respuesta (200):**
```json
{
  "schema_text": "tabla clientes(id int NOT NULL, nombre varchar(100) NULL, ...)"
}
```

---

### `GET /health` — Estado de la API

```json
{
  "status": "ok",
  "database": "DonaldV2",
  "server": "192.168.1.101"
}
```

---

## Seguridad

La API tiene **dos capas de protección** contra operaciones DML/DDL:

1. **Prompt del sistema** — Gemini recibe instrucciones explícitas de generar solo `SELECT`
2. **Validación por regex** — Cualquier SQL generado que contenga `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `TRUNCATE`, `REPLACE`, `MERGE`, `GRANT` o `REVOKE` es rechazado con HTTP 400

Cuando se detecta una operación prohibida, se registra en consola:
```
[SEGURIDAD] Operación prohibida detectada: DROP | Pregunta: '...' | SQL generado: ...
```

Los errores técnicos de SQL Server **nunca se exponen al cliente**. Solo se registran en el log del servidor.

---

## Documentación interactiva (Swagger)

Disponible en: `http://localhost:8000/docs`

También disponible en formato ReDoc: `http://localhost:8000/redoc`

---

## Paginación

Todas las consultas están paginadas con un máximo de **100 filas por página** usando `OFFSET / FETCH NEXT` de T-SQL.

```
GET /query?page=2&page_size=100
```
