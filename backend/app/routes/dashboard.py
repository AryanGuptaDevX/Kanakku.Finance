from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.database import get_db
from backend.app.schemas.dashboard import DashboardSummaryResponse
from backend.app.services.calculator import FinancialCalculator

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    month: str = Query(default=datetime.now().strftime("%Y-%m"), pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db)
):
    summary = FinancialCalculator.get_dashboard_summary(db, month)
    return summary
