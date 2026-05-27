from fastapi import FastAPI, HTTPException
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field
from sql_chain import natural_to_sql
from db import get_schema, execute_query

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
    sql: str = Field(
        ...,
        title="Consulta SQL generada",
        description="Sentencia T-SQL ejecutada en SQL Server.",
        examples=["SELECT TOP 10 cliente_id, COUNT(*) AS total_pedidos FROM pedidos GROUP BY cliente_id ORDER BY total_pedidos DESC"],
    )
    results: list[dict] = Field(
        ...,
        title="Resultados",
        description="Filas devueltas por la consulta.",
    )


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Descripción del error ocurrido.")


class SchemaResponse(BaseModel):
    schema_text: str = Field(..., description="Schema completo de la base de datos DonaldV2.")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post(
    "/query",
    response_model=QueryResponse,
    responses={
        200: {"description": "SQL generado exitosamente."},
        400: {"model": ErrorResponse, "description": "La pregunta generó una operación DML/DDL no permitida."},
        500: {"model": ErrorResponse, "description": "Error interno al procesar la consulta."},
    },
    summary="Traducir lenguaje natural a SQL",
    description=(
        "Recibe una pregunta en lenguaje natural y devuelve la consulta T-SQL equivalente "
        "para ejecutarse sobre la base de datos **DonaldV2**.\n\n"
        "Solo se generan sentencias `SELECT`. Cualquier otra operación es rechazada."
    ),
    tags=["Consultas"],
)
def query(request: QueryRequest):
    try:
        sql = natural_to_sql(request.question)
        results = execute_query(sql)
        return QueryResponse(sql=sql, results=results)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la consulta: {str(e)}")


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
