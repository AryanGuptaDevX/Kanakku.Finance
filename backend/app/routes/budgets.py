from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from backend.app.database import get_db
from backend.app.models.budget import Budget
from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from backend.app.services.calculator import FinancialCalculator

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: str = Query(default=datetime.now().strftime("%Y-%m"), pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db)
):
    s_date, e_date = FinancialCalculator.get_month_date_range(month)
    
    budgets = db.query(Budget).options(joinedload(Budget.category)).filter(Budget.month == month).all()
    
    result = []
    for b in budgets:
        # Calculate actual spending in month
        if b.category_id is None:
            # Overall monthly budget
            spent_query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.type == "expense",
                Transaction.date >= s_date,
                Transaction.date <= e_date
            ).scalar()
        else:
            # Category specific budget
            spent_query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.type == "expense",
                Transaction.category_id == b.category_id,
                Transaction.date >= s_date,
                Transaction.date <= e_date
            ).scalar()
            
        spent = round(float(spent_query), 2)
        remaining = round(b.amount - spent, 2)
        pct = round((spent / b.amount * 100) if b.amount > 0 else 0, 1)

        result.append(BudgetResponse(
            id=b.id,
            month=b.month,
            category_id=b.category_id,
            amount=b.amount,
            category=b.category,
            spent=spent,
            remaining=remaining,
            percentage=pct
        ))
        
    return result

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_budget(budget_in: BudgetCreate, db: Session = Depends(get_db)):
    if budget_in.category_id:
        cat = db.query(Category).filter(Category.id == budget_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        if cat.type != "expense":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budgets can only be set for expense categories")

    existing = db.query(Budget).filter(
        Budget.month == budget_in.month,
        Budget.category_id == budget_in.category_id
    ).first()

    if existing:
        existing.amount = budget_in.amount
        db.commit()
        db.refresh(existing)
        target_budget = existing
    else:
        new_budget = Budget(
            month=budget_in.month,
            category_id=budget_in.category_id,
            amount=budget_in.amount
        )
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        target_budget = new_budget

    # Re-fetch with category relationship
    target_budget = db.query(Budget).options(joinedload(Budget.category)).filter(Budget.id == target_budget.id).first()
    
    s_date, e_date = FinancialCalculator.get_month_date_range(target_budget.month)
    if target_budget.category_id is None:
        spent_query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.type == "expense",
            Transaction.date >= s_date,
            Transaction.date <= e_date
        ).scalar()
    else:
        spent_query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.type == "expense",
            Transaction.category_id == target_budget.category_id,
            Transaction.date >= s_date,
            Transaction.date <= e_date
        ).scalar()

    spent = round(float(spent_query), 2)
    remaining = round(target_budget.amount - spent, 2)
    pct = round((spent / target_budget.amount * 100) if target_budget.amount > 0 else 0, 1)

    return BudgetResponse(
        id=target_budget.id,
        month=target_budget.month,
        category_id=target_budget.category_id,
        amount=target_budget.amount,
        category=target_budget.category,
        spent=spent,
        remaining=remaining,
        percentage=pct
    )

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    db.delete(b)
    db.commit()
    return None
