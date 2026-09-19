from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
import calendar

from backend.app.database import get_db
from backend.app.models.emi import EMI
from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.schemas.emi import EMICreate, EMIUpdate, EMIPaymentCreate, EMIResponse

router = APIRouter(prefix="/api/emis", tags=["EMI Tracker"])

def _calculate_reducing_balance_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """Standard Reducing Balance EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)."""
    if annual_rate <= 0 or tenure_months <= 0:
        return round(principal / tenure_months, 2)
    
    r = (annual_rate / 100) / 12.0
    n = tenure_months
    emi_val = principal * (r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)
    return round(emi_val, 2)

def _format_emi_response(emi: EMI) -> EMIResponse:
    payments_remaining = max(emi.total_payments - emi.payments_made, 0)
    progress_pct = round((emi.payments_made / emi.total_payments * 100) if emi.total_payments > 0 else 0.0, 1)

    # Calculate monthly interest component & principal component based on reducing balance
    monthly_rate = (emi.interest_rate / 100) / 12.0 if emi.interest_rate > 0 else 0.0
    monthly_interest = round(emi.remaining_amount * monthly_rate, 2)
    monthly_principal = round(max(emi.monthly_payment - monthly_interest, 0.0), 2)

    # Next due date calculation with valid month day clamping
    today = date.today()
    target_year = today.year
    target_month = today.month
    if today.day > emi.due_day:
        target_month += 1
        if target_month > 12:
            target_month = 1
            target_year += 1

    last_day = calendar.monthrange(target_year, target_month)[1]
    due_d = min(emi.due_day, last_day)
    next_due_date = f"{target_year:04d}-{target_month:02d}-{due_d:02d}"

    return EMIResponse(
        id=emi.id,
        loan_name=emi.loan_name,
        principal_amount=emi.principal_amount,
        monthly_payment=emi.monthly_payment,
        interest_rate=emi.interest_rate,
        start_date=emi.start_date,
        due_day=emi.due_day,
        total_payments=emi.total_payments,
        payments_made=emi.payments_made,
        remaining_amount=emi.remaining_amount,
        is_completed=emi.is_completed,
        created_at=emi.created_at,
        payments_remaining=payments_remaining,
        progress_percentage=progress_pct,
        next_due_date=next_due_date,
        monthly_interest_component=monthly_interest,
        monthly_principal_component=monthly_principal
    )

@router.get("", response_model=List[EMIResponse])
def get_emis(db: Session = Depends(get_db)):
    emis = db.query(EMI).order_by(EMI.is_completed.asc(), EMI.due_day.asc()).all()
    return [_format_emi_response(e) for e in emis]

@router.post("", response_model=EMIResponse, status_code=status.HTTP_201_CREATED)
def create_emi(emi_in: EMICreate, db: Session = Depends(get_db)):
    # Calculate monthly payment using reducing balance formula if not provided
    monthly_pay = emi_in.monthly_payment
    if not monthly_pay or monthly_pay <= 0:
        monthly_pay = _calculate_reducing_balance_emi(
            emi_in.principal_amount,
            emi_in.interest_rate,
            emi_in.total_payments
        )

    remaining = round(emi_in.principal_amount, 2)
    
    emi = EMI(
        loan_name=emi_in.loan_name,
        principal_amount=emi_in.principal_amount,
        monthly_payment=monthly_pay,
        interest_rate=emi_in.interest_rate,
        start_date=emi_in.start_date,
        due_day=emi_in.due_day,
        total_payments=emi_in.total_payments,
        payments_made=0,
        remaining_amount=remaining,
        is_completed=False
    )
    db.add(emi)
    db.commit()
    db.refresh(emi)
    return _format_emi_response(emi)

@router.put("/{emi_id}", response_model=EMIResponse)
def update_emi(emi_id: int, emi_in: EMIUpdate, db: Session = Depends(get_db)):
    emi = db.query(EMI).filter(EMI.id == emi_id).first()
    if not emi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EMI loan not found")

    if emi_in.loan_name is not None:
        emi.loan_name = emi_in.loan_name
    if emi_in.monthly_payment is not None:
        if emi_in.monthly_payment <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Monthly payment must be > 0")
        emi.monthly_payment = emi_in.monthly_payment
    if emi_in.interest_rate is not None:
        if emi_in.interest_rate < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interest rate cannot be negative")
        emi.interest_rate = emi_in.interest_rate
    if emi_in.due_day is not None:
        emi.due_day = emi_in.due_day

    db.commit()
    db.refresh(emi)
    return _format_emi_response(emi)

@router.post("/{emi_id}/pay", response_model=EMIResponse)
def record_emi_payment(emi_id: int, pay_in: EMIPaymentCreate, db: Session = Depends(get_db)):
    emi = db.query(EMI).filter(EMI.id == emi_id).first()
    if not emi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EMI loan not found")
    if emi.is_completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="EMI loan is already fully paid off")

    pay_amount = pay_in.amount if pay_in.amount and pay_in.amount > 0 else emi.monthly_payment
    pay_amount = round(pay_amount, 2)

    # Amortization math
    monthly_rate = (emi.interest_rate / 100) / 12.0 if emi.interest_rate > 0 else 0.0
    interest_portion = round(emi.remaining_amount * monthly_rate, 2)
    max_payable = round(emi.remaining_amount + interest_portion, 2)

    # Overpayment Validation
    if pay_amount > max_payable + 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount ({pay_amount}) cannot exceed total remaining balance + accrued interest ({max_payable})."
        )

    principal_portion = max(round(pay_amount - interest_portion, 2), 0.0)
    emi.remaining_amount = max(round(emi.remaining_amount - principal_portion, 2), 0.0)
    emi.payments_made += 1

    if emi.payments_made >= emi.total_payments or emi.remaining_amount <= 0:
        emi.is_completed = True
        emi.remaining_amount = 0.0

    # Record expense transaction under Bills/EMI if requested
    if pay_in.create_transaction:
        bills_cat = db.query(Category).filter(Category.type == "expense", Category.name.ilike("Bills")).first()
        if not bills_cat:
            bills_cat = db.query(Category).filter(Category.type == "expense").first()

        if bills_cat:
            tx = Transaction(
                type="expense",
                amount=pay_amount,
                source_or_payee=f"EMI: {emi.loan_name}",
                category_id=bills_cat.id,
                description=f"EMI Payment #{emi.payments_made} (Principal: {principal_portion}, Interest: {interest_portion})",
                date=date.today(),
                payment_method="Bank Transfer"
            )
            db.add(tx)

    db.commit()
    db.refresh(emi)
    return _format_emi_response(emi)

@router.delete("/{emi_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emi(emi_id: int, db: Session = Depends(get_db)):
    emi = db.query(EMI).filter(EMI.id == emi_id).first()
    if not emi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EMI loan not found")
    db.delete(emi)
    db.commit()
    return None
