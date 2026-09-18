from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.sip import SIPInvestment
from backend.app.schemas.sip import SIPCreate, SIPUpdate, SIPResponse

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
        created_at=sip.created_at,
        profit_loss=pl,
        return_percentage=ret_pct
    )

@router.get("", response_model=List[SIPResponse])
def get_sips(db: Session = Depends(get_db)):
    sips = db.query(SIPInvestment).order_by(SIPInvestment.created_at.desc()).all()
    return [_format_sip_response(s) for s in sips]

@router.post("", response_model=SIPResponse, status_code=status.HTTP_201_CREATED)
def create_sip(sip_in: SIPCreate, db: Session = Depends(get_db)):
    sip = SIPInvestment(
        fund_name=sip_in.fund_name,
        monthly_amount=sip_in.monthly_amount,
        start_date=sip_in.start_date,
        total_invested=sip_in.total_invested,
        current_value=sip_in.current_value
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
        sip.total_invested = sip_in.total_invested
    if sip_in.current_value is not None:
        sip.current_value = sip_in.current_value

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
