from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from backend.app.database import get_db
from backend.app.models.goal import SavingsGoal
from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.schemas.goal import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse, SavingsGoalTopUp

router = APIRouter(prefix="/api/goals", tags=["Savings Goals"])

def _format_goal_response(goal: SavingsGoal) -> SavingsGoalResponse:
    remaining = max(round(goal.target_amount - goal.current_savings, 2), 0.0)
    pct = round(min((goal.current_savings / goal.target_amount * 100), 100.0), 1) if goal.target_amount > 0 else 0.0
    is_completed = goal.current_savings >= goal.target_amount

    return SavingsGoalResponse(
        id=goal.id,
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        current_savings=goal.current_savings,
        target_date=goal.target_date,
        description=goal.description,
        is_completed=is_completed,
        created_at=goal.created_at,
        remaining_amount=remaining,
        progress_percentage=pct
    )

@router.get("", response_model=List[SavingsGoalResponse])
def get_goals(db: Session = Depends(get_db)):
    goals = db.query(SavingsGoal).order_by(SavingsGoal.is_completed.asc(), SavingsGoal.target_date.asc()).all()
    return [_format_goal_response(g) for g in goals]

@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(goal_in: SavingsGoalCreate, db: Session = Depends(get_db)):
    if goal_in.target_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target date cannot be in the past."
        )

    is_completed = goal_in.current_savings >= goal_in.target_amount
    goal = SavingsGoal(
        goal_name=goal_in.goal_name,
        target_amount=goal_in.target_amount,
        current_savings=goal_in.current_savings,
        target_date=goal_in.target_date,
        description=goal_in.description,
        is_completed=is_completed
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _format_goal_response(goal)

@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_goal(goal_id: int, goal_in: SavingsGoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    if goal_in.goal_name is not None:
        goal.goal_name = goal_in.goal_name
    if goal_in.target_amount is not None:
        if goal_in.target_amount <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target amount must be > 0")
        goal.target_amount = goal_in.target_amount
    if goal_in.current_savings is not None:
        if goal_in.current_savings < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current savings cannot be negative")
        goal.current_savings = goal_in.current_savings
    if goal_in.target_date is not None:
        if goal_in.target_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target date cannot be in the past."
            )
        goal.target_date = goal_in.target_date
    if goal_in.description is not None:
        goal.description = goal_in.description

    goal.is_completed = goal.current_savings >= goal.target_amount

    db.commit()
    db.refresh(goal)
    return _format_goal_response(goal)

@router.post("/{goal_id}/topup", response_model=SavingsGoalResponse)
def topup_goal(goal_id: int, topup_in: SavingsGoalTopUp, db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    add_amount = round(topup_in.amount, 2)
    goal.current_savings = round(goal.current_savings + add_amount, 2)
    goal.is_completed = goal.current_savings >= goal.target_amount

    if topup_in.create_transaction:
        sav_cat = db.query(Category).filter(Category.type == "expense", Category.name.ilike("%Investment%")).first()
        if not sav_cat:
            sav_cat = db.query(Category).filter(Category.type == "expense").first()

        if sav_cat:
            tx = Transaction(
                type="expense",
                amount=add_amount,
                source_or_payee=f"Savings Deposit: {goal.goal_name}",
                category_id=sav_cat.id,
                description=f"Savings Goal Contribution",
                date=date.today(),
                payment_method="Bank Transfer"
            )
            db.add(tx)

    db.commit()
    db.refresh(goal)
    return _format_goal_response(goal)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")
    db.delete(goal)
    db.commit()
    return None
