import os
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from db import get_schema

load_dotenv()

_FORBIDDEN = re.compile(
    r"^\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE)\b",
    re.IGNORECASE | re.MULTILINE,
)

_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Eres un experto en SQL Server. Tu única tarea es traducir la pregunta del usuario "
     "a una consulta SQL válida usando SOLO sentencias SELECT. "
     "NUNCA generes INSERT, UPDATE, DELETE, DROP, CREATE, ALTER ni ningún DDL o DML. "
     "Usa sintaxis T-SQL compatible con SQL Server. "
     "Responde ÚNICAMENTE con el SQL, sin explicaciones ni bloques de código markdown. "
     "Schema de la base de datos DonaldV2:\n{schema}"),
    ("human", "{question}"),
])

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0,
)

_chain = _PROMPT | _llm


class ForbiddenOperationError(ValueError):
    pass


def natural_to_sql(question: str) -> str:
    schema = get_schema()
    result = _chain.invoke({"question": question, "schema": schema})
    sql = result.content.strip()

    forbidden_match = _FORBIDDEN.search(sql)
    if forbidden_match:
        op = forbidden_match.group(1).upper()
        print(f"[SEGURIDAD] Operación prohibida detectada: {op} | Pregunta: '{question}' | SQL generado: {sql}")
        raise ForbiddenOperationError(
            f"⛔ Operación '{op}' no permitida. "
            "Atal-IA solo puede realizar consultas de lectura (SELECT). "
            "No está autorizado para modificar, eliminar ni crear datos."
        )

    if not re.match(r"^\s*SELECT\b", sql, re.IGNORECASE):
        print(f"[SEGURIDAD] SQL no-SELECT generado | Pregunta: '{question}' | SQL: {sql}")
        raise ForbiddenOperationError(
            "⛔ Solo se permiten consultas de lectura. "
            "No puedo ejecutar operaciones que modifiquen la base de datos."
        )

    return sql
