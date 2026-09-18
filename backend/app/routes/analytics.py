from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date

from backend.app.database import get_db
from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.services.calculator import FinancialCalculator

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category_id: Optional[int] = None,
    transaction_type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    
    if month:
        s_date, e_date = FinancialCalculator.get_month_date_range(month)
        query = query.filter(Transaction.date >= s_date, Transaction.date <= e_date)
    elif start_date and end_date:
        query = query.filter(Transaction.date >= start_date, Transaction.date <= end_date)
        
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if transaction_type:
        query = query.filter(Transaction.type == transaction_type)

    all_txs = query.all()

    total_income = sum(t.amount for t in all_txs if t.type == "income")
    total_expense = sum(t.amount for t in all_txs if t.type == "expense")
    net_savings = total_income - total_expense
    savings_rate = round((net_savings / total_income * 100) if total_income > 0 else 0.0, 1)

    # Expense Category Breakdown
    cat_breakdown_query = db.query(
        Category.name,
        Category.color,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(Transaction.type == "expense")

    if month:
        s_date, e_date = FinancialCalculator.get_month_date_range(month)
        cat_breakdown_query = cat_breakdown_query.filter(Transaction.date >= s_date, Transaction.date <= e_date)
    elif start_date and end_date:
        cat_breakdown_query = cat_breakdown_query.filter(Transaction.date >= start_date, Transaction.date <= end_date)

    if category_id:
        cat_breakdown_query = cat_breakdown_query.filter(Transaction.category_id == category_id)

    cat_breakdown = cat_breakdown_query.group_by(Category.name, Category.color).all()

    category_data = [
        {
            "name": name,
            "color": color or "#64748b",
            "value": round(float(total), 2),
            "percentage": round((float(total) / total_expense * 100) if total_expense > 0 else 0.0, 1)
        }
        for name, color, total in cat_breakdown
    ]

    # Past 6 Months Monthly Trend Analysis
    ref_month = month or datetime.now().strftime("%Y-%m")
    trend = FinancialCalculator.get_monthly_trend(db, ref_month, num_months=6)

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": savings_rate,
        "category_breakdown": category_data,
        "monthly_trend": trend
    }
