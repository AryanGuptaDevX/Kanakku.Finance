from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database import engine, Base, SessionLocal
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
    settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
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

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MoneyManager API"}
