from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from backend.app.database import get_db
from backend.app.models.sip import SIPInvestment
from backend.app.models.sip_contribution import SIPContribution
from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.schemas.sip import SIPCreate, SIPUpdate, SIPResponse, SIPContributionCreate, SIPContributionResponse

router = APIRouter(prefix="/api/sips", tags=["SIP Tracker"])

def _format_sip_response(sip: SIPInvestment) -> SIPResponse:
    pl = round(sip.current_value - sip.total_invested, 2)
    ret_pct = round((pl / sip.total_invested * 100) if sip.total_invested > 0 else 0.0, 2)

    return SIPResponse(
        id=sip.id,
        fund_name=sip.fund_name,
        monthly_amount=sip.monthly_amount,
        start_date=sip.start_date,
        total_invested=sip.total_invested,
        current_value=sip.current_value,
        is_active=sip.is_active,
        created_at=sip.created_at,
        profit_loss=pl,
        return_percentage=ret_pct
    )

@router.get("", response_model=List[SIPResponse])
def get_sips(db: Session = Depends(get_db)):
    sips = db.query(SIPInvestment).order_by(SIPInvestment.is_active.desc(), SIPInvestment.created_at.desc()).all()
    return [_format_sip_response(s) for s in sips]

@router.post("", response_model=SIPResponse, status_code=status.HTTP_201_CREATED)
def create_sip(sip_in: SIPCreate, db: Session = Depends(get_db)):
    sip = SIPInvestment(
        fund_name=sip_in.fund_name,
        monthly_amount=sip_in.monthly_amount,
        start_date=sip_in.start_date,
        total_invested=sip_in.total_invested,
        current_value=sip_in.current_value,
        is_active=sip_in.is_active
    )
    db.add(sip)
    db.commit()
    db.refresh(sip)
    return _format_sip_response(sip)

@router.put("/{sip_id}", response_model=SIPResponse)
def update_sip(sip_id: int, sip_in: SIPUpdate, db: Session = Depends(get_db)):
    sip = db.query(SIPInvestment).filter(SIPInvestment.id == sip_id).first()
    if not sip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SIP investment not found")

    if sip_in.fund_name is not None:
        sip.fund_name = sip_in.fund_name
    if sip_in.monthly_amount is not None:
        if sip_in.monthly_amount <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Monthly amount must be > 0")
        sip.monthly_amount = sip_in.monthly_amount
    if sip_in.total_invested is not None:
        if sip_in.total_invested < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Total invested cannot be negative")
        sip.total_invested = sip_in.total_invested
    if sip_in.current_value is not None:
        if sip_in.current_value < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current value cannot be negative")
        sip.current_value = sip_in.current_value
    if sip_in.is_active is not None:
        sip.is_active = sip_in.is_active

    db.commit()
    db.refresh(sip)
    return _format_sip_response(sip)

@router.post("/{sip_id}/contribute", response_model=SIPResponse)
def add_sip_contribution(sip_id: int, contrib_in: SIPContributionCreate, db: Session = Depends(get_db)):
    sip = db.query(SIPInvestment).filter(SIPInvestment.id == sip_id).first()
    if not sip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SIP investment not found")

    contrib_amount = round(contrib_in.amount, 2)
    sip.total_invested = round(sip.total_invested + contrib_amount, 2)
    sip.current_value = round(sip.current_value + contrib_amount, 2)

    tx_id = None
    if contrib_in.create_transaction:
        inv_cat = db.query(Category).filter(Category.type == "expense", Category.name.ilike("%Investment%")).first()
        if not inv_cat:
            inv_cat = db.query(Category).filter(Category.type == "expense").first()

        if inv_cat:
            tx = Transaction(
                type="expense",
                amount=contrib_amount,
                source_or_payee=f"SIP: {sip.fund_name}",
                category_id=inv_cat.id,
                description=f"Monthly SIP Investment Contribution",
                date=contrib_in.date or date.today(),
                payment_method="Bank Transfer"
            )
            db.add(tx)
            db.flush()
            tx_id = tx.id

    contrib = SIPContribution(
        sip_id=sip.id,
        amount=contrib_amount,
        date=contrib_in.date or date.today(),
        transaction_id=tx_id
    )
    db.add(contrib)
    db.commit()
    db.refresh(sip)
    return _format_sip_response(sip)

@router.delete("/{sip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sip(sip_id: int, db: Session = Depends(get_db)):
    sip = db.query(SIPInvestment).filter(SIPInvestment.id == sip_id).first()
    if not sip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SIP investment not found")
    db.delete(sip)
    db.commit()
    return None
