import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sql_chain import natural_to_sql, ForbiddenOperationError
from db import get_schema, execute_query

logger = logging.getLogger("atal-ia")

app = FastAPI(
    title="Natural Language to SQL API",
    description=(
        "## Descripción\n"
        "API que traduce preguntas en **lenguaje natural** a consultas **SQL Server (T-SQL)**.\n\n"
        "Conectada a la base de datos **DonaldV2** en `192.168.1.101`.\n\n"
        "### Restricciones de seguridad\n"
        "- Solo se permiten sentencias `SELECT`.\n"
        "- Cualquier intento de generar `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, "
        "`ALTER` u otras operaciones DML/DDL será rechazado con HTTP **400**.\n\n"
        "### Motor de IA\n"
        "Utiliza **Gemini 2.5 Flash** a través de LangChain para la traducción."
    ),
    version="1.0.0",
    contact={
        "name": "Equipo de Base de Datos",
    },
    license_info={
        "name": "MIT",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Modelos ──────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(
        ...,
        title="Pregunta en lenguaje natural",
        description="Escribe tu consulta en español o inglés tal como la harías a una persona.",
        examples=["¿Cuáles son los 10 clientes con más pedidos?"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"question": "¿Cuáles son los 10 clientes con más pedidos?"},
                {"question": "Muéstrame las ventas totales por mes del año 2024"},
                {"question": "¿Qué productos tienen stock menor a 5 unidades?"},
            ]
        }
    }


class QueryResponse(BaseModel):
    sql: str = Field(..., description="Sentencia T-SQL ejecutada en SQL Server.")
    results: list[dict] = Field(..., description="Filas de la página actual.")
    page: int = Field(..., description="Página actual.")
    page_size: int = Field(..., description="Filas por página.")
    has_more: bool = Field(..., description="Indica si hay más páginas.")


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Descripción del error ocurrido.")


class SchemaResponse(BaseModel):
    schema_text: str = Field(..., description="Schema completo de la base de datos DonaldV2.")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post(
    "/query",
    response_model=QueryResponse,
    responses={
        200: {"description": "Consulta ejecutada exitosamente."},
        400: {"model": ErrorResponse, "description": "Operación DML/DDL no permitida."},
        500: {"model": ErrorResponse, "description": "Error interno."},
    },
    summary="Traducir lenguaje natural a SQL y ejecutar",
    description="Recibe una pregunta en lenguaje natural, genera el T-SQL y devuelve los resultados.\n\nSolo se permiten sentencias `SELECT`.",
    tags=["Consultas"],
)
def query(
    request: QueryRequest,
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=100, ge=1, le=100, description="Filas por página (máx 100)"),
):
    try:
        sql = natural_to_sql(request.question)
        results, has_more = execute_query(sql, page=page, page_size=page_size)
        return QueryResponse(sql=sql, results=results, page=page, page_size=page_size, has_more=has_more)
    except ForbiddenOperationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error ejecutando consulta: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="No se pudo procesar la consulta. Intenta reformular tu pregunta.")


@app.get(
    "/schema",
    response_model=SchemaResponse,
    responses={
        200: {"description": "Schema obtenido exitosamente."},
        500: {"model": ErrorResponse, "description": "No se pudo conectar a la base de datos."},
    },
    summary="Obtener schema de la base de datos",
    description=(
        "Devuelve el schema completo de la base de datos **DonaldV2** "
        "(tablas y columnas con sus tipos de datos). "
        "Útil para conocer qué información puedes consultar."
    ),
    tags=["Utilidades"],
)
def schema():
    try:
        return SchemaResponse(schema_text=get_schema())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener schema: {str(e)}")


@app.get(
    "/health",
    summary="Estado de la API",
    description="Verifica que la API esté en funcionamiento.",
    tags=["Utilidades"],
    responses={200: {"description": "API operativa."}},
)
def health():
    return {"status": "ok", "database": "DonaldV2", "server": "192.168.1.101"}
