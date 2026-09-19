from pydantic import BaseModel, Field, ConfigDict
from datetime import date as date_type, datetime
from typing import Optional, List

class SIPContributionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    date: date_type
    create_transaction: bool = True

class SIPContributionResponse(BaseModel):
    id: int
    sip_id: int
    amount: float
    date: date_type
    transaction_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SIPBase(BaseModel):
    fund_name: str = Field(..., min_length=1)
    monthly_amount: float = Field(..., gt=0)
    start_date: date_type
    total_invested: float = Field(..., ge=0)
    current_value: float = Field(..., ge=0)
    is_active: bool = True

class SIPCreate(SIPBase):
    pass

class SIPUpdate(BaseModel):
    fund_name: Optional[str] = None
    monthly_amount: Optional[float] = None
    total_invested: Optional[float] = None
    current_value: Optional[float] = None
    is_active: Optional[bool] = None

class SIPResponse(SIPBase):
    id: int
    created_at: datetime
    
    # Calculated metrics
    profit_loss: float
    return_percentage: float

    model_config = ConfigDict(from_attributes=True)
