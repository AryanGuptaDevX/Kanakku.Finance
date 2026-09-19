import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "money_manager.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def sync_schema(engine):
    """Dynamically add missing columns for lightweight SQLite schema migration."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if "recurring_transactions" in tables:
        cols = [c["name"] for c in inspector.get_columns("recurring_transactions")]
        with engine.begin() as conn:
            if "start_date" not in cols:
                conn.execute(text("ALTER TABLE recurring_transactions ADD COLUMN start_date DATE"))
            if "end_date" not in cols:
                conn.execute(text("ALTER TABLE recurring_transactions ADD COLUMN end_date DATE"))

    if "transactions" in tables:
        cols = [c["name"] for c in inspector.get_columns("transactions")]
        with engine.begin() as conn:
            if "account_id" not in cols:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)"))
            if "to_account_id" not in cols:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN to_account_id INTEGER REFERENCES accounts(id)"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
