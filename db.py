import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        server = os.getenv("DB_SERVER", "192.168.1.10")
        database = os.getenv("DB_NAME", "DonaldV2")
        username = os.getenv("DB_USER", "")
        password = os.getenv("DB_PASSWORD", "")

        if username and password:
            odbc = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={server};DATABASE={database};"
                f"UID={username};PWD={password};"
            )
        else:
            odbc = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={server};DATABASE={database};"
                "Trusted_Connection=yes;"
            )

        conn_str = f"mssql+pyodbc:///?odbc_connect={odbc}"
        _engine = create_engine(conn_str)
    return _engine


def get_schema() -> str:
    engine = get_engine()
    query = text("""
        SELECT
            t.TABLE_NAME,
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.IS_NULLABLE,
            c.CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.TABLES t
        JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
        WHERE t.TABLE_TYPE = 'BASE TABLE'
        ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    """)

    tables: dict[str, list[str]] = {}
    with engine.connect() as conn:
        for row in conn.execute(query):
            table = row[0]
            col = row[1]
            dtype = row[2]
            nullable = "NULL" if row[3] == "YES" else "NOT NULL"
            max_len = f"({row[4]})" if row[4] else ""
            tables.setdefault(table, []).append(f"{col} {dtype}{max_len} {nullable}")

    return "\n".join(
        f"tabla {name}({', '.join(cols)})" for name, cols in tables.items()
    )


def execute_query(sql: str, page: int = 1, page_size: int = 100) -> tuple[list[dict], bool]:
    engine = get_engine()
    offset = (page - 1) * page_size
    paginated_sql = (
        f"SELECT * FROM ({sql}) AS _q "
        f"ORDER BY (SELECT NULL) "
        f"OFFSET {offset} ROWS FETCH NEXT {page_size + 1} ROWS ONLY"
    )
    with engine.connect() as conn:
        result = conn.execute(text(paginated_sql))
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
    has_more = len(rows) > page_size
    return rows[:page_size], has_more
