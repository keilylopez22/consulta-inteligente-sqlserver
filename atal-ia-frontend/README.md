# Atal-IA — Frontend

Interfaz de chatbot construida con **React + Vite** que permite consultar la base de datos **DonaldV2** de Super Taller Donald en lenguaje natural. Muestra los resultados en tablas dinámicas con paginación integrada.

---

## Tecnologías

| Tecnología | Versión | Rol |
|---|---|---|
| React | 18+ | Framework UI |
| Vite | 6+ | Bundler / servidor de desarrollo |
| JavaScript (JSX) | ES2022+ | Lenguaje base |

> Sin librerías de UI externas — todo el diseño está implementado con estilos en línea y CSS variables.

---

## Estructura

```
atal-ia-frontend/
├── src/
│   ├── main.jsx          # Entry point de React
│   ├── App.jsx           # Componente principal, lógica del chat y paginación
│   ├── ChatMessage.jsx   # Burbuja de mensaje + controles de paginación
│   ├── ResultTable.jsx   # Tabla dinámica de resultados
│   └── index.css         # Variables CSS y estilos globales
├── index.html
├── vite.config.js
└── package.json
```

---

## Requisitos previos

- Node.js 18+ (instalado en `C:\Program Files\nodejs`)
- Backend Atal-IA corriendo en `http://localhost:8000`

---

## Instalación

```bash
cd atal-ia-frontend

# Si npm no está en el PATH
set "PATH=%PATH%;C:\Program Files\nodejs"

npm install
```

---

## Ejecución

```bash
set "PATH=%PATH%;C:\Program Files\nodejs"
npm run dev
```

O usando el script desde la raíz del proyecto:

```bash
start-frontend.bat
```

La aplicación estará disponible en: `http://localhost:5173`

---

## Componentes

### `App.jsx`
Componente raíz que gestiona:
- Estado del historial de mensajes
- Envío de preguntas al backend (`POST /query`)
- Navegación entre páginas (`goToPage`)
- Indicador de carga animado
- Sugerencias de preguntas en el inicio

### `ChatMessage.jsx`
Renderiza cada burbuja del chat con:
- Avatar diferenciado para usuario y bot
- Badge con el SQL generado (colapsable visualmente)
- Tabla de resultados embebida
- Controles de paginación: Primera · Anterior · `X de Y` · Siguiente · Última
- Mensaje de error amigable (sin detalles técnicos)
- Timestamp del mensaje

### `ResultTable.jsx`
Tabla dinámica que:
- Genera columnas automáticamente desde las claves del primer objeto
- Alterna colores de fila para mejor legibilidad
- Muestra `NULL` con estilo diferenciado
- Muestra el conteo de filas en el pie de tabla
- Soporta scroll horizontal para tablas anchas

---

## Diseño

El tema visual es oscuro con acento púrpura, definido mediante CSS variables en `index.css`:

| Variable | Color | Uso |
|---|---|---|
| `--bg` | `#0f1117` | Fondo general |
| `--surface` | `#1a1d27` | Superficie del chat |
| `--surface2` | `#22263a` | Header, input, badges |
| `--accent` | `#6c63ff` | Color principal (púrpura) |
| `--accent2` | `#a78bfa` | Color secundario (lavanda) |
| `--success` | `#10b981` | Indicador de conexión |
| `--error` | `#ef4444` | Mensajes de error |

---

## Flujo de una consulta

```
Usuario escribe pregunta
        ↓
App.jsx → POST /query?page=1&page_size=50
        ↓
Backend responde { sql, results, total, page, total_pages }
        ↓
ChatMessage muestra:
  • Resumen ("Encontré X registros")
  • Badge con el SQL generado
  • ResultTable con los datos
  • Paginación (si total_pages > 1)
```

---

## Paginación

- Cada respuesta muestra hasta **50 filas** por defecto (máx 100)
- Si hay más páginas, aparecen los botones de navegación debajo de la tabla
- Cada cambio de página genera un nuevo mensaje en el chat con los resultados de esa página

---

## Manejo de errores

| Situación | Mensaje mostrado al usuario |
|---|---|
| Operación DML/DDL detectada | Mensaje del backend (⛔ Operación no permitida...) |
| Error de SQL / BD | "Ocurrió un error inesperado. Por favor intenta de nuevo." |
| API no disponible | "Verifica que el servidor esté corriendo en http://localhost:8000" |

Los errores técnicos (stack traces, mensajes de SQL Server) **nunca se muestran** al usuario.
