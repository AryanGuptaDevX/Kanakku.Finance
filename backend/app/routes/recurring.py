from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models.recurring import RecurringTransaction
from backend.app.models.category import Category
from backend.app.schemas.recurring import RecurringCreate, RecurringUpdate, RecurringResponse
from backend.app.services.recurring_service import RecurringService

router = APIRouter(prefix="/api/recurring", tags=["Recurring Transactions"])

@router.get("", response_model=List[RecurringResponse])
def get_recurring_transactions(type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RecurringTransaction).options(joinedload(RecurringTransaction.category))
    if type:
        query = query.filter(RecurringTransaction.type == type)
    return query.order_by(RecurringTransaction.created_at.desc()).all()

@router.post("", response_model=RecurringResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_transaction(recurring_in: RecurringCreate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == recurring_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    rec = RecurringTransaction(
        title=recurring_in.title,
        type=recurring_in.type,
        amount=recurring_in.amount,
        category_id=recurring_in.category_id,
        frequency=recurring_in.frequency,
        day_of_month=recurring_in.day_of_month,
        day_of_week=recurring_in.day_of_week,
        month_of_year=recurring_in.month_of_year,
        is_active=recurring_in.is_active if recurring_in.is_active is not None else True
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    # Immediately process if applicable
    RecurringService.process_recurring_transactions(db)

    return db.query(RecurringTransaction).options(joinedload(RecurringTransaction.category)).filter(RecurringTransaction.id == rec.id).first()

@router.put("/{recurring_id}", response_model=RecurringResponse)
def update_recurring_transaction(recurring_id: int, recurring_in: RecurringUpdate, db: Session = Depends(get_db)):
    rec = db.query(RecurringTransaction).filter(RecurringTransaction.id == recurring_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")

    if recurring_in.title is not None:
        rec.title = recurring_in.title
    if recurring_in.amount is not None:
        if recurring_in.amount <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than 0")
        rec.amount = recurring_in.amount
    if recurring_in.category_id is not None:
        cat = db.query(Category).filter(Category.id == recurring_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        rec.category_id = recurring_in.category_id
    if recurring_in.frequency is not None:
        rec.frequency = recurring_in.frequency
    if recurring_in.day_of_month is not None:
        rec.day_of_month = recurring_in.day_of_month
    if recurring_in.is_active is not None:
        rec.is_active = recurring_in.is_active

    db.commit()
    return db.query(RecurringTransaction).options(joinedload(RecurringTransaction.category)).filter(RecurringTransaction.id == recurring_id).first()

@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_transaction(recurring_id: int, db: Session = Depends(get_db)):
    rec = db.query(RecurringTransaction).filter(RecurringTransaction.id == recurring_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    db.delete(rec)
    db.commit()
    return None

@router.post("/process", status_code=status.HTTP_200_OK)
def trigger_process_recurring(month: Optional[str] = Query(None), db: Session = Depends(get_db)):
    created_count = RecurringService.process_recurring_transactions(db, month)
    return {"message": "Recurring transactions processed successfully", "created_count": created_count}
