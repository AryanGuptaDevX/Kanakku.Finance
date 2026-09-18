from pydantic import BaseModel, Field, field_validator
from datetime import date as date_type, datetime
from typing import Optional
from backend.app.schemas.category import CategoryResponse

class TransactionBase(BaseModel):
    type: str = Field(..., pattern="^(income|expense)$")
    amount: float = Field(..., gt=0, description="Amount must be greater than zero")
    source_or_payee: str = Field(..., min_length=1, max_length=200)
    category_id: int
    description: Optional[str] = None
    date: date_type
    payment_method: Optional[str] = "Cash"
    is_recurring: Optional[bool] = False
    recurring_id: Optional[int] = None

    @field_validator("amount")

    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return round(v, 2)

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    source_or_payee: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    payment_method: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    category: CategoryResponse

    class Config:
        from_attributes = True
