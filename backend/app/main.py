import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database import engine, Base, SessionLocal, sync_schema
from backend.app.utils.seed import seed_default_categories
from backend.app.services.recurring_service import RecurringService

from backend.app.routes import (
    categories,
    transactions,
    dashboard,
    budgets,
    recurring,
    emis,
    sips,
    goals,
    analytics,
    export,
    settings,
    auth,
    accounts
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables & sync schema
    Base.metadata.create_all(bind=engine)
    sync_schema(engine)
    # Seed default categories
    db = SessionLocal()
    try:
        seed_default_categories(db)
        # Process recurring transactions
        RecurringService.process_recurring_transactions(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="MoneyManager API",
    description="Production-grade Personal Finance Management REST API",
    version="1.0.0",
    lifespan=lifespan
)

# Configurable CORS origins for production security
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:8000")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
if "*" in allowed_origins or os.getenv("ENVIRONMENT") == "development":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(recurring.router)
app.include_router(emis.router)
app.include_router(sips.router)
app.include_router(goals.router)
app.include_router(analytics.router)
app.include_router(export.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to MoneyManager Backend API Server",
        "frontend_app_url": "http://localhost:5173",
        "api_documentation": "http://127.0.0.1:8000/docs",
        "health_check": "http://127.0.0.1:8000/api/health"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MoneyManager API"}
