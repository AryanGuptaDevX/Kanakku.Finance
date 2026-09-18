from pydantic import BaseModel, Field
from datetime import date as date_type, datetime
from typing import Optional

class SIPBase(BaseModel):
    fund_name: str = Field(..., min_length=1)
    monthly_amount: float = Field(..., gt=0)
    start_date: date_type
    total_invested: float = Field(..., ge=0)
    current_value: float = Field(..., ge=0)

class SIPCreate(SIPBase):
    pass

class SIPUpdate(BaseModel):
    fund_name: Optional[str] = None
    monthly_amount: Optional[float] = None
    total_invested: Optional[float] = None
    current_value: Optional[float] = None

class SIPResponse(SIPBase):
    id: int
    created_at: datetime
    
    # Calculated metrics
    profit_loss: float
    return_percentage: float

    class Config:
        from_attributes = True
