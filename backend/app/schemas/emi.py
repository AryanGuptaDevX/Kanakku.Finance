from pydantic import BaseModel, Field
from datetime import date as date_type, datetime
from typing import Optional

class EMIBase(BaseModel):
    loan_name: str = Field(..., min_length=1)
    principal_amount: float = Field(..., gt=0)
    monthly_payment: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    start_date: date_type
    due_day: int = Field(..., ge=1, le=31)
    total_payments: int = Field(..., gt=0)

class EMICreate(EMIBase):
    pass

class EMIUpdate(BaseModel):
    loan_name: Optional[str] = None
    monthly_payment: Optional[float] = None
    interest_rate: Optional[float] = None
    due_day: Optional[int] = None

class EMIPaymentCreate(BaseModel):
    amount: Optional[float] = None  # If null, defaults to monthly_payment

class EMIResponse(EMIBase):
    id: int
    payments_made: int
    remaining_amount: float
    is_completed: bool
    created_at: datetime
    
    # Calculated properties
    payments_remaining: int
    progress_percentage: float
    next_due_date: str

    class Config:
        from_attributes = True
