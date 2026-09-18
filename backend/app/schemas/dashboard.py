from pydantic import BaseModel
from typing import List, Optional
from backend.app.schemas.transaction import TransactionResponse

class CategoryBreakdownItem(BaseModel):
    category_id: int
    category_name: str
    color: str
    amount: float
    percentage: float

class MonthlyTrendItem(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float

class DashboardSummaryResponse(BaseModel):
    month: str  # YYYY-MM
    total_income: float
    total_expenses: float
    total_emi: float
    total_sip: float
    available_balance: float
    savings_rate: float
    
    income_vs_expense_chart: List[dict]
    expense_category_breakdown: List[CategoryBreakdownItem]
    monthly_trend: List[MonthlyTrendItem]
    budget_progress: Optional[dict]
    savings_goal_progress: List[dict]
    upcoming_emis: List[dict]
    recent_transactions: List[TransactionResponse]
